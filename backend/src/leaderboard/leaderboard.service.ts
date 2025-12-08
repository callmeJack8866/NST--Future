import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getTopPointsHolders(limit = 20) {
    return this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.address',
        'user.points',
        'user.nodeCount',
        'user.totalDonationUSD',
      ])
      .orderBy('CAST(user.points AS DECIMAL)', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getTopDonors(limit = 20) {
    return this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.address',
        'user.totalDonationUSD',
        'user.nodeCount',
        'user.points',
      ])
      .orderBy('CAST(user.totalDonationUSD AS DECIMAL)', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getTopReferrers(limit = 20) {
    return this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.address',
        'user.directNodeCount',
        'user.directDonationUSD',
        'user.nodeCount',
      ])
      .where('user.directNodeCount > 0 OR CAST(user.directDonationUSD AS DECIMAL) > 0')
      .orderBy('user.directNodeCount', 'DESC')
      .addOrderBy('CAST(user.directDonationUSD AS DECIMAL)', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getFastestGrowth(limit = 20) {
    // Users with highest points growth since last snapshot
    const users = await this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.address',
        'user.points',
        'user.lastSnapshotPoints',
      ])
      .where('CAST(user.lastSnapshotPoints AS DECIMAL) > 0')
      .getMany();

    // Calculate growth percentage
    const usersWithGrowth = users.map((user) => {
      const currentPoints = parseFloat(user.points);
      const lastPoints = parseFloat(user.lastSnapshotPoints);
      const growth = lastPoints > 0
        ? ((currentPoints - lastPoints) / lastPoints) * 100
        : currentPoints > 0 ? 100 : 0;
      return { ...user, growthPercentage: growth };
    });

    // Sort by growth and take top N
    return usersWithGrowth
      .sort((a, b) => b.growthPercentage - a.growthPercentage)
      .slice(0, limit);
  }
}