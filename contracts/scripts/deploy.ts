import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Get platform wallet from env or use deployer
  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS || deployer.address;

  console.log("Platform wallet:", platformWallet);

  // Deploy Factory
  const ArtTokenFactory = await ethers.getContractFactory("ArtTokenFactory");
  const factory = await ArtTokenFactory.deploy(platformWallet);

  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  console.log("ArtTokenFactory deployed to:", factoryAddress);
  console.log("\nSave this to your .env.local:");
  console.log(`NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS=${factoryAddress}`);

  console.log("\nVerify on BSCScan:");
  console.log(`npx hardhat verify --network bscTestnet ${factoryAddress} ${platformWallet}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
