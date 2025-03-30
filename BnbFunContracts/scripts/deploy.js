const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 테스트용 토큰 배포 (CustomToken 사용)
  const CustomToken = await hre.ethers.getContractFactory("contracts/TokenFactory.sol:CustomToken");
  const testToken = await CustomToken.deploy("Test Token", "TST", hre.ethers.parseEther("100000000")); // 1억 토큰
  await testToken.waitForDeployment();
  const testTokenAddress = await testToken.getAddress();
  console.log("Test Token deployed to:", testTokenAddress);

  // Presale 컨트랙트 배포
  const Presale = await hre.ethers.getContractFactory("Presale");
  const presale = await Presale.deploy(testTokenAddress); // 테스트 토큰 주소 전달
  await presale.waitForDeployment();
  const presaleAddress = await presale.getAddress();
  console.log("Presale deployed to:", presaleAddress);

  // TokenFactory 컨트랙트 배포
  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy(presaleAddress);
  await tokenFactory.waitForDeployment();
  console.log("TokenFactory deployed to:", await tokenFactory.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});