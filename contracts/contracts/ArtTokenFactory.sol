// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ArtToken.sol";

contract ArtTokenFactory is Ownable {
    address public platformWallet;
    address[] public allTokens;

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 totalSupply,
        address indexed artist,
        string metadataURI
    );

    constructor(address _platformWallet) Ownable(msg.sender) {
        platformWallet = _platformWallet;
    }

    function createArtToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        string memory metadataURI,
        address artistAddress
    ) external onlyOwner returns (address) {
        ArtToken newToken = new ArtToken(name, symbol, totalSupply, metadataURI);
        address tokenAddress = address(newToken);

        // Distribute: 80% to artist, 20% to platform
        uint256 artistShare = (totalSupply * 80) / 100;
        uint256 platformShare = totalSupply - artistShare;

        newToken.transfer(artistAddress, artistShare);
        newToken.transfer(platformWallet, platformShare);

        allTokens.push(tokenAddress);

        emit TokenCreated(
            tokenAddress,
            name,
            symbol,
            totalSupply,
            artistAddress,
            metadataURI
        );

        return tokenAddress;
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    function setPlatformWallet(address _platformWallet) external onlyOwner {
        platformWallet = _platformWallet;
    }
}
