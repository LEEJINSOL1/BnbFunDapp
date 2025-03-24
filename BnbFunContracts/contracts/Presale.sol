// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IPancakeSwapRouter {
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
}

contract Presale is Ownable {
    IERC20 public token;
    uint256 public constant INITIAL_RATE = 10_000_000; // 1 BNB = 1,000만 토큰
    uint256 public constant PRICE_INCREASE = 10; // 10% 증가 (단리)
    uint256 public constant INCREASE_INTERVAL = 1 hours; // 1시간마다 증가
    uint256 public constant TARGET_BNB = 5 ether; // 5 BNB 목표
    uint256 public constant LIQUIDITY_TOKENS = 50_000_000 * 10**18; // 유동성 풀에 5,000만 토큰

    uint256 public startTime;
    uint256 public totalBNB;
    mapping(address => uint256) public contributions;
    mapping(address => uint256) public tokenBalances;
    bool public liquidityAdded;

    IPancakeSwapRouter public pancakeSwapRouter;
    address public constant PANCAKESWAP_ROUTER = 0x9A082015c919AD0E47861e5Db9A1c7070E81A2C7; // BSC Testnet 라우터 주소 (수정됨)

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
        uint256 rate = INITIAL_RATE;
        for (uint256 i = 0; i < intervals; i++) {
            rate = rate + (rate * PRICE_INCREASE) / 100;
        }
        return rate;
    }

    function buyTokens() external payable {
        require(!liquidityAdded, "Presale ended");
        require(msg.value > 0, "Must send BNB");

        uint256 rate = getCurrentRate();
        uint256 tokenAmount = msg.value * rate;
        require(token.balanceOf(address(this)) >= tokenAmount, "Not enough tokens");

        contributions[msg.sender] += msg.value;
        tokenBalances[msg.sender] += tokenAmount;
        totalBNB += msg.value;

        emit TokensPurchased(msg.sender, msg.value, tokenAmount);

        if (totalBNB >= TARGET_BNB) {
            addLiquidity();
        }
    }

    function refund() external {
        require(!liquidityAdded, "Presale ended");
        uint256 bnbAmount = contributions[msg.sender];
        require(bnbAmount > 0, "No contribution");

        uint256 refundAmount = (bnbAmount * 90) / 100;
        uint256 tokenAmount = tokenBalances[msg.sender];

        contributions[msg.sender] = 0;
        tokenBalances[msg.sender] = 0;
        totalBNB -= bnbAmount;

        token.transfer(owner(), tokenAmount);
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
            LIQUIDITY_TOKENS,
            TARGET_BNB,
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
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        token.transfer(owner(), balance);
    }

    receive() external payable {}
}