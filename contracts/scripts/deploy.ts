import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying NST Finance...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB\n");

  // Get treasury address from env or use deployer
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  console.log("Treasury address:", treasuryAddress);

  // Deploy NSTFinance
  console.log("\n📝 Deploying NSTFinance contract...");
  const NSTFinance = await ethers.getContractFactory("NSTFinance");
  const nstFinance = await NSTFinance.deploy(treasuryAddress);
  await nstFinance.waitForDeployment();

  const nstFinanceAddress = await nstFinance.getAddress();
  console.log("✅ NSTFinance deployed to:", nstFinanceAddress);

  // Add supported tokens
  console.log("\n📝 Adding supported tokens...");
  
  // BSC Mainnet addresses (use testnet addresses for testnet deployment)
  const network = await ethers.provider.getNetwork();
  let usdtAddress: string;
  let usdcAddress: string;

  if (network.chainId === 56n) {
    // BSC Mainnet
    usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
    usdcAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
  } else if (network.chainId === 97n) {
    // BSC Testnet
    usdtAddress = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
    usdcAddress = "0x64544969ed7EBf5f083679233325356EbE738930";
  } else {
    // Local/Hardhat - deploy mocks
    console.log("Deploying mock tokens for local testing...");
    
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();
    usdtAddress = await mockUSDT.getAddress();
    console.log("MockUSDT deployed to:", usdtAddress);

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    console.log("MockUSDC deployed to:", usdcAddress);
  }

  // Add USDT (6 decimals)
  const tx1 = await nstFinance.addSupportedToken(usdtAddress, 6);
  await tx1.wait();
  console.log("✅ USDT added:", usdtAddress);

  // Add USDC (6 decimals)
  const tx2 = await nstFinance.addSupportedToken(usdcAddress, 6);
  await tx2.wait();
  console.log("✅ USDC added:", usdcAddress);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 Deployment Complete!");
  console.log("=".repeat(60));
  console.log("NSTFinance:", nstFinanceAddress);
  console.log("Treasury:", treasuryAddress);
  console.log("USDT:", usdtAddress);
  console.log("USDC:", usdcAddress);
  console.log("=".repeat(60));
  console.log("\n⚠️  Next Steps:");
  console.log("1. Deploy NST token");
  console.log("2. Call setNSTToken() with NST token address");
  console.log("3. Transfer NST tokens to contract for rewards");
  console.log("4. Call setClaimEnabled(true) to enable claiming");
  console.log("=".repeat(60));

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    nstFinance: nstFinanceAddress,
    treasury: treasuryAddress,
    usdt: usdtAddress,
    usdc: usdcAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
