import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';

// Entities
import { User } from './users/entities/user.entity';
import { Donation } from './donations/entities/donation.entity';
import { Node } from './nodes/entities/node.entity';
import { Referral } from './referrals/entities/referral.entity';
import { NstReward } from './rewards/entities/nst-reward.entity';
import { PointsHistory } from './rewards/entities/points-history.entity';
import { LeaderboardSnapshot } from './leaderboard/entities/leaderboard-snapshot.entity';
import { AirdropRound } from './airdrops/entities/airdrop-round.entity';
import { SyncState } from './blockchain/sync-state.entity';

// Modules
import { BlockchainModule } from './blockchain/blockchain.module';
import { UsersModule } from './users/users.module';
import { DonationsModule } from './donations/donations.module';
import { NodesModule } from './nodes/nodes.module';
import { ReferralsModule } from './referrals/referrals.module';
import { RewardsModule } from './rewards/rewards.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AirdropsModule } from './airdrops/airdrops.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [
          User,
          Donation,
          Node,
          Referral,
          NstReward,
          PointsHistory,
          LeaderboardSnapshot,
          AirdropRound,
          SyncState,
        ],
        synchronize: true, // Set to false in production
        logging: false,
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    BlockchainModule,
    UsersModule,
    DonationsModule,
    NodesModule,
    ReferralsModule,
    RewardsModule,
    LeaderboardModule,
    AirdropsModule,
    StatsModule,
  ],
})
export class AppModule {}