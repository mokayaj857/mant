// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
Avara — compact implementation:
- TicketNFT: ERC721 tickets with provenance and KRNL-signed actions
- POAPBadge: ERC721 POAPs (can be soulbound)
- Marketplace: simple listing/resale with organizer rules
- Reputation: increments when POAP issued
- KRNL integration: verify signatures from trusted KRNL_SIGNER

NOTE: Uses OpenZeppelin contracts. For real deploy, import from npm @openzeppelin/contracts.
*/

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ticket.sol";
import "./poap.sol";

contract AvaraCore is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // --- Events ---
    event TicketMinted(uint256 indexed ticketId, uint256 indexed eventId, address indexed owner);
    event TicketScanned(uint256 indexed ticketId, uint256 indexed eventId, address indexed scanner);
    event POAPMinted(uint256 indexed poapId, uint256 indexed eventId, address indexed attendee);
    event Listed(uint256 indexed ticketId, uint256 price, address seller);
    event Sale(uint256 indexed ticketId, address indexed buyer, uint256 price);
    event ResaleRuleUpdated(uint256 indexed eventId, uint256 maxPrice, uint16 maxTransfers);

    // --- KRNL signer (off-chain orchestrator) ---
    address public krnlSigner;
    
    // --- Storage: instances ---
    TicketNFT public tickets;
    POAPNFT public poaps;
    bool public poapSoulbound = true; // Default to soulbound POAPs

    constructor(address _krnlSigner) Ownable(msg.sender) {
        require(_krnlSigner != address(0), "KRNL signer required");
        krnlSigner = _krnlSigner;
        
        // Deploy the POAPNFT contract with the soulbound flag
        poaps = new POAPNFT(poapSoulbound);
        
        // Deploy the TicketNFT contract
        tickets = new TicketNFT(address(this));
        
        // Transfer ownership of token contracts to this core for controlled operations
        poaps.transferOwnership(address(this));
        tickets.transferOwnership(address(this));
    }

    // Admin can update KRNL signer (e.g., set to KRNL testnet/mainnet signer)
    function setKrnlSigner(address _s) external onlyOwner {
        require(_s != address(0), "invalid signer");
        krnlSigner = _s;
    }

    // --- Event / Market rules ---
    struct EventRules {
        address organizer;
        uint256 maxResalePrice; // 0 => unlimited
        uint16 maxTransfers; // 0 => unlimited
    }

    mapping(uint256 => EventRules) public rules; // eventId -> rules
    mapping(uint256 => uint16) public ticketTransfers; // ticketId -> times transferred

    function setEventRules(uint256 eventId, address organizer, uint256 maxResalePrice, uint16 maxTransfers) external onlyOwner {
        rules[eventId] = EventRules({ organizer: organizer, maxResalePrice: maxResalePrice, maxTransfers: maxTransfers });
        emit ResaleRuleUpdated(eventId, maxResalePrice, maxTransfers);
    }

    // --- Simple marketplace listing (off-chain order, on-chain settle) ---
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Listing) public listings;

    // sellers must have approved core as operator for token
    function listTicket(uint256 ticketId, uint256 price) external nonReentrant {
        require(tickets.ownerOf(ticketId) == msg.sender, "not owner");
        uint256 eventId = tickets.ticketEvent(ticketId);
        require(rules[eventId].organizer != address(0), "event not configured");
        listings[ticketId] = Listing({ seller: msg.sender, price: price, active: true });
        emit Listed(ticketId, price, msg.sender);
    }

    function buyTicket(uint256 ticketId) external payable nonReentrant {
        Listing memory l = listings[ticketId];
        require(l.active, "not listed");
        require(msg.value == l.price, "wrong price");

        uint256 eventId = tickets.ticketEvent(ticketId);
        EventRules memory r = rules[eventId];

        // respect maxResalePrice (if seller is not organizer and it's a resale)
        if (r.maxResalePrice > 0 && l.seller != r.organizer) {
            require(l.price <= r.maxResalePrice, "price above cap");
        }

        // transfer funds immediately to seller (could be improved with royalties/fees)
        (bool ok, ) = l.seller.call{value: msg.value}("");
        require(ok, "transfer failed");

        // transfer NFT
        tickets.transferFrom(l.seller, msg.sender, ticketId);
        tickets.recordProvenance(ticketId, msg.sender);

        // track transfers and enforce maxTransfers
        ticketTransfers[ticketId] += 1;
        if (r.maxTransfers > 0) {
            require(ticketTransfers[ticketId] <= r.maxTransfers, "transfer limit reached");
        }

        // deactivate listing
        listings[ticketId].active = false;

        emit Sale(ticketId, msg.sender, l.price);
    }

    // organizer can cancel listing
    function cancelListing(uint256 ticketId) external {
        Listing memory l = listings[ticketId];
        require(l.active, "inactive");
        require(msg.sender == l.seller || msg.sender == owner(), "not allowed");
        listings[ticketId].active = false;
    }

    // --- KRNL verification utilities ---
    // KRNL is expected to sign a message with this typed payload:
    // keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encodePacked(action, ticketId, eventId, account, timestamp, nonce))))
    // Example actions: "MINT", "CHECKIN", "ANTI_BOT_PASS"
    function _verifyKrnlSignature(
        string memory action,
        uint256 ticketId,
        uint256 eventId,
        address account,
        uint256 timestamp,
        uint256 nonce,
        bytes memory signature
    ) internal view returns (bool) {
        bytes32 h = keccak256(abi.encodePacked(action, ticketId, eventId, account, timestamp, nonce));
        bytes32 ethSigned = h.toEthSignedMessageHash();
        address signer = ECDSA.recover(ethSigned, signature);
        return signer == krnlSigner;
    }

    // prevent replay of signed proofs
    mapping(bytes32 => bool) public usedProof;

    // --- Ticket minting via KRNL-signed mint proof ---
    // Organizer or KRNL can execute mint when signed proof is provided
    function mintTicketWithKrnl(
        address to,
        string calldata uri,
        uint256 eventId,
        uint256 timestamp,
        uint256 nonce,
        bytes calldata krnlSignature
    ) external nonReentrant returns (uint256) {
        // verify signature by KRNL
        bool ok = _verifyKrnlSignature("MINT", 0, eventId, to, timestamp, nonce, krnlSignature);
        require(ok, "invalid KRNL mint proof");

        bytes32 proofKey = keccak256(abi.encodePacked("MINT", to, eventId, timestamp, nonce));
        require(!usedProof[proofKey], "proof used");
        usedProof[proofKey] = true;

        uint256 id = tickets.mintTicket(to, uri, eventId);
        emit TicketMinted(id, eventId, to);
        return id;
    }

    // --- Check-in / POAP issuance via KRNL-signed check-in proof ---
    function checkInAndMintPOAP(
        uint256 ticketId,
        uint256 eventId,
        string calldata poapUri,
        uint256 timestamp,
        uint256 nonce,
        bytes calldata krnlSignature
    ) external nonReentrant returns (uint256) {
        // verifying that KRNL vouches the check-in (it may have verified geofence, device, etc)
        bool ok = _verifyKrnlSignature("CHECKIN", ticketId, eventId, msg.sender, timestamp, nonce, krnlSignature);
        require(ok, "invalid KRNL checkin proof");

        bytes32 proofKey = keccak256(abi.encodePacked("CHECKIN", ticketId, msg.sender, eventId, timestamp, nonce));
        require(!usedProof[proofKey], "proof used");
        usedProof[proofKey] = true;

        // ensure caller owns the ticket
        require(tickets.ownerOf(ticketId) == msg.sender, "not ticket owner");
        // mark scanned event (we emit event)
        emit TicketScanned(ticketId, eventId, msg.sender);

        // mint a POAP badge to msg.sender
        uint256 poapId = poaps.mintPOAP(msg.sender, poapUri);

        // increment reputation
        reputation[msg.sender] += 1;

        emit POAPMinted(poapId, eventId, msg.sender);
        return poapId;
    }

    // --- Reputation ---
    mapping(address => uint256) public reputation;

    // admin functions to set reputation or bulk add (onlyOwner)
    function setReputation(address who, uint256 score) external onlyOwner {
        reputation[who] = score;
    }

    // --- Emergency / admin controls ---
    function emergencyBurnTicket(uint256 ticketId) external onlyOwner {
        tickets.burn(ticketId);
    }

    // change token URIs (organizer or owner privileges could be added)
    function setTicketURI(uint256 ticketId, string memory uri) external onlyOwner {
        tickets.setTokenURI(ticketId, uri);
    }

    function setPOAPURI(uint256 poapId, string memory uri) external onlyOwner {
        poaps.setTokenURI(poapId, uri);
    }

    // --- View helpers ---
    function getTicketProvenance(uint256 ticketId) external view returns (address[] memory) {
        return tickets.getProvenance(ticketId);
    }

    // payable fallback to accept ETH (marketplace)
    receive() external payable {}
}