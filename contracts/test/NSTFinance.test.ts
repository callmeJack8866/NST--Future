import { expect } from "chai";
import { ethers } from "hardhat";
import { NSTFinance, MockUSDT, MockUSDC, MockNST } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("NSTFinance", function () {
  let nstFinance: NSTFinance;
  let usdt: MockUSDT;
  let usdc: MockUSDC;
  let nst: MockNST;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  const USDT_DECIMALS = 6;
  const USD_100 = ethers.parseUnits("100", USDT_DECIMALS);
  const USD_1000 = ethers.parseUnits("1000", USDT_DECIMALS);
  const USD_2000 = ethers.parseUnits("2000", USDT_DECIMALS);

  beforeEach(async function () {
    [owner, treasury, user1, user2, user3] = await ethers.getSigners();

    // Deploy mock tokens
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDT.deploy();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const MockNST = await ethers.getContractFactory("MockNST");
    nst = await MockNST.deploy();

    // Deploy NSTFinance
    const NSTFinance = await ethers.getContractFactory("NSTFinance");
    nstFinance = await NSTFinance.deploy(treasury.address);

    // Add supported tokens
    await nstFinance.addSupportedToken(await usdt.getAddress(), USDT_DECIMALS);
    await nstFinance.addSupportedToken(await usdc.getAddress(), USDT_DECIMALS);

    // Setup NST token
    await nstFinance.setNSTToken(await nst.getAddress());
    await nst.transfer(await nstFinance.getAddress(), ethers.parseEther("10000000"));

    // Distribute test tokens
    await usdt.mint(user1.address, USD_2000 * 10n);
    await usdt.mint(user2.address, USD_2000 * 10n);
    await usdt.mint(user3.address, USD_2000 * 10n);
  });

  describe("Deployment", function () {
    it("Should set the correct treasury", async function () {
      expect(await nstFinance.treasury()).to.equal(treasury.address);
    });

    it("Should have correct constants", async function () {
      expect(await nstFinance.MINIMUM_DONATION()).to.equal(ethers.parseEther("100"));
      expect(await nstFinance.NODE_PRICE()).to.equal(ethers.parseEther("2000"));
      expect(await nstFinance.MAX_NODES_PER_USER()).to.equal(5);
      expect(await nstFinance.MAX_TOTAL_NODES()).to.equal(100);
    });

    it("Should support USDT and USDC", async function () {
      expect(await nstFinance.supportedTokens(await usdt.getAddress())).to.be.true;
      expect(await nstFinance.supportedTokens(await usdc.getAddress())).to.be.true;
    });
  });

  describe("Donations", function () {
    it("Should accept valid donations", async function () {
      await usdt.connect(user1).approve(await nstFinance.getAddress(), USD_100);
      
      await expect(nstFinance.connect(user1).donate(await usdt.getAddress(), USD_100, ethers.ZeroAddress))
        .to.emit(nstFinance, "DonationReceived");

      const userInfo = await nstFinance.getUserInfo(user1.address);
      expect(userInfo.totalDonationUSD).to.equal(ethers.parseEther("100"));
    });

    it("Should reject donations below minimum", async function () {
      const tooSmall = ethers.parseUnits("99", USDT_DECIMALS);
      await usdt.connect(user1).approve(await nstFinance.getAddress(), tooSmall);
      
      await expect(
        nstFinance.connect(user1).donate(await usdt.getAddress(), tooSmall, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(nstFinance, "InvalidAmount");
    });

    it("Should set referrer on first interaction", async function () {
      // User2 donates first (no referrer)
      await usdt.connect(user2).approve(await nstFinance.getAddress(), USD_100);
      await nstFinance.connect(user2).donate(await usdt.getAddress(), USD_100, ethers.ZeroAddress);

      // User1 donates with user2 as referrer
      await usdt.connect(user1).approve(await nstFinance.getAddress(), USD_100);
      await nstFinance.connect(user1).donate(await usdt.getAddress(), USD_100, user2.address);

      const userInfo = await nstFinance.getUserInfo(user1.address);
      expect(userInfo.referrer).to.equal(user2.address);
    });

    it("Should grant auto-node at 2000 USD donations", async function () {
      await usdt.connect(user1).approve(await nstFinance.getAddress(), USD_2000);
      
      await expect(nstFinance.connect(user1).donate(await usdt.getAddress(), USD_2000, ethers.ZeroAddress))
        .to.emit(nstFinance, "AutoNodeGranted");

      const userInfo = await nstFinance.getUserInfo(user1.address);
      expect(userInfo.nodeCount).to.equal(1);
      expect(userInfo.hasAutoNode).to.be.true;
    });
  });

  describe("Node Purchases", function () {
    it("Should allow direct node purchase", async function () {
      await usdt.connect(user1).approve(await nstFinance.getAddress(), USD_2000);
      
      await expect(nstFinance.connect(user1).buyNode(await usdt.getAddress(), 1, ethers.ZeroAddress))
        .to.emit(nstFinance, "NodePurchased");

      const userInfo = await nstFinance.getUserInfo(user1.address);
      expect(userInfo.nodeCount).to.equal(1);
    });

    it("Should allow buying multiple nodes", async function () {
      const cost = USD_2000 * 3n;
      await usdt.connect(user1).approve(await nstFinance.getAddress(), cost);
      
      await nstFinance.connect(user1).buyNode(await usdt.getAddress(), 3, ethers.ZeroAddress);

      const userInfo = await nstFinance.getUserInfo(user1.address);
      expect(userInfo.nodeCount).to.equal(3);
    });

    it("Should enforce max nodes per user", async function () {
      const cost = USD_2000 * 6n;
      await usdt.connect(user1).approve(await nstFinance.getAddress(), cost);
      
      await expect(
        nstFinance.connect(user1).buyNode(await usdt.getAddress(), 6, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(nstFinance, "InvalidAmount");
    });

    it("Should count node purchase toward donations", async function () {
      await usdt.connect(user1).approve(await nstFinance.getAddress(), USD_2000);
      await nstFinance.connect(user1).buyNode(await usdt.getAddress(), 1, ethers.ZeroAddress);

      const userInfo = await nstFinance.getUserInfo(user1.address);
      expect(userInfo.totalDonationUSD).to.equal(ethers.parseEther("2000"));
    });
  });

  describe("Referral Rewards", function () {
    it("Should reward referrer when referee becomes node holder", async function () {
      // User2 registers first
      await usdt.connect(user2).approve(await nstFinance.getAddress(), USD_100);
      await nstFinance.connect(user2).donate(await usdt.getAddress(), USD_100, ethers.ZeroAddress);

      // User1 buys node with user2 as referrer
      await usdt.connect(user1).approve(await nstFinance.getAddress(), USD_2000);
      
      await expect(nstFinance.connect(user1).buyNode(await usdt.getAddress(), 1, user2.address))
        .to.emit(nstFinance, "NodeReferralReward")
        .withArgs(user2.address, user1.address, ethers.parseEther("500"));

      const referrerInfo = await nstFinance.getUserInfo(user2.address);
      expect(referrerInfo.nstReward).to.equal(ethers.parseEther("500"));
      expect(referrerInfo.directNodeCount).to.equal(1);
    });

    it("Should grant free node after 10 node referrals", async function () {
      // User2 as referrer
      await usdt.connect(user2).approve(await nstFinance.getAddress(), USD_100);
      await nstFinance.connect(user2).donate(await usdt.getAddress(), USD_100, ethers.ZeroAddress);

      // Get 10 users to buy nodes with user2 as referrer
      for (let i = 0; i < 10; i++) {
        const newUser = ethers.Wallet.createRandom().connect(ethers.provider);
        await owner.sendTransaction({ to: newUser.address, value: ethers.parseEther("1") });
        await usdt.mint(newUser.address, USD_2000);
        await usdt.connect(newUser).approve(await nstFinance.getAddress(), USD_2000);
        
        const tx = nstFinance.connect(newUser).buyNode(await usdt.getAddress(), 1, user2.address);
        
        if (i === 9) {
          await expect(tx).to.emit(nstFinance, "FreeNodeGranted");
        }
      }

      const referrerInfo = await nstFinance.getUserInfo(user2.address);
      expect(referrerInfo.nodeCount).to.equal(1); // Free node granted
      expect(referrerInfo.directNodeCount).to.equal(10);
    });

    it("Should reward referrer for referee donations", async function () {
      // User2 as referrer
      await usdt.connect(user2).approve(await nstFinance.getAddress(), USD_100);
      await nstFinance.connect(user2).donate(await usdt.getAddress(), USD_100, ethers.ZeroAddress);

      // User1 donates 1000 USD with user2 as referrer
      await usdt.connect(user1).approve(await nstFinance.getAddress(), USD_1000);
      
      await expect(nstFinance.connect(user1).donate(await usdt.getAddress(), USD_1000, user2.address))
        .to.emit(nstFinance, "DonationReferralReward")
        .withArgs(user2.address, ethers.parseEther("100"), ethers.parseEther("1000"));

      const referrerInfo = await nstFinance.getUserInfo(user2.address);
      expect(referrerInfo.nstReward).to.equal(ethers.parseEther("100"));
    });
  });

  describe("NST Claiming", function () {
    beforeEach(async function () {
      // Setup: user2 as referrer, user1 buys node
      await usdt.connect(user2).approve(await nstFinance.getAddress(), USD_100);
      await nstFinance.connect(user2).donate(await usdt.getAddress(), USD_100, ethers.ZeroAddress);

      await usdt.connect(user1).approve(await nstFinance.getAddress(), USD_2000);
      await nstFinance.connect(user1).buyNode(await usdt.getAddress(), 1, user2.address);
    });

    it("Should prevent claiming when disabled", async function () {
      await expect(nstFinance.connect(user2).claimNST())
        .to.be.revertedWithCustomError(nstFinance, "ClaimNotEnabled");
    });

    it("Should allow claiming when enabled", async function () {
      await nstFinance.setClaimEnabled(true);

      const balanceBefore = await nst.balanceOf(user2.address);
      
      await expect(nstFinance.connect(user2).claimNST())
        .to.emit(nstFinance, "NSTClaimed")
        .withArgs(user2.address, ethers.parseEther("500"));

      const balanceAfter = await nst.balanceOf(user2.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("500"));

      const userInfo = await nstFinance.getUserInfo(user2.address);
      expect(userInfo.nstReward).to.equal(0);
    });

    it("Should prevent claiming with no rewards", async function () {
      await nstFinance.setClaimEnabled(true);

      await expect(nstFinance.connect(user3).claimNST())
        .to.be.revertedWithCustomError(nstFinance, "NoRewardsToClaim");
    });
  });

  describe("Global Stats", function () {
    it("Should track global statistics correctly", async function () {
      // Initial state
      let stats = await nstFinance.getGlobalStats();
      expect(stats[0]).to.equal(0); // totalNodesIssued
      expect(stats[2]).to.equal(0); // totalUsers

      // User1 buys node
      await usdt.connect(user1).approve(await nstFinance.getAddress(), USD_2000);
      await nstFinance.connect(user1).buyNode(await usdt.getAddress(), 1, ethers.ZeroAddress);

      stats = await nstFinance.getGlobalStats();
      expect(stats[0]).to.equal(1); // totalNodesIssued
      expect(stats[1]).to.equal(ethers.parseEther("2000")); // totalDonationsUSD
      expect(stats[2]).to.equal(1); // totalUsers
      expect(stats[3]).to.equal(99); // nodesRemaining
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update treasury", async function () {
      const newTreasury = user3.address;
      
      await expect(nstFinance.setTreasury(newTreasury))
        .to.emit(nstFinance, "TreasuryUpdated")
        .withArgs(treasury.address, newTreasury);

      expect(await nstFinance.treasury()).to.equal(newTreasury);
    });

    it("Should prevent non-owner from admin functions", async function () {
      await expect(
        nstFinance.connect(user1).setClaimEnabled(true)
      ).to.be.revertedWithCustomError(nstFinance, "OwnableUnauthorizedAccount");
    });

    it("Should allow emergency NST withdrawal", async function () {
      const amount = ethers.parseEther("1000");
      const balanceBefore = await nst.balanceOf(owner.address);

      await nstFinance.emergencyWithdrawNST(amount);

      const balanceAfter = await nst.balanceOf(owner.address);
      expect(balanceAfter - balanceBefore).to.equal(amount);
    });
  });
});
