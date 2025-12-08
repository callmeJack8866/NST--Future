import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findByAddress(address: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { address: address.toLowerCase() },
      relations: ['donations', 'nodes', 'rewards'],
    });
  }

  async getUserDashboard(address: string) {
    const user = await this.userRepo.findOne({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    const totalNodes = user.nodeCount + user.teamNodeCount;
    const isNodeHolder = totalNodes > 0;
    const isDonor = parseFloat(user.totalDonationUSD) >= 100;

    return {
      address: user.address,
      totalDonationUSD: user.totalDonationUSD,
      nodeCount: user.nodeCount,
      teamNodeCount: user.teamNodeCount,
      totalNodes,
      referrerAddress: user.referrerAddress,
      directNodeCount: user.directNodeCount,
      directDonationUSD: user.directDonationUSD,
      nstReward: user.nstReward,
      hasAutoNode: user.hasAutoNode,
      points: user.points,
      lastSnapshotPoints: user.lastSnapshotPoints,
      isNodeHolder,
      isDonor,
      isTeamMember: user.isTeamMember,
      createdAt: user.createdAt,
    };
  }

  async getReferrals(address: string) {
    return this.userRepo.find({
      where: { referrerAddress: address.toLowerCase() },
      select: ['address', 'totalDonationUSD', 'nodeCount', 'createdAt'],
    });
  }
}