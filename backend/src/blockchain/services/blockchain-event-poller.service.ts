import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventLog, Log } from 'ethers';
import { BlockchainService, QueryEventsResult } from '../blockchain.service';

export interface EventBatchResult {
  eventName: string;
  events: (Log | EventLog)[];
  skippedDueToPruning: boolean;
}

export interface PollResult {
  results: EventBatchResult[];
  newBlock: number;
  allPruned: boolean;
  anyPruned: boolean;
}

@Injectable()
export class BlockchainEventPollerService {
  private readonly logger = new Logger(BlockchainEventPollerService.name);
  private readonly batchSize: number;

  constructor(
    private blockchainService: BlockchainService,
    private configService: ConfigService,
  ) {
    this.batchSize = this.configService.get<number>('blockchain.batchSize') || 1000;
  }

  /**
   * Poll for new events from the last processed block to the current block
   */
  async pollNewEvents(
    eventNames: string[],
    fromBlock: number,
  ): Promise<PollResult> {
    const currentBlock = await this.blockchainService.getCurrentBlockNumber();
    
    if (fromBlock > currentBlock) {
      return {
        results: [],
        newBlock: fromBlock - 1,
        allPruned: false,
        anyPruned: false,
      };
    }

    const toBlock = Math.min(fromBlock + this.batchSize - 1, currentBlock);
    
    this.logger.debug(`Polling blocks ${fromBlock} to ${toBlock}`);

    const results = await this.queryAllEventsParallel(eventNames, fromBlock, toBlock);
    
    // Check pruning status
    let allPruned = true;
    let anyPruned = false;
    
    for (const result of results) {
      if (result.skippedDueToPruning) {
        anyPruned = true;
      } else {
        allPruned = false;
      }
    }

    if (results.length === 0) {
      allPruned = false;
    }

    return {
      results,
      newBlock: toBlock,
      allPruned,
      anyPruned,
    };
  }

  /**
   * Catch up on missed events from a range of blocks
   */
  async catchUp(
    eventNames: string[],
    fromBlock: number,
    toBlock: number,
    onProgress?: (block: number, results: EventBatchResult[]) => Promise<void>,
  ): Promise<void> {
    this.logger.log(`Catching up from block ${fromBlock} to ${toBlock} (${toBlock - fromBlock + 1} blocks)`);

    let currentFrom = fromBlock;
    let totalEventsProcessed = 0;
    let prunedBatchesSkipped = 0;

    while (currentFrom <= toBlock) {
      const currentTo = Math.min(currentFrom + this.batchSize - 1, toBlock);
      
      try {
        const results = await this.queryAllEventsParallel(eventNames, currentFrom, currentTo);
        
        // Check if all events in this batch were pruned
        const allPruned = results.every(r => r.skippedDueToPruning);
        const anyPruned = results.some(r => r.skippedDueToPruning);

        if (allPruned && results.length > 0) {
          prunedBatchesSkipped++;
          this.logger.warn(
            `Blocks ${currentFrom}-${currentTo} are fully pruned, skipping (${prunedBatchesSkipped} batches skipped)`
          );
        } else {
          // Count events processed
          const batchEvents = results.reduce((sum, r) => sum + r.events.length, 0);
          totalEventsProcessed += batchEvents;

          if (batchEvents > 0) {
            this.logger.debug(
              `Processed ${batchEvents} events from blocks ${currentFrom}-${currentTo}`
            );
          }

          if (anyPruned) {
            this.logger.warn(
              `Some events in blocks ${currentFrom}-${currentTo} were pruned`
            );
          }
        }

        // Call progress callback with results (even if pruned, to update sync state)
        if (onProgress) {
          await onProgress(currentTo, results);
        }

        currentFrom = currentTo + 1;
      } catch (error) {
        this.logger.error(`Error processing blocks ${currentFrom}-${currentTo}:`, error);
        throw error;
      }
    }

    this.logger.log(
      `Catch-up complete. Processed ${totalEventsProcessed} events, skipped ${prunedBatchesSkipped} pruned batches`
    );
  }

  /**
   * Query all events in parallel for efficiency
   */
  private async queryAllEventsParallel(
    eventNames: string[],
    fromBlock: number,
    toBlock: number,
  ): Promise<EventBatchResult[]> {
    const promises = eventNames.map(async (eventName): Promise<EventBatchResult> => {
      const result = await this.blockchainService.queryEventsWithRetry(
        eventName,
        fromBlock,
        toBlock,
      );
      
      return {
        eventName,
        events: result.events,
        skippedDueToPruning: result.skippedDueToPruning,
      };
    });

    return Promise.all(promises);
  }
}

