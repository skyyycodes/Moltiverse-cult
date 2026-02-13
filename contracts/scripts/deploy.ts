import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MON");

  // Deploy CultRegistry
  const CultRegistry = await ethers.getContractFactory("CultRegistry");
  const registry = await CultRegistry.deploy();
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("CultRegistry deployed to:", registryAddress);

  // Deploy FaithStaking (linked to CultRegistry)
  const FaithStaking = await ethers.getContractFactory("FaithStaking");
  const staking = await FaithStaking.deploy(registryAddress);
  await staking.waitForDeployment();

  const stakingAddress = await staking.getAddress();
  console.log("FaithStaking deployed to:", stakingAddress);

  console.log("\n--- Update your .env file ---");
  console.log(`CULT_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`FAITH_STAKING_ADDRESS=${stakingAddress}`);
  console.log("-----------------------------");
}
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
