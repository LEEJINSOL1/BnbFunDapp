// contracts/CustomToken.sol
pragma solidity ^0.8.20;

contract CustomToken {
    string public name = "Custom Token";
    string public symbol = "CTK";
    uint256 public totalSupply = 1000000;

    mapping(address => uint256) public balanceOf;

    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
}