// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./customToken.sol";
import "./Presale.sol";

contract TokenFactory is Ownable {
    uint256 public constant CREATE_FEE = 0.01 ether;

    event TokenCreated(address tokenAddress, address presaleAddress);

    constructor() Ownable(msg.sender) {}

    function createToken(string memory name, string memory symbol) external payable returns (address, address) {
        require(msg.value == CREATE_FEE, "Must send exactly 0.01 BNB");

        // Presale 먼저 생성
        Presale newPresale = new Presale(IERC20(address(0)));
        address presaleAddress = address(newPresale);

        // CustomToken 생성 및 Presale로 토큰 전송
        CustomToken newToken = new CustomToken(name, symbol, presaleAddress);
        address tokenAddress = address(newToken);

        // Presale에 토큰 설정 및 소유권 이전
        newPresale.updateToken(IERC20(tokenAddress));
        newPresale.transferOwnership(msg.sender);

        emit TokenCreated(tokenAddress, presaleAddress);
        return (tokenAddress, presaleAddress);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}