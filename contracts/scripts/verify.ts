import { run } from "hardhat";

async function main() {
  const nstFinanceAddress = process.env.CONTRACT_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;

  if (!nstFinanceAddress || !treasuryAddress) {
    console.error("❌ Please set CONTRACT_ADDRESS and TREASURY_ADDRESS in .env");
    process.exit(1);
  }

  console.log("🔍 Verifying NSTFinance contract...");
  console.log("Contract:", nstFinanceAddress);
  console.log("Treasury:", treasuryAddress);

  try {
    await run("verify:verify", {
      address: nstFinanceAddress,
      constructorArguments: [treasuryAddress],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.error("❌ Verification failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
