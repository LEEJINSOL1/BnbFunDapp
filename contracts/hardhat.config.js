require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { BSC_TESTNET_URL, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},
    bsctestnet: {
      url: BSC_TESTNET_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: PRIVATE_KEY ? [`0x${PRIVATE_KEY}`] : [],
    },
  },
};