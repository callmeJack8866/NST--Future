import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Provider, Log, EventLog } from 'ethers';
import NST_FINANCE_ABI from './abi/nst-finance.json';

// Result type for queryEvents with retry
export interface QueryEventsResult {
  events: (Log | EventLog)[];
  skippedDueToPruning: boolean;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: Provider;
  private contract: Contract;

  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const rpcUrl = this.configService.get<string>('blockchain.rpcUrl');
    const contractAddress = this.configService.get<string>('blockchain.contractAddress');

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new ethers.Contract(contractAddress as string, NST_FINANCE_ABI as any, this.provider);

    this.logger.log(`Connected to RPC: ${rpcUrl}`);
    this.logger.log(`Contract address: ${contractAddress}`);
  }

  getProvider(): Provider {
    return this.provider;
  }

  getContract(): Contract {
    return this.contract;
  }

  async getCurrentBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  async getBlockTimestamp(blockNumber: number): Promise<number> {
    const block = await this.provider.getBlock(blockNumber);
    return block?.timestamp || 0;
  }

  /**
   * Query events (simple version without retry)
   */
  async queryEvents(
    eventName: string,
    fromBlock: number,
    toBlock: number,
  ): Promise<(Log | EventLog)[]> {
    const filter = this.contract.filters[eventName]();
    return this.contract.queryFilter(filter, fromBlock, toBlock);
  }

  /**
   * Query events with retry logic and pruned block handling
   */
  async queryEventsWithRetry(
    eventName: string,
    fromBlock: number,
    toBlock: number,
    retries = 0,
  ): Promise<QueryEventsResult> {
    try {
      const filter = this.contract.filters[eventName]();
      const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
      return { events, skippedDueToPruning: false };
    } catch (error: any) {
      // Check if it's a pruned block error
      if (this.isPrunedBlockError(error)) {
        this.logger.warn(
          `Blocks ${fromBlock}-${toBlock} are pruned for event ${eventName}, skipping...`,
        );
        return { events: [], skippedDueToPruning: true };
      }

      // Retry on other errors
      if (retries < this.MAX_RETRIES) {
        this.logger.warn(
          `Query failed for ${eventName} (${fromBlock}-${toBlock}), retrying (${retries + 1}/${this.MAX_RETRIES})...`,
        );
        await this.delay(this.RETRY_DELAY_MS * (retries + 1));
        return this.queryEventsWithRetry(eventName, fromBlock, toBlock, retries + 1);
      }

      throw error;
    }
  }

  /**
   * Check if an error is due to pruned block data
   */
  isPrunedBlockError(error: any): boolean {
    const errorMessage = error?.message || error?.error?.message || '';
    const errorCode = error?.error?.code || error?.code;
    
    return (
      errorMessage.toLowerCase().includes('pruned') ||
      errorMessage.includes('-32701') ||
      errorCode === -32701 ||
      errorMessage.includes('could not coalesce error')
    );
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Parse event data helpers
  parseUserRegistered(event: EventLog) {
    return {
      user: event.args[0],
      referrer: event.args[1],
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parseDonationReceived(event: EventLog) {
    return {
      user: event.args[0],
      token: event.args[1],
      amount: event.args[2].toString(),
      usdValue: event.args[3].toString(),
      referrer: event.args[4],
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parseNodePurchased(event: EventLog) {
    return {
      user: event.args[0],
      count: Number(event.args[1]),
      totalCost: event.args[2].toString(),
      referrer: event.args[3],
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parseAutoNodeGranted(event: EventLog) {
    return {
      user: event.args[0],
      nodeNumber: Number(event.args[1]),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parseNodeReferralReward(event: EventLog) {
    return {
      referrer: event.args[0],
      referee: event.args[1],
      reward: event.args[2].toString(),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parseDonationReferralReward(event: EventLog) {
    return {
      referrer: event.args[0],
      reward: event.args[1].toString(),
      donationAmount: event.args[2].toString(),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parseFreeNodeGranted(event: EventLog) {
    return {
      referrer: event.args[0],
      nodeNumber: Number(event.args[1]),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parsePointsEarned(event: EventLog) {
    return {
      user: event.args[0],
      points: event.args[1].toString(),
      source: event.args[2],
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parseNSTClaimed(event: EventLog) {
    return {
      user: event.args[0],
      amount: event.args[1].toString(),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parseAirdropRoundCreated(event: EventLog) {
    return {
      round: Number(event.args[0]),
      growthRewardPerUser: event.args[1].toString(),
      pointsRewardPerUser: event.args[2].toString(),
      timestamp: Number(event.args[3]),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parseAirdropClaimed(event: EventLog) {
    return {
      user: event.args[0],
      round: Number(event.args[1]),
      growthAmount: event.args[2].toString(),
      pointsAmount: event.args[3].toString(),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parseTeamNodeAllocated(event: EventLog) {
    return {
      teamMember: event.args[0],
      count: Number(event.args[1]),
      unlockTime: event.args[2].toString(),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }
}