import { ethers } from "hardhat";

async function main() {
  const nstFinanceAddress = process.env.CONTRACT_ADDRESS;
  const nstTokenAddress = process.env.NST_TOKEN_ADDRESS;

  if (!nstFinanceAddress) {
    console.error("❌ Please set CONTRACT_ADDRESS in .env");
    process.exit(1);
  }

  console.log("⚙️  Configuring NST Finance...\n");

  const [admin] = await ethers.getSigners();
  console.log("Admin account:", admin.address);

  const nstFinance = await ethers.getContractAt("NSTFinance", nstFinanceAddress);

  // Set NST Token if provided
  if (nstTokenAddress) {
    console.log("\n📝 Setting NST token address...");
    const tx1 = await nstFinance.setNSTToken(nstTokenAddress);
    await tx1.wait();
    console.log("✅ NST token set:", nstTokenAddress);

    // Enable claiming
    console.log("\n📝 Enabling NST claiming...");
    const tx2 = await nstFinance.setClaimEnabled(true);
    await tx2.wait();
    console.log("✅ Claiming enabled");
  } else {
    console.log("\n⚠️  NST_TOKEN_ADDRESS not set, skipping token configuration");
  }

  // Display current configuration
  console.log("\n" + "=".repeat(60));
  console.log("📊 Current Configuration");
  console.log("=".repeat(60));

  const treasury = await nstFinance.treasury();
  const claimEnabled = await nstFinance.claimEnabled();
  const stats = await nstFinance.getGlobalStats();

  console.log("Treasury:", treasury);
  console.log("Claim Enabled:", claimEnabled);
  console.log("Total Nodes Issued:", stats[0].toString());
  console.log("Total Donations USD:", ethers.formatEther(stats[1]));
  console.log("Total Users:", stats[2].toString());
  console.log("Nodes Remaining:", stats[3].toString());
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
