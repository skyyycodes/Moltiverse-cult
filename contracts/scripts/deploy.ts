import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying CultRegistry with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MON");

  const CultRegistry = await ethers.getContractFactory("CultRegistry");
  const registry = await CultRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("CultRegistry deployed to:", address);
  console.log("\nUpdate your .env file:");
  console.log(`CULT_REGISTRY_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
