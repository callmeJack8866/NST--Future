import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Provider, Log, EventLog } from 'ethers';
import NST_FINANCE_ABI from './abi/nst-finance.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: Provider;
  private contract: Contract;

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

  async queryEvents(
    eventName: string,
    fromBlock: number,
    toBlock: number,
  ): Promise<(Log | EventLog)[]> {
    const filter = this.contract.filters[eventName]();
    return this.contract.queryFilter(filter, fromBlock, toBlock);
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

  parseSnapshotTaken(event: EventLog) {
    return {
      round: Number(event.args[0]),
      timestamp: Number(event.args[1]),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parseAirdropRoundCreated(event: EventLog) {
    return {
      round: Number(event.args[0]),
      airdropAmount: event.args[1].toString(),
      totalEligible: Number(event.args[2]),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber,
    };
  }

  parseAirdropClaimed(event: EventLog) {
    return {
      user: event.args[0],
      round: Number(event.args[1]),
      amount: event.args[2].toString(),
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