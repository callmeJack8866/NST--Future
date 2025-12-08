import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { User } from '../users/entities/user.entity';
import { Donation } from '../donations/entities/donation.entity';
import { Node } from '../nodes/entities/node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Donation, Node])],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}