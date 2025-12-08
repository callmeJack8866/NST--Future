import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainService } from './blockchain.service';
import { IndexerService } from './indexer.service';
import { SyncStateManagerService } from './services/sync-state-manager.service';
import { BlockchainEventPollerService } from './services/blockchain-event-poller.service';
import { SyncState } from './sync-state.entity';
import { User } from '../users/entities/user.entity';
import { Donation } from '../donations/entities/donation.entity';
import { Node } from '../nodes/entities/node.entity';
import { Referral } from '../referrals/entities/referral.entity';
import { NstReward } from '../rewards/entities/nst-reward.entity';
import { PointsHistory } from '../rewards/entities/points-history.entity';
import { LeaderboardSnapshot } from '../leaderboard/entities/leaderboard-snapshot.entity';
import { AirdropRound } from '../airdrops/entities/airdrop-round.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SyncState,
      User,
      Donation,
      Node,
      Referral,
      NstReward,
      PointsHistory,
      LeaderboardSnapshot,
      AirdropRound,
    ]),
  ],
  providers: [
    BlockchainService,
    SyncStateManagerService,
    BlockchainEventPollerService,
    IndexerService,
  ],
  exports: [BlockchainService, IndexerService],
})
export class BlockchainModule {}