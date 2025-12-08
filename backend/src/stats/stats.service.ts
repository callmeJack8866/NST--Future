import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Donation } from '../donations/entities/donation.entity';
import { Node } from '../nodes/entities/node.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Donation)
    private donationRepo: Repository<Donation>,
    @InjectRepository(Node)
    private nodeRepo: Repository<Node>,
  ) {}

  async getGlobalStats() {
    const totalUsers = await this.userRepo.count();

    const totalDonationsResult = await this.donationRepo
      .createQueryBuilder('donation')
      .select('SUM(CAST(donation.usdValue AS DECIMAL))', 'total')
      .getRawOne();
    const totalDonationsUSD = totalDonationsResult?.total || '0';

    const totalNodesResult = await this.nodeRepo
      .createQueryBuilder('node')
      .select('SUM(node.count)', 'total')
      .getRawOne();
    const totalNodesIssued = parseInt(totalNodesResult?.total || '0');

    const totalPointsResult = await this.userRepo
      .createQueryBuilder('user')
      .select('SUM(CAST(user.points AS DECIMAL))', 'total')
      .getRawOne();
    const totalPointsDistributed = totalPointsResult?.total || '0';

    const MAX_PUBLIC_NODES = 100;
    const publicNodesRemaining = MAX_PUBLIC_NODES - totalNodesIssued;

    return {
      totalUsers,
      totalDonationsUSD: parseFloat(totalDonationsUSD).toFixed(2),
      totalNodesIssued,
      publicNodesRemaining: Math.max(0, publicNodesRemaining),
      totalPointsDistributed: parseFloat(totalPointsDistributed).toFixed(2),
    };
  }

  async getNodeStats() {
    const publicNodes = await this.nodeRepo
      .createQueryBuilder('node')
      .select('SUM(node.count)', 'total')
      .where('node.type IN (:...types)', { types: ['public', 'auto', 'free_referral'] })
      .getRawOne();

    const teamNodes = await this.nodeRepo
      .createQueryBuilder('node')
      .select('SUM(node.count)', 'total')
      .where('node.type = :type', { type: 'team' })
      .getRawOne();

    const MAX_PUBLIC_NODES = 100;
    const TEAM_RESERVED_NODES = 20;

    const publicNodesIssued = parseInt(publicNodes?.total || '0');
    const teamNodesIssued = parseInt(teamNodes?.total || '0');

    return {
      publicNodesIssued,
      teamNodesIssued,
      publicNodesRemaining: Math.max(0, MAX_PUBLIC_NODES - publicNodesIssued),
      teamNodesRemaining: Math.max(0, TEAM_RESERVED_NODES - teamNodesIssued),
    };
  }
}