import { ethers } from "hardhat";

async function main() {
  const TOKEN = "0x6292343e82801B46aA4AFEEd899e3336F14C47f4";
  const TO = "0x5B50AFe39f908c90E41806a7529d7374a4246515";

  const token = await ethers.getContractAt("CULTToken", TOKEN);

  console.log("Minting 100 CULT to", TO);
  const tx = await token.faucet(TO, ethers.parseEther("100"));
  const receipt = await tx.wait();
  console.log("✅ TX:", receipt?.hash);
  console.log("Explorer:", `https://testnet.monadexplorer.com/tx/${receipt?.hash}`);

  const bal = await token.balanceOf(TO);
  console.log("Balance:", ethers.formatEther(bal), "CULT");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
