const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy Presale
    const Presale = await hre.ethers.getContractFactory("Presale");
    const presale = await Presale.deploy(deployer.address);
    await presale.waitForDeployment();
    const presaleAddress = await presale.getAddress();
    console.log("Presale deployed to:", presaleAddress);
    // Previous: 0x8b85E98D30E97C3b7221DaA39E733c9E48eae2Cb

    // Deploy TokenFactory
    const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy(presaleAddress);
    await tokenFactory.waitForDeployment();
    const tokenFactoryAddress = await tokenFactory.getAddress();
    console.log("TokenFactory deployed to:", tokenFactoryAddress);
    // Previous: 0x1fD5780489f6cdC41f012A68cB98159c1A1cd0F0
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});