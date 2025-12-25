// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract POAPNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 public nextId = 1;
    bool public soulbound;

    constructor(bool _soulbound) ERC721("Avara POAP", "APOAP") Ownable(msg.sender) {
        soulbound = _soulbound;
    }

    function mintPOAP(address to, string memory metadataURI)
        external
        onlyOwner
        returns (uint256)
    {
        uint256 id = nextId++;
        _safeMint(to, id);
        _setTokenURI(id, metadataURI);
        return id;
    }
    
    // Public function to set token URI (only callable by owner)
    function setTokenURI(uint256 tokenId, string memory tokenURI_) external onlyOwner {
        _setTokenURI(tokenId, tokenURI_);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override(ERC721)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        require(!soulbound || from == address(0) || to == address(0), "Soulbound: non-transferable");
        return super._update(to, tokenId, auth);
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