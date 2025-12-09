import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AirdropsController } from './airdrops.controller';
import { AirdropsService } from './airdrops.service';
import { AirdropRound } from './entities/airdrop-round.entity';
import { RankingRound } from './entities/ranking-round.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AirdropRound, RankingRound, User])],
  controllers: [AirdropsController],
  providers: [AirdropsService],
  exports: [AirdropsService],
})
export class AirdropsModule {}