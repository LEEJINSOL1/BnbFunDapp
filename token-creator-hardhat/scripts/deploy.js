const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const MyToken = await hre.ethers.getContractFactory("contracts/MyToken.sol:MyToken");
  const token = await MyToken.deploy("Test Token", "TTK", "A test token");
  await token.waitForDeployment(); // 배포 완료 대기

  console.log("MyToken deployed to:", token.target); // .address 대신 .target 사용
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });