import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventLog } from 'ethers';
import { BlockchainService } from './blockchain.service';
import { SyncState } from './sync-state.entity';
import { User } from '../users/entities/user.entity';
import { Donation, DonationSource } from '../donations/entities/donation.entity';
import { Node, NodeType } from '../nodes/entities/node.entity';
import { Referral } from '../referrals/entities/referral.entity';
import { NstReward, RewardSource } from '../rewards/entities/nst-reward.entity';
import { PointsHistory, PointsSource } from '../rewards/entities/points-history.entity';
import { LeaderboardSnapshot } from '../leaderboard/entities/leaderboard-snapshot.entity';
import { AirdropRound } from '../airdrops/entities/airdrop-round.entity';

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private isIndexing = false;
  private readonly SYNC_KEY = 'nst_finance_events';

  constructor(
    private configService: ConfigService,
    private blockchainService: BlockchainService,
    private dataSource: DataSource,
    @InjectRepository(SyncState)
    private syncStateRepo: Repository<SyncState>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Donation)
    private donationRepo: Repository<Donation>,
    @InjectRepository(Node)
    private nodeRepo: Repository<Node>,
    @InjectRepository(Referral)
    private referralRepo: Repository<Referral>,
    @InjectRepository(NstReward)
    private nstRewardRepo: Repository<NstReward>,
    @InjectRepository(PointsHistory)
    private pointsHistoryRepo: Repository<PointsHistory>,
    @InjectRepository(LeaderboardSnapshot)
    private leaderboardRepo: Repository<LeaderboardSnapshot>,
    @InjectRepository(AirdropRound)
    private airdropRoundRepo: Repository<AirdropRound>,
  ) {}

  async onModuleInit() {
    // Initialize sync state if not exists
    const syncState = await this.syncStateRepo.findOne({
      where: { key: this.SYNC_KEY },
    });

    if (!syncState) {
      const startBlock = this.configService.get<number>('blockchain.startBlock');
      await this.syncStateRepo.save({
        key: this.SYNC_KEY,
        lastSyncedBlock: startBlock?.toString() || '0',
        chainId: this.configService.get<number>('blockchain.chainId'),
      });
    }

    // Start initial indexing
    this.startIndexing();
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    await this.startIndexing();
  }

  async startIndexing() {
    if (this.isIndexing) return;
    this.isIndexing = true;

    try {
      await this.indexEvents();
    } catch (error) {
      this.logger.error('Indexing error:', error);
    } finally {
      this.isIndexing = false;
    }
  }

  private async indexEvents() {
    const syncState = await this.syncStateRepo.findOne({
      where: { key: this.SYNC_KEY },
    });

    const fromBlock = parseInt(syncState?.lastSyncedBlock || '0') + 1;
    const currentBlock = await this.blockchainService.getCurrentBlockNumber();
    const batchSize = this.configService.get<number>('blockchain.batchSize') || 1000;

    if (fromBlock > currentBlock) return;

    const toBlock = Math.min(fromBlock + batchSize - 1, currentBlock);

    this.logger.debug(`Indexing blocks ${fromBlock} to ${toBlock}`);

    // Index all event types
    await this.indexUserRegistered(fromBlock, toBlock);
    await this.indexDonationReceived(fromBlock, toBlock);
    await this.indexNodePurchased(fromBlock, toBlock);
    await this.indexAutoNodeGranted(fromBlock, toBlock);
    await this.indexNodeReferralReward(fromBlock, toBlock);
    await this.indexDonationReferralReward(fromBlock, toBlock);
    await this.indexFreeNodeGranted(fromBlock, toBlock);
    await this.indexPointsEarned(fromBlock, toBlock);
    await this.indexNSTClaimed(fromBlock, toBlock);
    await this.indexSnapshotTaken(fromBlock, toBlock);
    await this.indexAirdropRoundCreated(fromBlock, toBlock);
    await this.indexAirdropClaimed(fromBlock, toBlock);
    await this.indexTeamNodeAllocated(fromBlock, toBlock);

    // Update sync state
    await this.syncStateRepo.update(
      { key: this.SYNC_KEY },
      { lastSyncedBlock: toBlock.toString() },
    );
  }

  private async indexUserRegistered(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'UserRegistered',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parseUserRegistered(event as EventLog);
      
      await this.dataSource.transaction(async (manager) => {
        // Create or get user
        let user = await manager.findOne(User, {
          where: { address: data.user.toLowerCase() },
        });

        if (!user) {
          user = manager.create(User, {
            address: data.user.toLowerCase(),
            referrerAddress: data.referrer !== '0x0000000000000000000000000000000000000000'
              ? data.referrer.toLowerCase()
              : null,
          });
          await manager.save(user);
        }

        // Create referral record if referrer exists
        if (data.referrer !== '0x0000000000000000000000000000000000000000') {
          const existingReferral = await manager.findOne(Referral, {
            where: { refereeAddress: data.user.toLowerCase() },
          });

          if (!existingReferral) {
            const referral = manager.create(Referral, {
              referrerAddress: data.referrer.toLowerCase(),
              refereeAddress: data.user.toLowerCase(),
              txHash: data.txHash,
              blockNumber: data.blockNumber,
            });
            await manager.save(referral);
          }
        }
      });
    }
  }

  private async indexDonationReceived(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'DonationReceived',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parseDonationReceived(event as EventLog);

      // Check if donation already exists
      const existingDonation = await this.donationRepo.findOne({
        where: { txHash: data.txHash },
      });

      if (existingDonation) continue;

      await this.dataSource.transaction(async (manager) => {
        // Ensure user exists
        await this.ensureUserExists(manager, data.user.toLowerCase());

        // Get token symbol (map address to symbol)
        const tokenSymbol = this.getTokenSymbol(data.token);

        // Create donation record
        const donation = manager.create(Donation, {
          userAddress: data.user.toLowerCase(),
          tokenAddress: data.token.toLowerCase(),
          tokenSymbol,
          amount: data.amount,
          usdValue: data.usdValue,
          txHash: data.txHash,
          blockNumber: data.blockNumber,
          chainId: this.configService.get<number>('blockchain.chainId'),
          source: DonationSource.DONATION,
          referrerAddress: data.referrer !== '0x0000000000000000000000000000000000000000'
            ? data.referrer.toLowerCase()
            : null,
        });
        await manager.save(donation);

        // Update user stats
        await manager.increment(
          User,
          { address: data.user.toLowerCase() },
          'totalDonationUSD',
          parseFloat(data.usdValue) / 1e18,
        );
      });
    }
  }

  private async indexNodePurchased(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'NodePurchased',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parseNodePurchased(event as EventLog);

      await this.dataSource.transaction(async (manager) => {
        await this.ensureUserExists(manager, data.user.toLowerCase());

        // Create node record
        const node = manager.create(Node, {
          userAddress: data.user.toLowerCase(),
          type: NodeType.PUBLIC,
          count: data.count,
          costUSD: data.totalCost,
          txHash: data.txHash,
          blockNumber: data.blockNumber,
        });
        await manager.save(node);

        // Update user node count
        await manager.increment(
          User,
          { address: data.user.toLowerCase() },
          'nodeCount',
          data.count,
        );
      });
    }
  }

  private async indexAutoNodeGranted(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'AutoNodeGranted',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parseAutoNodeGranted(event as EventLog);

      await this.dataSource.transaction(async (manager) => {
        // Create auto node record
        const node = manager.create(Node, {
          userAddress: data.user.toLowerCase(),
          type: NodeType.AUTO,
          count: 1,
          costUSD: '0',
          txHash: data.txHash,
          blockNumber: data.blockNumber,
        });
        await manager.save(node);

        // Update user
        await manager.update(
          User,
          { address: data.user.toLowerCase() },
          { hasAutoNode: true },
        );
        await manager.increment(
          User,
          { address: data.user.toLowerCase() },
          'nodeCount',
          1,
        );
      });
    }
  }

  private async indexNodeReferralReward(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'NodeReferralReward',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parseNodeReferralReward(event as EventLog);

      await this.dataSource.transaction(async (manager) => {
        // Create reward record
        const reward = manager.create(NstReward, {
          userAddress: data.referrer.toLowerCase(),
          amount: data.reward,
          source: RewardSource.NODE_REFERRAL,
          sourceAddress: data.referee.toLowerCase(),
          txHash: data.txHash,
          blockNumber: data.blockNumber,
        });
        await manager.save(reward);

        // Update referrer stats
        await manager.increment(
          User,
          { address: data.referrer.toLowerCase() },
          'directNodeCount',
          1,
        );
      });
    }
  }

  private async indexDonationReferralReward(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'DonationReferralReward',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parseDonationReferralReward(event as EventLog);

      const reward = this.nstRewardRepo.create({
        userAddress: data.referrer.toLowerCase(),
        amount: data.reward,
        source: RewardSource.DONATION_REFERRAL,
        txHash: data.txHash,
        blockNumber: data.blockNumber,
      });
      await this.nstRewardRepo.save(reward);
    }
  }

  private async indexFreeNodeGranted(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'FreeNodeGranted',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parseFreeNodeGranted(event as EventLog);

      await this.dataSource.transaction(async (manager) => {
        // Create free node record
        const node = manager.create(Node, {
          userAddress: data.referrer.toLowerCase(),
          type: NodeType.FREE_REFERRAL,
          count: 1,
          costUSD: '0',
          txHash: data.txHash,
          blockNumber: data.blockNumber,
        });
        await manager.save(node);

        // Update user node count
        await manager.increment(
          User,
          { address: data.referrer.toLowerCase() },
          'nodeCount',
          1,
        );
      });
    }
  }

  private async indexPointsEarned(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'PointsEarned',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parsePointsEarned(event as EventLog);

      await this.dataSource.transaction(async (manager) => {
        // Create points history record
        const pointsHistory = manager.create(PointsHistory, {
          userAddress: data.user.toLowerCase(),
          points: data.points,
          source: data.source === 'donation' ? PointsSource.DONATION : PointsSource.REFERRAL,
          txHash: data.txHash,
          blockNumber: data.blockNumber,
        });
        await manager.save(pointsHistory);

        // Update user points
        const user = await manager.findOne(User, {
          where: { address: data.user.toLowerCase() },
        });
        if (user) {
          const currentPoints = BigInt(user.points || '0');
          const newPoints = currentPoints + BigInt(data.points);
          await manager.update(
            User,
            { address: data.user.toLowerCase() },
            { points: newPoints.toString() },
          );
        }
      });
    }
  }

  private async indexNSTClaimed(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'NSTClaimed',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parseNSTClaimed(event as EventLog);

      await this.userRepo.update(
        { address: data.user.toLowerCase() },
        { nstReward: '0' },
      );
    }
  }

  private async indexSnapshotTaken(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'SnapshotTaken',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parseSnapshotTaken(event as EventLog);
      this.logger.log(`Snapshot taken for round ${data.round}`);
      // Additional snapshot processing can be added here
    }
  }

  private async indexAirdropRoundCreated(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'AirdropRoundCreated',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parseAirdropRoundCreated(event as EventLog);

      const existingRound = await this.airdropRoundRepo.findOne({
        where: { round: data.round },
      });

      if (!existingRound) {
        const airdropRound = this.airdropRoundRepo.create({
          round: data.round,
          airdropAmount: data.airdropAmount,
          eligibleUsers: [],
          blockNumber: data.blockNumber,
        });
        await this.airdropRoundRepo.save(airdropRound);
      }
    }
  }

  private async indexAirdropClaimed(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'AirdropClaimed',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parseAirdropClaimed(event as EventLog);

      const airdropRound = await this.airdropRoundRepo.findOne({
        where: { round: data.round },
      });

      if (airdropRound) {
        airdropRound.claimedUsers.push(data.user.toLowerCase());
        await this.airdropRoundRepo.save(airdropRound);
      }
    }
  }

  private async indexTeamNodeAllocated(fromBlock: number, toBlock: number) {
    const events = await this.blockchainService.queryEvents(
      'TeamNodeAllocated',
      fromBlock,
      toBlock,
    );

    for (const event of events) {
      const data = this.blockchainService.parseTeamNodeAllocated(event as EventLog);

      await this.dataSource.transaction(async (manager) => {
        await this.ensureUserExists(manager, data.teamMember.toLowerCase());

        // Create team node record
        const node = manager.create(Node, {
          userAddress: data.teamMember.toLowerCase(),
          type: NodeType.TEAM,
          count: data.count,
          costUSD: '0',
          txHash: data.txHash,
          blockNumber: data.blockNumber,
        });
        await manager.save(node);

        // Update user
        await manager.update(
          User,
          { address: data.teamMember.toLowerCase() },
          {
            isTeamMember: true,
            teamNodeUnlockTime: data.unlockTime,
          },
        );
        await manager.increment(
          User,
          { address: data.teamMember.toLowerCase() },
          'teamNodeCount',
          data.count,
        );
      });
    }
  }

  // Helper methods
  private async ensureUserExists(manager: any, address: string) {
    let user = await manager.findOne(User, { where: { address } });
    if (!user) {
      user = manager.create(User, { address });
      await manager.save(user);
    }
    return user;
  }

  private getTokenSymbol(tokenAddress: string): string {
    const usdtAddress = '0x25cD2009096f95a1d5C6db2aB2De318498B9A446'.toLowerCase();
    const usdcAddress = '0xade65A4733B7Afbc641e50795196c23717B3DaC3'.toLowerCase();
    
    if (tokenAddress.toLowerCase() === usdtAddress) return 'USDT';
    if (tokenAddress.toLowerCase() === usdcAddress) return 'USDC';
    return 'UNKNOWN';
  }
}