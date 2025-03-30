// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CustomToken is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        address presaleAddress
    ) ERC20(name, symbol) Ownable(msg.sender) {
        uint256 initialSupply = 100_000_000 * 10**18; // 1억 토큰
        _mint(address(this), initialSupply);
        if (presaleAddress != address(0)) {
            _transfer(address(this), presaleAddress, initialSupply);
        }
    }
}