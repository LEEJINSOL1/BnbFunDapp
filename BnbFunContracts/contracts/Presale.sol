// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPancakeSwapRouter {
    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity);
}

contract Presale is Ownable, ReentrancyGuard {
    IERC20 public token;
    uint256 public constant INITIAL_RATE = 10_000_000 * 10**18; // 1 BNB = 1,000만 토큰
    uint256 public constant PRICE_INCREASE = 10; // 10% 증가
    uint256 public constant INCREASE_INTERVAL = 1 hours; // 1시간마다
    uint256 public constant TARGET_BNB = 5 ether; // 5 BNB 목표
    uint256 public constant LIQUIDITY_TOKENS = 50_000_000 * 10**18; // 5천만 토큰

    uint256 public startTime;
    uint256 public totalBNB;
    bool public liquidityAdded;

    mapping(address => uint256) public contributions; // 투자 BNB
    mapping(address => uint256) public tokenBalances; // 구매 토큰

    IPancakeSwapRouter public pancakeSwapRouter;
    address public constant PANCAKESWAP_ROUTER = 0xD99D1c33F9fC3444f8101754aBC46c52416550D1; // BSC Testnet 라우터

    event TokensPurchased(address buyer, uint256 bnbAmount, uint256 tokenAmount);
    event Refunded(address user, uint256 bnbAmount);
    event LiquidityAdded(uint256 tokenAmount, uint256 bnbAmount);

    constructor(IERC20 _token) Ownable(msg.sender) {
        token = _token;
        pancakeSwapRouter = IPancakeSwapRouter(PANCAKESWAP_ROUTER);
        startTime = block.timestamp;
    }

    function getCurrentRate() public view returns (uint256) {
        uint256 intervals = (block.timestamp - startTime) / INCREASE_INTERVAL;
        return INITIAL_RATE - (INITIAL_RATE * PRICE_INCREASE * intervals) / 100; // 토큰 수 감소
    }

    function buyTokens() external payable nonReentrant {
        require(!liquidityAdded, "Presale ended");
        require(msg.value > 0, "Must send BNB");

        uint256 rate = getCurrentRate();
        uint256 tokenAmount = (msg.value * rate) / 1 ether;
        require(token.balanceOf(address(this)) >= tokenAmount, "Not enough tokens");

        contributions[msg.sender] += msg.value;
        tokenBalances[msg.sender] += tokenAmount;
        totalBNB += msg.value;

        token.transfer(msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, msg.value, tokenAmount);

        if (totalBNB >= TARGET_BNB) {
            addLiquidity();
        }
    }

    function refund() external nonReentrant {
        require(!liquidityAdded, "Presale ended");
        uint256 bnbAmount = contributions[msg.sender];
        require(bnbAmount > 0, "No contribution");

        uint256 refundAmount = (bnbAmount * 90) / 100;
        uint256 tokenAmount = tokenBalances[msg.sender];

        contributions[msg.sender] = 0;
        tokenBalances[msg.sender] = 0;
        totalBNB -= bnbAmount;

        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
        payable(msg.sender).transfer(refundAmount);
        emit Refunded(msg.sender, refundAmount);
    }

    function addLiquidity() internal {
        require(!liquidityAdded, "Liquidity already added");
        liquidityAdded = true;

        token.approve(address(pancakeSwapRouter), LIQUIDITY_TOKENS);
        pancakeSwapRouter.addLiquidityETH{value: TARGET_BNB}(
            address(token),
            LIQUIDITY_TOKENS,
            LIQUIDITY_TOKENS * 90 / 100, // 10% 슬리피지 허용
            TARGET_BNB * 90 / 100,
            address(this),
            block.timestamp + 15 minutes
        );

        emit LiquidityAdded(LIQUIDITY_TOKENS, TARGET_BNB);

        uint256 remainingTokens = token.balanceOf(address(this));
        if (remainingTokens > 0) {
            token.transfer(owner(), remainingTokens);
        }
    }

    function withdrawBNB() external onlyOwner {
        require(liquidityAdded, "Presale not ended");
        payable(owner()).transfer(address(this).balance);
    }

    function updateToken(IERC20 _token) external onlyOwner {
        require(address(token) == address(0), "Token already set");
        token = _token;
    }
}