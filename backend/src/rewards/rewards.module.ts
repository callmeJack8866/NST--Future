import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { NstReward } from './entities/nst-reward.entity';
import { PointsHistory } from './entities/points-history.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NstReward, PointsHistory, User])],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}