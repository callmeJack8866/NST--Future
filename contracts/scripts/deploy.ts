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

  // Add supported tokens
  console.log("\n📝 Adding supported tokens...");
  
  const network = await ethers.provider.getNetwork();
  let usdtAddress: string;
  let usdcAddress: string;
  let mockNSTAddress: string | undefined;
  let usdtDecimals: number;
  let usdcDecimals: number;

  if (network.chainId === 56n) {
    // BSC Mainnet - 18 decimals
    console.log("Network: BSC Mainnet");
    usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
    usdcAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
    usdtDecimals = 18;
    usdcDecimals = 18;
  } else if (network.chainId === 97n) {
    // BSC Testnet - 18 decimals
    console.log("Network: BSC Testnet");
    usdtAddress = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
    usdcAddress = "0x64544969ed7EBf5f083679233325356EbE738930";
    usdtDecimals = 18;
    usdcDecimals = 18;
  } else {
    // Local/Hardhat - deploy mocks with 18 decimals
    console.log("Network: Local/Hardhat - Deploying mock tokens...");
    
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();
    usdtAddress = await mockUSDT.getAddress();
    console.log("  MockUSDT deployed to:", usdtAddress);

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    usdcAddress = await mockUSDC.getAddress();
    console.log("  MockUSDC deployed to:", usdcAddress);

    usdtDecimals = 18;
    usdcDecimals = 18;

    // Deploy MockNST for local testing
    const MockNST = await ethers.getContractFactory("MockNST");
    const mockNST = await MockNST.deploy();
    await mockNST.waitForDeployment();
    mockNSTAddress = await mockNST.getAddress();
    console.log("  MockNST deployed to:", mockNSTAddress);

    // Setup for local testing
    console.log("\n🔧 Setting up local test environment...");
    
    // Set NST token
    const setNSTTx = await nstFinance.setNSTToken(mockNSTAddress);
    await setNSTTx.wait();
    console.log("  ✅ NST token set");

    // Transfer NST to contract for rewards
    const transferAmount = ethers.parseEther("10000000"); // 10M NST
    const transferTx = await mockNST.transfer(nstFinanceAddress, transferAmount);
    await transferTx.wait();
    console.log("  ✅ Transferred 10M NST to contract");

    // Enable claiming
    const enableClaimTx = await nstFinance.setClaimEnabled(true);
    await enableClaimTx.wait();
    console.log("  ✅ NST claiming enabled");
  }

  // Add USDT (18 decimals on BSC)
  console.log("\nAdding stablecoins...");
  const tx1 = await nstFinance.addSupportedToken(usdtAddress, usdtDecimals);
  await tx1.wait();
  console.log(`  ✅ USDT added (${usdtDecimals} decimals):`, usdtAddress);

  // Add USDC (18 decimals on BSC)
  const tx2 = await nstFinance.addSupportedToken(usdcAddress, usdcDecimals);
  await tx2.wait();
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

  // Get block number and timestamp
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);

  // Create full deployment object (with ABI)
  const deploymentData = {
    version: "1.0.0",
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
      minimumDonation: "100", // USD
      nodePrice: "2000", // USD
      maxNodesPerUser: 5,
      maxTotalNodes: 120,
      maxPublicNodes: 100,
      teamReservedNodes: 20,
      teamLockDuration: "730 days",
      pointsPerUSD: 1,
      nodeHolderMultiplier: 2,
      nodeReferralReward: "500", // NST
      donationReferralRewardPer1000: "100", // NST
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

  // Create simplified deployment object (addresses only, NO ABI)
  const deploymentAddressesOnly = {
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

  // Save deploy.json (addresses only - NO ABI)
  const deployJsonPath = path.join(__dirname, "..", "deploy.json");
  fs.writeFileSync(deployJsonPath, JSON.stringify(deploymentAddressesOnly, null, 2));
  console.log("\n💾 Deployment saved to: deploy.json (addresses only)");

  // Also save to deployments folder with timestamp
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const timestampedFilename = `deployment-${network.chainId}-${Date.now()}.json`;
  const timestampedPath = path.join(deploymentsDir, timestampedFilename);
  fs.writeFileSync(timestampedPath, JSON.stringify(deploymentData, null, 2));
  console.log("💾 Backup saved to:", `deployments/${timestampedFilename}`, "(with ABI)");

  // Create/update latest deployment file
  const latestFilePath = path.join(deploymentsDir, `latest-${network.chainId}.json`);
  fs.writeFileSync(latestFilePath, JSON.stringify(deploymentData, null, 2));
  console.log("💾 Latest deployment:", `deployments/latest-${network.chainId}.json`, "(with ABI)");

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("🎉 NST Finance Deployment Complete!");
  console.log("=".repeat(70));
  console.log("📍 Contract Address:", nstFinanceAddress);
  console.log("💼 Treasury:", treasuryAddress);
  console.log(`💵 USDT (${usdtDecimals} decimals):`, usdtAddress);
  console.log(`💵 USDC (${usdcDecimals} decimals):`, usdcAddress);
  if (mockNSTAddress) {
    console.log("🪙 NST Token (Mock):", mockNSTAddress);
  }
  console.log("=".repeat(70));
  
  if (network.chainId === 56n || network.chainId === 97n) {
    console.log("\n⚠️  NEXT STEPS (Mainnet/Testnet):");
    console.log("=".repeat(70));
    console.log("1. 🪙 Deploy NST Token");
    console.log("2. 🔗 Call setNSTToken(nstTokenAddress)");
    console.log("3. 💰 Transfer NST tokens to contract");
    console.log("4. ✅ Call setClaimEnabled(true)");
    console.log("5. 📸 Setup monthly snapshot automation (10th & 20th)");
    console.log("6. 👥 Allocate team nodes (if needed)");
    console.log("7. 🔍 Verify contract on BSCScan");
    console.log("=".repeat(70));
  } else {
    console.log("\n✅ Local environment ready for testing!");
  }

  console.log("\n📦 Files generated:");
  console.log("  - deploy.json (addresses only, NO ABI - lightweight)");
  console.log("  - deployments/deployment-{chainId}-{timestamp}.json (with ABI - full backup)");
  console.log("  - deployments/latest-{chainId}.json (with ABI - latest deployment)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });