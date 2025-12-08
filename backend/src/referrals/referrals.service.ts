import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from './entities/referral.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private referralRepo: Repository<Referral>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getReferralsByReferrer(address: string) {
    return this.referralRepo.find({
      where: { referrerAddress: address.toLowerCase() },
      order: { boundAt: 'DESC' },
    });
  }

  async getReferralStats(address: string) {
    const user = await this.userRepo.findOne({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      return null;
    }

    const referrals = await this.referralRepo.find({
      where: { referrerAddress: address.toLowerCase() },
    });

    // Get referees' details
    const refereeDetails = await Promise.all(
      referrals.map(async (ref) => {
        const referee = await this.userRepo.findOne({
          where: { address: ref.refereeAddress },
          select: ['address', 'totalDonationUSD', 'nodeCount', 'createdAt'],
        });
        return {
          address: ref.refereeAddress,
          totalDonationUSD: referee?.totalDonationUSD || '0',
          nodeCount: referee?.nodeCount || 0,
          joinedAt: ref.boundAt,
        };
      }),
    );

    return {
      totalReferrals: referrals.length,
      directNodeCount: user.directNodeCount,
      directDonationUSD: user.directDonationUSD,
      referrals: refereeDetails,
    };
  }

  async getReferrer(address: string) {
    const user = await this.userRepo.findOne({
      where: { address: address.toLowerCase() },
      select: ['referrerAddress'],
    });

    return user?.referrerAddress || null;
  }
}