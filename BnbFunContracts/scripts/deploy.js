const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 계정 잔액 확인
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "BNB");

  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy();
  await tokenFactory.waitForDeployment();
  const tokenFactoryAddress = await tokenFactory.getAddress();
  console.log("TokenFactory deployed to:", tokenFactoryAddress);

  const tx = await tokenFactory.createToken("Test Token", "TST", {
    value: hre.ethers.parseEther("0.01"),
    gasLimit: 3000000, // 가스 한도 증가
  });
  const receipt = await tx.wait();

  const event = receipt.logs.find((log) => log.topics[0] === hre.ethers.id("TokenCreated(address,address)"));
  const [tokenAddress, presaleAddress] = hre.ethers.AbiCoder.defaultAbiCoder().decode(
    ["address", "address"],
    event.data
  );

  console.log("Test Token deployed to:", tokenAddress);
  console.log("Presale deployed to:", presaleAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});