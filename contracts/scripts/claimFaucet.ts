import { ethers } from "hardhat";

async function main() {
  const TOKEN = "0x6292343e82801B46aA4AFEEd899e3336F14C47f4";
  const token = await ethers.getContractAt("CULTToken", TOKEN);
  const [signer] = await ethers.getSigners();

  console.log("Wallet:", signer.address);

  const balBefore = await token.balanceOf(signer.address);
  console.log("Balance before:", ethers.formatEther(balBefore), "CULT");

  console.log("\nCalling claimFaucet()...");
  const tx = await token.claimFaucet();
  const receipt = await tx.wait();

  console.log("✅ TX Hash:", receipt?.hash);
  console.log(
    "Explorer:",
    `https://testnet.monadexplorer.com/tx/${receipt?.hash}`,
  );

  const balAfter = await token.balanceOf(signer.address);
  console.log("\nBalance after:", ethers.formatEther(balAfter), "CULT");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
