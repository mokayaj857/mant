// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TicketNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    address public core; // parent AvaraCore

    // ticket -> eventId
    mapping(uint256 => uint256) public ticketEvent;
    // ticket provenance tracking (simple state)
    mapping(uint256 => address[]) public provenance;

    modifier onlyCore() {
        require(msg.sender == core, "only core");
        _;
    }

    constructor(address _core) ERC721("Avara Ticket", "AVT") Ownable(_core) {
        core = _core;
    }

    function mintTicket(address to, string memory uri, uint256 eventId) external onlyCore returns (uint256) {
        _tokenIds++;
        uint256 id = _tokenIds;
        _safeMint(to, id);
        _setTokenURI(id, uri);
        ticketEvent[id] = eventId;
        provenance[id].push(to);
        return id;
    }

    // Called from core when transferred/sold to record provenance
    function recordProvenance(uint256 tokenId, address to) external onlyCore {
        provenance[tokenId].push(to);
    }
    
    // Public function to set token URI (only callable by owner)
    function setTokenURI(uint256 tokenId, string memory tokenURI_) external onlyOwner {
        _setTokenURI(tokenId, tokenURI_);
    }
    
    // Get the provenance history for a ticket
    function getProvenance(uint256 tokenId) external view returns (address[] memory) {
        return provenance[tokenId];
    }

    // Allow core to burn (invalidate)
    function burn(uint256 tokenId) external onlyCore {
        _burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}