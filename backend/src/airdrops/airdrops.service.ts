import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AirdropRound } from './entities/airdrop-round.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AirdropsService {
  constructor(
    @InjectRepository(AirdropRound)
    private airdropRoundRepo: Repository<AirdropRound>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getAllRounds() {
    return this.airdropRoundRepo.find({
      order: { round: 'DESC' },
    });
  }

  async getActiveRounds() {
    return this.airdropRoundRepo.find({
      where: { isActive: true },
      order: { round: 'DESC' },
    });
  }

  async getRoundById(round: number) {
    return this.airdropRoundRepo.findOne({
      where: { round },
    });
  }

  async checkEligibility(address: string, round: number) {
    const airdropRound = await this.airdropRoundRepo.findOne({
      where: { round },
    });

    if (!airdropRound) {
      return {
        eligible: false,
        claimed: false,
        reason: 'Round not found',
      };
    }

    const normalizedAddress = address.toLowerCase();
    const isEligible = airdropRound.eligibleUsers.includes(normalizedAddress);
    const hasClaimed = airdropRound.claimedUsers.includes(normalizedAddress);

    return {
      eligible: isEligible,
      claimed: hasClaimed,
      amount: airdropRound.airdropAmount,
      isActive: airdropRound.isActive,
    };
  }

  async getUserAirdropHistory(address: string) {
    const rounds = await this.airdropRoundRepo.find({
      order: { round: 'DESC' },
    });

    const normalizedAddress = address.toLowerCase();

    return rounds.map((round) => ({
      round: round.round,
      amount: round.airdropAmount,
      eligible: round.eligibleUsers.includes(normalizedAddress),
      claimed: round.claimedUsers.includes(normalizedAddress),
      isActive: round.isActive,
      createdAt: round.createdAt,
    }));
  }
}