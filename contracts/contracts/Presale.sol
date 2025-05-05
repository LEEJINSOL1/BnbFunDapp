// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Presale is Ownable {
    mapping(address => uint256) public raisedFunds; // 토큰별 모금액 (BNB)
    uint256 public constant TOKEN_PRICE = 0.0001 ether; // 1 토큰당 0.0001 BNB

event TokenBought(address indexed token, address indexed buyer, uint256 amount, uint256 bnbValue);
event TokenSold(address indexed token, address indexed seller, uint256 amount, uint256 bnbValue);

constructor(address initialOwner) Ownable(initialOwner) {}

function buyTokens(address token) external payable {
    require(msg.value > 0, "Must send BNB to buy tokens");
    uint256 tokenAmount = (msg.value * 10**18) / TOKEN_PRICE; // BNB로 구매 가능한 토큰 수
    require(IERC20(token).balanceOf(address(this)) >= tokenAmount, "Insufficient tokens in presale");

    raisedFunds[token] += msg.value; // 모금액 업데이트
    IERC20(token).transfer(msg.sender, tokenAmount);
    emit TokenBought(token, msg.sender, tokenAmount, msg.value);
}

function sellTokens(address token, uint256 tokenAmount) external {
    require(tokenAmount > 0, "Must sell at least 1 token");
    require(IERC20(token).balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");

    uint256 bnbValue = (tokenAmount * TOKEN_PRICE) / 10**18; // 토큰 판매로 받을 BNB
    require(address(this).balance >= bnbValue, "Insufficient BNB in presale");

    IERC20(token).transferFrom(msg.sender, address(this), tokenAmount);
    payable(msg.sender).transfer(bnbValue);
    emit TokenSold(token, msg.sender, tokenAmount, bnbValue);
}

function withdraw() external onlyOwner {
    uint256 balance = address(this).balance;
    require(balance > 0, "No funds to withdraw");
    payable(owner()).transfer(balance);
}

}

