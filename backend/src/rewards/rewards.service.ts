import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NstReward } from './entities/nst-reward.entity';
import { PointsHistory } from './entities/points-history.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(NstReward)
    private nstRewardRepo: Repository<NstReward>,
    @InjectRepository(PointsHistory)
    private pointsHistoryRepo: Repository<PointsHistory>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getNstRewardsByUser(address: string) {
    return this.nstRewardRepo.find({
      where: { userAddress: address.toLowerCase() },
      order: { createdAt: 'DESC' },
    });
  }

  async getNstRewardSummary(address: string) {
    const user = await this.userRepo.findOne({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    const rewards = await this.nstRewardRepo.find({
      where: { userAddress: address.toLowerCase() },
    });

    const totalEarned = rewards.reduce(
      (sum, r) => sum + parseFloat(r.amount),
      0,
    );

    return {
      currentBalance: user.nstReward,
      totalEarned: totalEarned.toString(),
      rewardHistory: rewards,
    };
  }

  async getPointsHistoryByUser(address: string, limit = 50) {
    return this.pointsHistoryRepo.find({
      where: { userAddress: address.toLowerCase() },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getPointsSummary(address: string) {
    const user = await this.userRepo.findOne({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    const pointsHistory = await this.pointsHistoryRepo.find({
      where: { userAddress: address.toLowerCase() },
    });

    const totalFromDonations = pointsHistory
      .filter((p) => p.source === 'donation')
      .reduce((sum, p) => sum + parseFloat(p.points), 0);

    const totalFromReferrals = pointsHistory
      .filter((p) => p.source === 'referral')
      .reduce((sum, p) => sum + parseFloat(p.points), 0);

    return {
      currentPoints: user.points,
      lastSnapshotPoints: user.lastSnapshotPoints,
      totalFromDonations: totalFromDonations.toString(),
      totalFromReferrals: totalFromReferrals.toString(),
    };
  }
}