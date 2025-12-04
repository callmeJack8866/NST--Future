import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying NST Finance (with Team Node Reservations)...\n");

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

  // Verify contract constants
  console.log("\n📊 Contract Configuration:");
  console.log("  Minimum Donation:", ethers.formatEther(await nstFinance.MINIMUM_DONATION()), "USD");
  console.log("  Node Price:", ethers.formatEther(await nstFinance.NODE_PRICE()), "USD");
  console.log("  Max Nodes Per User:", (await nstFinance.MAX_NODES_PER_USER()).toString());
  console.log("  Max Total Nodes:", (await nstFinance.MAX_TOTAL_NODES()).toString());
  console.log("  Max Public Nodes:", (await nstFinance.MAX_PUBLIC_NODES()).toString());
  console.log("  Team Reserved Nodes:", (await nstFinance.TEAM_RESERVED_NODES()).toString());
  console.log("  Team Lock Duration:", Number(await nstFinance.TEAM_LOCK_DURATION()) / 86400, "days");
  console.log("  Node Holder Points Multiplier:", (await nstFinance.NODE_HOLDER_MULTIPLIER()).toString() + "x");

  // Token configuration
  const network = await ethers.provider.getNetwork();
  let usdtAddress: string;
  let usdcAddress: string;
  let mockNSTAddress: string | undefined;
  let usdtDecimals: number;
  let usdcDecimals: number;

  if (network.chainId === 56n) {
    // =========================================================================
    // BSC MAINNET - Use real stablecoin addresses (NO minting available)
    // =========================================================================
    usdtAddress = "0x55d398326f99059fF775485246999027B3197955"; // BSC-USD (USDT)
    usdcAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; // USD Coin (USDC)
    usdtDecimals = 18;
    usdcDecimals = 18;

  } else if (network.chainId === 97n) {
    // =========================================================================
    // BSC TESTNET - Deploy our own mock tokens for full control
    // =========================================================================
    // Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();
    usdtAddress = await mockUSDT.getAddress();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();

    usdtDecimals = 18;
    usdcDecimals = 18;

    // Mint tokens to deployer for testing
    const mintAmount = ethers.parseEther("10000000"); // 10M tokens

    const mintTx1 = await mockUSDT.mint(deployer.address, mintAmount);
    await mintTx1.wait();

    const mintTx2 = await mockUSDC.mint(deployer.address, mintAmount);
    await mintTx2.wait();

    // Deploy MockNST for testnet
    const MockNST = await ethers.getContractFactory("MockNST");
    const mockNST = await MockNST.deploy();
    await mockNST.waitForDeployment();
    mockNSTAddress = await mockNST.getAddress();

    // Setup NST for testnet testing
    
    const setNSTTx = await nstFinance.setNSTToken(mockNSTAddress);
    await setNSTTx.wait();

    const transferAmount = ethers.parseEther("10000000"); // 10M NST
    const transferTx = await mockNST.transfer(nstFinanceAddress, transferAmount);
    await transferTx.wait();

    const enableClaimTx = await nstFinance.setClaimEnabled(true);
    await enableClaimTx.wait();

  } else {
    // =========================================================================
    // LOCAL/HARDHAT - Deploy mock tokens
    // =========================================================================
    
    // Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();
    usdtAddress = await mockUSDT.getAddress();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();

    usdtDecimals = 18;
    usdcDecimals = 18;

    // Deploy MockNST
    const MockNST = await ethers.getContractFactory("MockNST");
    const mockNST = await MockNST.deploy();
    await mockNST.waitForDeployment();
    mockNSTAddress = await mockNST.getAddress();
    console.log("  ✅ MockNST deployed to:", mockNSTAddress);

    // Setup for local testing
    console.log("\n🔧 Setting up local test environment...");
    
    const setNSTTx = await nstFinance.setNSTToken(mockNSTAddress);
    await setNSTTx.wait();
    console.log("  ✅ NST token set");

    const transferAmount = ethers.parseEther("10000000"); // 10M NST
    const transferTx = await mockNST.transfer(nstFinanceAddress, transferAmount);
    await transferTx.wait();
    console.log("  ✅ Transferred 10M NST to contract");

    const enableClaimTx = await nstFinance.setClaimEnabled(true);
    await enableClaimTx.wait();
    console.log("  ✅ NST claiming enabled");
  }

  // Add supported tokens to NSTFinance
  console.log("\n📝 Adding supported tokens to NSTFinance...");
  const addUsdtTx = await nstFinance.addSupportedToken(usdtAddress, usdtDecimals);
  await addUsdtTx.wait();
  console.log(`  ✅ USDT added (${usdtDecimals} decimals):`, usdtAddress);

  const addUsdcTx = await nstFinance.addSupportedToken(usdcAddress, usdcDecimals);
  await addUsdcTx.wait();
  console.log(`  ✅ USDC added (${usdcDecimals} decimals):`, usdcAddress);

  // Get initial stats
  const stats = await nstFinance.getGlobalStats();
  console.log("\n📈 Initial Global Stats:");
  console.log("  Total Nodes Issued:", stats[0].toString());
  console.log("  Total Donations:", ethers.formatEther(stats[1]), "USD");
  console.log("  Total Users:", stats[2].toString());
  console.log("  Nodes Remaining:", stats[3].toString());
  console.log("  Total Points Distributed:", ethers.formatEther(stats[4]));

  // Get node distribution stats
  const nodeStats = await nstFinance.getNodeStats();
  console.log("\n📊 Node Distribution:");
  console.log("  Public Nodes Issued:", nodeStats[0].toString(), "/ 100");
  console.log("  Team Nodes Issued:", nodeStats[1].toString(), "/ 20");
  console.log("  Public Remaining:", nodeStats[2].toString());
  console.log("  Team Remaining:", nodeStats[3].toString());

  // Get block info for deployment data
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);

  // Create deployment data object
  const deploymentData = {
    version: "1.2.0",
    network: {
      name: network.name,
      chainId: Number(network.chainId),
    },
    contracts: {
      NSTFinance: {
        address: nstFinanceAddress,
      },
      USDT: {
        address: usdtAddress,
        decimals: usdtDecimals,
      },
      USDC: {
        address: usdcAddress,
        decimals: usdcDecimals,
      },
      ...(mockNSTAddress && {
        NST: {
          address: mockNSTAddress,
          decimals: 18,
        },
      }),
    },
    configuration: {
      treasury: treasuryAddress,
      minimumDonation: "100",
      nodePrice: "2000",
      maxNodesPerUser: 5,
      maxTotalNodes: 120,
      maxPublicNodes: 100,
      teamReservedNodes: 20,
      teamLockDuration: "730 days",
      pointsPerUSD: 1,
      nodeHolderMultiplier: 2,
      nodeReferralReward: "500",
      donationReferralRewardPer1000: "100",
      freeNodeReferralThreshold: 10,
    },
    deployment: {
      deployer: deployer.address,
      blockNumber: blockNumber,
      blockTimestamp: block?.timestamp || 0,
      timestamp: new Date().toISOString(),
      transactionHash: nstFinance.deploymentTransaction()?.hash,
    },
  };

  // Save deploy.json (addresses only)
  const deployJsonPath = path.join(__dirname, "..", "deploy.json");
  fs.writeFileSync(deployJsonPath, JSON.stringify(deploymentData, null, 2));
  console.log("\n💾 Deployment saved to: deploy.json");

  // Save to deployments folder with timestamp
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const timestampedFilename = `deployment-${network.chainId}-${Date.now()}.json`;
  const timestampedPath = path.join(deploymentsDir, timestampedFilename);
  fs.writeFileSync(timestampedPath, JSON.stringify(deploymentData, null, 2));
  console.log("💾 Backup saved to:", `deployments/${timestampedFilename}`);

  // Create/update latest deployment file
  const latestFilePath = path.join(deploymentsDir, `latest-${network.chainId}.json`);
  fs.writeFileSync(latestFilePath, JSON.stringify(deploymentData, null, 2));
  console.log("💾 Latest deployment:", `deployments/latest-${network.chainId}.json`);

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("🎉 NST Finance Deployment Complete!");
  console.log("=".repeat(70));
  console.log("📍 NSTFinance:", nstFinanceAddress);
  console.log("💼 Treasury:", treasuryAddress);
  console.log(`💵 USDT (${usdtDecimals} decimals):`, usdtAddress);
  console.log(`💵 USDC (${usdcDecimals} decimals):`, usdcAddress);
  if (mockNSTAddress) {
    console.log("🪙 NST Token:", mockNSTAddress);
  }
  console.log("=".repeat(70));
  
  if (network.chainId === 56n) {
    console.log("\n⚠️  NEXT STEPS (BSC Mainnet):");
    console.log("=".repeat(70));
    console.log("1. 🪙 Deploy NST Token");
    console.log("2. 🔗 Call setNSTToken(nstTokenAddress)");
    console.log("3. 💰 Transfer NST tokens to contract");
    console.log("4. ✅ Call setClaimEnabled(true)");
    console.log("5. 📸 Setup monthly snapshot automation (10th & 20th)");
    console.log("6. 👥 Allocate team nodes (if needed)");
    console.log("7. 🔍 Verify contract on BSCScan");
    console.log("=".repeat(70));
  } else if (network.chainId === 97n) {
    console.log("\n✅ BSC Testnet deployment ready!");
    console.log("=".repeat(70));
    console.log("📝 Update frontend/src/lib/contracts/config.ts with:");
    console.log(`   NST_FINANCE: '${nstFinanceAddress}'`);
    console.log(`   USDT: '${usdtAddress}'`);
    console.log(`   USDC: '${usdcAddress}'`);
    console.log("=".repeat(70));
  } else {
    console.log("\n✅ Local environment ready for testing!");
  }

  console.log("\n📦 Files generated:");
  console.log("  - deploy.json");
  console.log("  - deployments/deployment-{chainId}-{timestamp}.json");
  console.log("  - deployments/latest-{chainId}.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
