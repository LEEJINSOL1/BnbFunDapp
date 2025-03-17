require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.28",
  networks: {
    bnbTestnet: {
      url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545", // BNB Chain 공식 테스트넷 노드
      accounts: [PRIVATE_KEY],
      chainId: 97,
    },
  },
};