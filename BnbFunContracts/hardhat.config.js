require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

console.log("BSC_TESTNET_URL:", process.env.BSC_TESTNET_URL); // 디버깅용
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY); // 디버깅용

module.exports = {
  solidity: "0.8.28",
  networks: {
    bscTestnet: {
      url: process.env.BSC_TESTNET_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};