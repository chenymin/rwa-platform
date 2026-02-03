// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ArtToken is ERC20 {
    string public metadataURI;

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        string memory _metadataURI
    ) ERC20(name, symbol) {
        metadataURI = _metadataURI;
        _mint(msg.sender, totalSupply);
    }
}
