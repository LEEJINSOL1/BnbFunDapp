// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenFactory is Ownable {
    uint256 public constant CREATE_FEE = 0.01 ether;
    address public presaleContract;

    event TokenCreated(address tokenAddress, string name, string symbol);

    constructor(address _presaleContract) Ownable(msg.sender) {
        require(_presaleContract != address(0), "Presale contract address cannot be zero");
        presaleContract = _presaleContract;
    }

    function createToken(string memory name, string memory symbol) external payable {
        require(msg.value == CREATE_FEE, "Must send 0.01 BNB to create token");
        require(bytes(name).length > 0, "Token name cannot be empty");
        require(bytes(symbol).length > 0, "Token symbol cannot be empty");

        CustomToken newToken = new CustomToken(name, symbol, 100_000_000 * 10**18);
        require(newToken.transfer(presaleContract, 100_000_000 * 10**18), "Token transfer failed");

        emit TokenCreated(address(newToken), name, symbol);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}

contract CustomToken is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply) 
        ERC20(name, symbol) 
    {
        _mint(msg.sender, initialSupply);
    }
}