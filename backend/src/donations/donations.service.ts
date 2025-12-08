import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './entities/donation.entity';

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donation)
    private donationRepo: Repository<Donation>,
  ) {}

  async findByUser(address: string, limit = 50, offset = 0) {
    return this.donationRepo.find({
      where: { userAddress: address.toLowerCase() },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getRecentDonations(limit = 20) {
    return this.donationRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      select: ['userAddress', 'usdValue', 'tokenSymbol', 'txHash', 'createdAt'],
    });
  }
}