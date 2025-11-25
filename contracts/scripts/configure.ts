import { ethers } from "hardhat";

async function main() {
  const nstFinanceAddress = process.env.CONTRACT_ADDRESS;
  const nstTokenAddress = process.env.NST_TOKEN_ADDRESS;
  const teamAddresses = process.env.TEAM_ADDRESSES?.split(",") || [];

  if (!nstFinanceAddress) {
    console.error("❌ Please set CONTRACT_ADDRESS in .env");
    process.exit(1);
  }

  console.log("⚙️  Configuring NST Finance ...\n");

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

  // Allocate team nodes if addresses provided
  if (teamAddresses.length > 0) {
    console.log("\n👥 Allocating team nodes...");
    
    for (const teamAddress of teamAddresses) {
      const [address, nodeCount] = teamAddress.split(":");
      if (!address || !nodeCount) {
        console.log("⚠️  Invalid format for team address:", teamAddress);
        continue;
      }

      console.log(`  Allocating ${nodeCount} node(s) to ${address}...`);
      try {
        const tx = await nstFinance.allocateTeamNodes(address, parseInt(nodeCount));
        await tx.wait();
        console.log(`  ✅ Allocated ${nodeCount} team node(s) to ${address}`);
      } catch (error: any) {
        console.log(`  ❌ Failed to allocate: ${error.message}`);
      }
    }
  } else {
    console.log("\n⚠️  No TEAM_ADDRESSES set in .env");
    console.log("Format: TEAM_ADDRESSES=0xAddress1:2,0xAddress2:3");
  }

  // Display current configuration
  console.log("\n" + "=".repeat(70));
  console.log("📊 Current Configuration");
  console.log("=".repeat(70));

  const treasury = await nstFinance.treasury();
  const claimEnabled = await nstFinance.claimEnabled();
  const stats = await nstFinance.getGlobalStats();
  const nodeStats = await nstFinance.getNodeStats();

  console.log("Treasury:", treasury);
  console.log("Claim Enabled:", claimEnabled);
  console.log("\nGlobal Stats:");
  console.log("  Total Nodes Issued:", stats[0].toString());
  console.log("  Total Donations USD:", ethers.formatEther(stats[1]));
  console.log("  Total Users:", stats[2].toString());
  console.log("  Nodes Remaining:", stats[3].toString());
  console.log("  Total Points:", ethers.formatEther(stats[4]));
  
  console.log("\nNode Distribution:");
  console.log("  Public Nodes Issued:", nodeStats[0].toString(), "/ 100");
  console.log("  Team Nodes Issued:", nodeStats[1].toString(), "/ 20");
  console.log("  Public Remaining:", nodeStats[2].toString());
  console.log("  Team Remaining:", nodeStats[3].toString());
  
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
