import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SyncState } from '../sync-state.entity';
import { BlockchainService } from '../blockchain.service';

@Injectable()
export class SyncStateManagerService {
  private readonly logger = new Logger(SyncStateManagerService.name);
  private readonly SYNC_STATE_KEY = 'nst_finance_events';
  
  private lastProcessedBlock: number = 0;
  private isCatchingUp: boolean = false;

  constructor(
    @InjectRepository(SyncState)
    private syncStateRepository: Repository<SyncState>,
    private configService: ConfigService,
    private blockchainService: BlockchainService,
  ) {}

  async initialize(): Promise<number> {
    const syncState = await this.syncStateRepository.findOne({
      where: { key: this.SYNC_STATE_KEY }
    });

    const currentBlock = await this.blockchainService.getCurrentBlockNumber();
    const chainId = this.configService.get<number>('blockchain.chainId') || 97;

    if (syncState) {
      this.lastProcessedBlock = Number(syncState.lastSyncedBlock);
      const blocksBehind = currentBlock - this.lastProcessedBlock;
      
      if (blocksBehind > 0) {
        this.logger.warn(
          `Missed ${blocksBehind} blocks. Last: ${this.lastProcessedBlock}, Current: ${currentBlock}`
        );
      } else {
        this.logger.log(`Sync state loaded at block ${this.lastProcessedBlock}`);
      }
    } else {
      const startBlock = this.configService.get<number>('blockchain.startBlock');
      this.lastProcessedBlock = startBlock || currentBlock;
      
      await this.syncStateRepository.save({
        key: this.SYNC_STATE_KEY,
        lastSyncedBlock: this.lastProcessedBlock.toString(),
        lastCatchupBlock: null,
        isCatchingUp: false,
        chainId,
      });
      
      this.logger.log(`Initialized sync state at block ${this.lastProcessedBlock}`);
    }

    return this.lastProcessedBlock;
  }

  async save(): Promise<void> {
    try {
      await this.syncStateRepository.update(
        { key: this.SYNC_STATE_KEY },
        { 
          lastSyncedBlock: this.lastProcessedBlock.toString(),
          isCatchingUp: this.isCatchingUp,
        }
      );
      this.logger.debug(`Saved sync state: block ${this.lastProcessedBlock}`);
    } catch (error) {
      this.logger.error('Failed to save sync state:', error);
    }
  }

  async updateCatchupProgress(block: number): Promise<void> {
    this.lastProcessedBlock = block;
    await this.syncStateRepository.update(
      { key: this.SYNC_STATE_KEY },
      { 
        lastCatchupBlock: block.toString(),
        lastSyncedBlock: block.toString(),
      }
    );
  }

  getLastProcessedBlock(): number {
    return this.lastProcessedBlock;
  }

  setLastProcessedBlock(block: number): void {
    if (block > this.lastProcessedBlock) {
      this.lastProcessedBlock = block;
    }
  }

  setCatchingUp(value: boolean): void {
    this.isCatchingUp = value;
  }

  isCatchingUpNow(): boolean {
    return this.isCatchingUp;
  }

  async getStatus(currentBlock: number) {
    const syncState = await this.syncStateRepository.findOne({
      where: { key: this.SYNC_STATE_KEY }
    });

    return {
      lastProcessedBlock: this.lastProcessedBlock,
      currentBlock,
      blocksBehind: currentBlock - this.lastProcessedBlock,
      isCatchingUp: this.isCatchingUp,
      lastCatchupBlock: syncState?.lastCatchupBlock ? Number(syncState.lastCatchupBlock) : null,
    };
  }
}

