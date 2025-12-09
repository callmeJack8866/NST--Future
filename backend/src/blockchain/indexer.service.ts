import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventLog } from 'ethers';
import { BlockchainService } from './blockchain.service';
import { SyncStateManagerService } from './services/sync-state-manager.service';
import { BlockchainEventPollerService, EventBatchResult } from './services/blockchain-event-poller.service';
import { User } from '../users/entities/user.entity';
import { Donation, DonationSource } from '../donations/entities/donation.entity';
import { Node, NodeType } from '../nodes/entities/node.entity';
import { Referral } from '../referrals/entities/referral.entity';
import { NstReward, RewardSource } from '../rewards/entities/nst-reward.entity';
import { PointsHistory, PointsSource } from '../rewards/entities/points-history.entity';
import { LeaderboardSnapshot } from '../leaderboard/entities/leaderboard-snapshot.entity';
import { AirdropRound } from '../airdrops/entities/airdrop-round.entity';

@Injectable()
export class IndexerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexerService.name);
  
  private pollingInterval: NodeJS.Timeout | null = null;
  private syncStateInterval: NodeJS.Timeout | null = null;
  
  private isProcessing = false;
  private isInitialized = false;
  private prunedBlocksSkipped = 0;

  private readonly POLLING_INTERVAL_MS = 15000;
  private readonly SYNC_STATE_SAVE_INTERVAL_MS = 5000;

  // All event types to index
  private readonly EVENT_NAMES = [
    'UserRegistered',
    'DonationReceived',
    'NodePurchased',
    'AutoNodeGranted',
    'NodeReferralReward',
    'DonationReferralReward',
    'FreeNodeGranted',
    'PointsEarned',
    'NSTClaimed',
    'SnapshotTaken',
    'AirdropRoundCreated',
    'AirdropClaimed',
    'TeamNodeAllocated',
  ];

  constructor(
    private configService: ConfigService,
    private blockchainService: BlockchainService,
    private syncStateManager: SyncStateManagerService,
    private eventPoller: BlockchainEventPollerService,
    private dataSource: DataSource,
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
    await this.initialize();
    await this.startListening();
  }

  async onModuleDestroy() {
    this.stopListening();
    await this.syncStateManager.save();
  }

  private async initialize() {
    try {
      await this.syncStateManager.initialize();
      this.isInitialized = true;
      this.logger.log(`Initialized at block ${this.syncStateManager.getLastProcessedBlock()}`);
    } catch (error) {
      this.logger.error('Failed to initialize:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  private async startListening() {
    this.logger.log('Starting event listener...');

    const currentBlock = await this.blockchainService.getCurrentBlockNumber();
    const lastBlock = this.syncStateManager.getLastProcessedBlock();

    // Start periodic sync state saving
    this.syncStateInterval = setInterval(
      () => this.syncStateManager.save(),
      this.SYNC_STATE_SAVE_INTERVAL_MS,
    );

    // Catch up on missed events (runs in background)
    if (currentBlock > lastBlock) {
      this.catchUpOnMissedEvents(lastBlock + 1, currentBlock);
    }

    // Start polling for new events
    this.setupPolling();
    this.logger.log('Event listener active');
  }

  private setupPolling() {
    this.logger.log(`Polling every ${this.POLLING_INTERVAL_MS}ms`);
    
    this.pollingInterval = setInterval(async () => {
      if (this.isProcessing) return;
      
      try {
        this.isProcessing = true;
        await this.pollForNewEvents();
      } catch (error) {
        this.logger.error('Polling error:', error);
      } finally {
        this.isProcessing = false;
      }
    }, this.POLLING_INTERVAL_MS);
  }

  private async pollForNewEvents() {
    const { results, newBlock, allPruned, anyPruned } = await this.eventPoller.pollNewEvents(
      this.EVENT_NAMES,
      this.syncStateManager.getLastProcessedBlock() + 1,
    );

    if (results.length === 0) return;

    // Process all events
    await this.processEventResults(results);

    // Log pruning status
    if (allPruned) {
      this.prunedBlocksSkipped += (newBlock - this.syncStateManager.getLastProcessedBlock());
      this.logger.warn(`Batch fully pruned. Total pruned blocks: ${this.prunedBlocksSkipped}`);
    } else if (anyPruned) {
      this.logger.warn('Some events in batch were pruned');
    }

    // Update sync state
    this.syncStateManager.setLastProcessedBlock(newBlock);
    await this.syncStateManager.save();
  }

  private async catchUpOnMissedEvents(fromBlock: number, toBlock: number) {
    this.syncStateManager.setCatchingUp(true);
    await this.syncStateManager.save();

    try {
      await this.eventPoller.catchUp(
        this.EVENT_NAMES,
        fromBlock,
        toBlock,
        async (block, results) => {
          // Process events from this batch
          await this.processEventResults(results);
          // Update progress
          await this.syncStateManager.updateCatchupProgress(block);
        },
      );
    } catch (error) {
      this.logger.error('Catch-up failed:', error);
    } finally {
      this.syncStateManager.setCatchingUp(false);
      await this.syncStateManager.save();
    }
  }

  /**
   * Process all event results from a batch
   */
  private async processEventResults(results: EventBatchResult[]): Promise<void> {
    for (const result of results) {
      if (result.skippedDueToPruning || result.events.length === 0) {
        continue;
      }

      for (const event of result.events) {
        await this.handleEvent(result.eventName, event as EventLog);
      }
    }
  }

  /**
   * Route events to their handlers
   */
  private async handleEvent(eventName: string, event: EventLog): Promise<void> {
    try {
      switch (eventName) {
        case 'UserRegistered':
          await this.handleUserRegistered(event);
          break;
        case 'DonationReceived':
          await this.handleDonationReceived(event);
          break;
        case 'NodePurchased':
          await this.handleNodePurchased(event);
          break;
        case 'AutoNodeGranted':
          await this.handleAutoNodeGranted(event);
          break;
        case 'NodeReferralReward':
          await this.handleNodeReferralReward(event);
          break;
        case 'DonationReferralReward':
          await this.handleDonationReferralReward(event);
          break;
        case 'FreeNodeGranted':
          await this.handleFreeNodeGranted(event);
          break;
        case 'PointsEarned':
          await this.handlePointsEarned(event);
          break;
        case 'NSTClaimed':
          await this.handleNSTClaimed(event);
          break;
        case 'SnapshotTaken':
          await this.handleSnapshotTaken(event);
          break;
        case 'AirdropRoundCreated':
          await this.handleAirdropRoundCreated(event);
          break;
        case 'AirdropClaimed':
          await this.handleAirdropClaimed(event);
          break;
        case 'TeamNodeAllocated':
          await this.handleTeamNodeAllocated(event);
          break;
      }
    } catch (error) {
      this.logger.error(`Error handling ${eventName} event:`, error);
    }
  }

  private stopListening() {
    this.logger.log('Stopping event listener...');
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.syncStateInterval) clearInterval(this.syncStateInterval);
  }

  async getSyncStatus() {
    const currentBlock = await this.blockchainService.getCurrentBlockNumber();
    const status = await this.syncStateManager.getStatus(currentBlock);
    
    return {
      ...status,
      prunedBlocksSkipped: this.prunedBlocksSkipped,
      isReady: this.isInitialized,
    };
  }

  // ==================== Event Handlers ====================

  private async handleUserRegistered(event: EventLog) {
    const data = this.blockchainService.parseUserRegistered(event);
    
    await this.dataSource.transaction(async (manager) => {
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

  private async handleDonationReceived(event: EventLog) {
    const data = this.blockchainService.parseDonationReceived(event);

    const existingDonation = await this.donationRepo.findOne({
      where: { txHash: data.txHash },
    });

    if (existingDonation) return;

    await this.dataSource.transaction(async (manager) => {
      await this.ensureUserExists(manager, data.user.toLowerCase());

      const tokenSymbol = this.getTokenSymbol(data.token);

      // Convert raw blockchain values (18 decimals) to human-readable format
      // to avoid numeric field overflow in decimal(36,18) columns
      const amountHuman = (parseFloat(data.amount) / 1e18).toString();
      const usdValueHuman = (parseFloat(data.usdValue) / 1e18).toString();

      const donation = manager.create(Donation, {
        userAddress: data.user.toLowerCase(),
        tokenAddress: data.token.toLowerCase(),
        tokenSymbol,
        amount: amountHuman,
        usdValue: usdValueHuman,
        txHash: data.txHash,
        blockNumber: data.blockNumber,
        chainId: this.configService.get<number>('blockchain.chainId'),
        source: DonationSource.DONATION,
        referrerAddress: data.referrer !== '0x0000000000000000000000000000000000000000'
          ? data.referrer.toLowerCase()
          : null,
      });
      await manager.save(donation);

      await manager.increment(
        User,
        { address: data.user.toLowerCase() },
        'totalDonationUSD',
        parseFloat(usdValueHuman),
      );
    });
  }

  private async handleNodePurchased(event: EventLog) {
    const data = this.blockchainService.parseNodePurchased(event);

    await this.dataSource.transaction(async (manager) => {
      await this.ensureUserExists(manager, data.user.toLowerCase());

      // Convert raw blockchain value (18 decimals) to human-readable format
      const costUSDHuman = (parseFloat(data.totalCost) / 1e18).toString();

      const node = manager.create(Node, {
        userAddress: data.user.toLowerCase(),
        type: NodeType.PUBLIC,
        count: data.count,
        costUSD: costUSDHuman,
        txHash: data.txHash,
        blockNumber: data.blockNumber,
      });
      await manager.save(node);

      await manager.increment(
        User,
        { address: data.user.toLowerCase() },
        'nodeCount',
        data.count,
      );
    });
  }

  private async handleAutoNodeGranted(event: EventLog) {
    const data = this.blockchainService.parseAutoNodeGranted(event);

    await this.dataSource.transaction(async (manager) => {
      const node = manager.create(Node, {
        userAddress: data.user.toLowerCase(),
        type: NodeType.AUTO,
        count: 1,
        costUSD: '0',
        txHash: data.txHash,
        blockNumber: data.blockNumber,
      });
      await manager.save(node);

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

  private async handleNodeReferralReward(event: EventLog) {
    const data = this.blockchainService.parseNodeReferralReward(event);

    await this.dataSource.transaction(async (manager) => {
      // Convert raw blockchain value (18 decimals) to human-readable format
      const rewardHuman = (parseFloat(data.reward) / 1e18).toString();

      const reward = manager.create(NstReward, {
        userAddress: data.referrer.toLowerCase(),
        amount: rewardHuman,
        source: RewardSource.NODE_REFERRAL,
        sourceAddress: data.referee.toLowerCase(),
        txHash: data.txHash,
        blockNumber: data.blockNumber,
      });
      await manager.save(reward);

      await manager.increment(
        User,
        { address: data.referrer.toLowerCase() },
        'directNodeCount',
        1,
      );
    });
  }

  private async handleDonationReferralReward(event: EventLog) {
    const data = this.blockchainService.parseDonationReferralReward(event);

    // Convert raw blockchain value (18 decimals) to human-readable format
    const rewardHuman = (parseFloat(data.reward) / 1e18).toString();
    const donationAmountHuman = parseFloat(data.donationAmount) / 1e18;

    const reward = this.nstRewardRepo.create({
      userAddress: data.referrer.toLowerCase(),
      amount: rewardHuman,
      source: RewardSource.DONATION_REFERRAL,
      txHash: data.txHash,
      blockNumber: data.blockNumber,
    });

    // Increment directDonationUSD instead of replacing it
    await this.userRepo.increment(
      { address: data.referrer.toLowerCase() },
      'directDonationUSD',
      donationAmountHuman
    );

    await this.nstRewardRepo.save(reward);
  }

  private async handleFreeNodeGranted(event: EventLog) {
    const data = this.blockchainService.parseFreeNodeGranted(event);

    await this.dataSource.transaction(async (manager) => {
      const node = manager.create(Node, {
        userAddress: data.referrer.toLowerCase(),
        type: NodeType.FREE_REFERRAL,
        count: 1,
        costUSD: '0',
        txHash: data.txHash,
        blockNumber: data.blockNumber,
      });
      await manager.save(node);

      await manager.increment(
        User,
        { address: data.referrer.toLowerCase() },
        'nodeCount',
        1,
      );
    });
  }

  private async handlePointsEarned(event: EventLog) {
    const data = this.blockchainService.parsePointsEarned(event);

    await this.dataSource.transaction(async (manager) => {
      // Convert raw blockchain value (18 decimals) to human-readable format
      const pointsHuman = (parseFloat(data.points) / 1e18).toString();

      const pointsHistory = manager.create(PointsHistory, {
        userAddress: data.user.toLowerCase(),
        points: pointsHuman,
        source: data.source === 'donation' ? PointsSource.DONATION : PointsSource.REFERRAL,
        txHash: data.txHash,
        blockNumber: data.blockNumber,
      });
      await manager.save(pointsHistory);

      const user = await manager.findOne(User, {
        where: { address: data.user.toLowerCase() },
      });
      if (user) {
        const currentPoints = parseFloat(user.points || '0');
        const newPoints = currentPoints + parseFloat(pointsHuman);
        await manager.update(
          User,
          { address: data.user.toLowerCase() },
          { points: newPoints.toString() },
        );
      }
    });
  }

  private async handleNSTClaimed(event: EventLog) {
    const data = this.blockchainService.parseNSTClaimed(event);

    await this.userRepo.update(
      { address: data.user.toLowerCase() },
      { nstReward: '0' },
    );
  }

  private async handleSnapshotTaken(event: EventLog) {
    const data = this.blockchainService.parseSnapshotTaken(event);
    this.logger.log(`Snapshot taken for round ${data.round}`);
  }

  private async handleAirdropRoundCreated(event: EventLog) {
    const data = this.blockchainService.parseAirdropRoundCreated(event);

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

  private async handleAirdropClaimed(event: EventLog) {
    const data = this.blockchainService.parseAirdropClaimed(event);

    const airdropRound = await this.airdropRoundRepo.findOne({
      where: { round: data.round },
    });

    if (airdropRound) {
      airdropRound.claimedUsers.push(data.user.toLowerCase());
      await this.airdropRoundRepo.save(airdropRound);
    }
  }

  private async handleTeamNodeAllocated(event: EventLog) {
    const data = this.blockchainService.parseTeamNodeAllocated(event);

    await this.dataSource.transaction(async (manager) => {
      await this.ensureUserExists(manager, data.teamMember.toLowerCase());

      const node = manager.create(Node, {
        userAddress: data.teamMember.toLowerCase(),
        type: NodeType.TEAM,
        count: data.count,
        costUSD: '0',
        txHash: data.txHash,
        blockNumber: data.blockNumber,
      });
      await manager.save(node);

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

  // ==================== Helper Methods ====================

  private async ensureUserExists(manager: any, address: string) {
    let user = await manager.findOne(User, { where: { address } });
    if (!user) {
      user = manager.create(User, { address });
      await manager.save(user);
    }
    return user;
  }

  private getTokenSymbol(tokenAddress: string): string {
    const usdtAddress = this.configService.get<string>('blockchain.usdtAddress')?.toLowerCase();
    const usdcAddress = this.configService.get<string>('blockchain.usdcAddress')?.toLowerCase();
    
    if (tokenAddress.toLowerCase() === usdtAddress) return 'USDT';
    if (tokenAddress.toLowerCase() === usdcAddress) return 'USDC';
    return 'UNKNOWN';
  }
}
