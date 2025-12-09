import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RankingRound } from './entities/ranking-round.entity';
import { User } from '../users/entities/user.entity';

export interface GrowthRanking {
  address: string;
  previousPoints: number;
  currentPoints: number;
  growthPercentage: number;
  rank: number;
}

export interface CumulativeRanking {
  address: string;
  totalPoints: number;
  rank: number;
}

export interface PreparedAirdropData {
  round: number;
  topGrowthUsers: GrowthRanking[];
  topCumulativeUsers: CumulativeRanking[];
  timestamp: Date;
}

@Injectable()
export class AirdropsService {
  constructor(
    @InjectRepository(RankingRound)
    private rankingRoundRepo: Repository<RankingRound>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Get all ranking rounds
   */
  async getAllRankingRounds(): Promise<RankingRound[]> {
    try {
      return await this.rankingRoundRepo.find({
        order: { round: 'DESC' },
      });
    } catch (err) {
      console.log('Error fetching ranking rounds:', err.message);
      return [];
    }
  }

  /**
   * Get ranking round by number
   */
  async getRankingRoundById(round: number): Promise<RankingRound | null> {
    try {
      return await this.rankingRoundRepo.findOne({
        where: { round },
      });
    } catch (err) {
      console.log('Error fetching ranking round:', err.message);
      return null;
    }
  }

  /**
   * Get current ranking round number
   */
  async getCurrentRankingRound(): Promise<number> {
    try {
      const latest = await this.rankingRoundRepo.findOne({
        order: { round: 'DESC' },
      });
      return latest?.round || 0;
    } catch (err) {
      console.log('Error getting current ranking round:', err.message);
      return 0;
    }
  }

  /**
   * Prepare airdrop data based on current rankings
   * Calculates growth % and cumulative points for all users
   * Returns Top 20 for each category
   */
  async prepareAirdropData(): Promise<PreparedAirdropData> {
    let currentRound = 0;
    try {
      currentRound = await this.getCurrentRankingRound();
    } catch (err) {
      console.log('Could not get current ranking round:', err.message);
    }
    const nextRound = currentRound + 1;

    // Get all users with points
    const users = await this.userRepo.find({
      select: ['address', 'points', 'lastSnapshotPoints'],
    });

    // Filter users with points > 0
    const usersWithPoints = users.filter((user) => {
      const points = parseFloat(user.points) || 0;

      console.log('user.address - 1111111111111', user.address);
      console.log('points - 2222222222222', points);
      
      return points > 0;
    });

    // Calculate growth rankings
    const growthRankings: GrowthRanking[] = usersWithPoints
      .map((user) => {
        const currentPoints = parseFloat(user.points) || 0;
        const previousPoints = parseFloat(user.lastSnapshotPoints) || 0;

        let growthPercentage = 0;
        if (previousPoints > 0) {
          growthPercentage = ((currentPoints - previousPoints) / previousPoints) * 100;
        } else if (currentPoints > 0) {
          // New users with points get 100% growth
          growthPercentage = 100;
        }

        return {
          address: user.address,
          previousPoints,
          currentPoints,
          growthPercentage,
          rank: 0,
        };
      })
      .filter((u) => u.growthPercentage > 0) // Only positive growth
      .sort((a, b) => b.growthPercentage - a.growthPercentage)
      .slice(0, 20)
      .map((u, index) => ({ ...u, rank: index + 1 }));

    // Calculate cumulative rankings (total points)
    const cumulativeRankings: CumulativeRanking[] = usersWithPoints
      .map((user) => ({
        address: user.address,
        totalPoints: parseFloat(user.points) || 0,
        rank: 0,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 20)
      .map((u, index) => ({ ...u, rank: index + 1 }));

    return {
      round: nextRound,
      topGrowthUsers: growthRankings,
      topCumulativeUsers: cumulativeRankings,
      timestamp: new Date(),
    };
  }

  /**
   * Get enriched ranking data for blockchain addresses
   * Used by indexer to enrich contract event data with snapshot details
   */
  async enrichRankingAddresses(
    topGrowthAddresses: string[],
    topCumulativeAddresses: string[],
  ): Promise<{
    growthRankings: Array<{
      address: string;
      previousPoints: number;
      currentPoints: number;
      growthPercentage: number;
    }>;
    cumulativeRankings: Array<{
      address: string;
      totalPoints: number;
    }>;
  }> {
    const enrichedGrowth: Array<{
      address: string;
      previousPoints: number;
      currentPoints: number;
      growthPercentage: number;
    }> = [];
    
    const enrichedCumulative: Array<{
      address: string;
      totalPoints: number;
    }> = [];

    // Enrich growth rankings
    for (const address of topGrowthAddresses) {
      // Skip zero addresses
      if (address === '0x0000000000000000000000000000000000000000') continue;
      
      const user = await this.userRepo.findOne({
        where: { address: address.toLowerCase() },
      });

      if (user) {
        const currentPoints = parseFloat(user.points) || 0;
        const previousPoints = parseFloat(user.lastSnapshotPoints) || 0;
        
        let growthPercentage = 0;
        if (previousPoints > 0) {
          growthPercentage = ((currentPoints - previousPoints) / previousPoints) * 100;
        } else if (currentPoints > 0) {
          growthPercentage = 100;
        }

        enrichedGrowth.push({
          address: address.toLowerCase(),
          previousPoints,
          currentPoints,
          growthPercentage,
        });
      }
    }

    // Enrich cumulative rankings
    for (const address of topCumulativeAddresses) {
      // Skip zero addresses
      if (address === '0x0000000000000000000000000000000000000000') continue;
      
      const user = await this.userRepo.findOne({
        where: { address: address.toLowerCase() },
      });

      if (user) {
        enrichedCumulative.push({
          address: address.toLowerCase(),
          totalPoints: parseFloat(user.points) || 0,
        });
      }
    }

    return {
      growthRankings: enrichedGrowth,
      cumulativeRankings: enrichedCumulative,
    };
  }

  /**
   * Update lastSnapshotPoints for all users
   * Called after processing a ranking round
   */
  async updateAllUserSnapshots(): Promise<number> {
    const result = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({
        lastSnapshotPoints: () => 'points',
      })
      .execute();

    return result.affected || 0;
  }

  /**
   * Update lastSnapshotPoints for specific users
   */
  async updateUserSnapshots(addresses: string[]): Promise<number> {
    if (addresses.length === 0) return 0;

    const result = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({
        lastSnapshotPoints: () => 'points',
      })
      .where('address IN (:...addresses)', {
        addresses: addresses.map((a) => a.toLowerCase()),
      })
      .execute();

    return result.affected || 0;
  }

  /**
   * Reset lastSnapshotPoints to 0 for all users
   * This allows all users to show growth in the next round
   */
  async resetAllSnapshots(): Promise<number> {
    console.log('resetAllSnapshots - Starting reset to 0...');
    try {
      const result = await this.userRepo
        .createQueryBuilder()
        .update(User)
        .set({
          lastSnapshotPoints: '0',
        })
        .execute();

      console.log('resetAllSnapshots - Reset complete:', {
        affected: result.affected,
      });

      return result.affected || 0;
    } catch (err) {
      console.error('resetAllSnapshots - Error:', err.message);
      throw err;
    }
  }

  /**
   * Check user's ranking eligibility for a round
   */
  async checkRankingEligibility(address: string, round: number) {
    const rankingRound = await this.rankingRoundRepo.findOne({
      where: { round },
    });

    if (!rankingRound) {
      return {
        round,
        found: false,
        isInGrowthTop20: false,
        isInCumulativeTop20: false,
        hasClaimedGrowth: false,
        hasClaimedCumulative: false,
        growthAmount: '0',
        cumulativeAmount: '0',
      };
    }

    const normalizedAddress = address.toLowerCase();

    const isInGrowthTop20 = rankingRound.topGrowthUsers.includes(normalizedAddress);
    const isInCumulativeTop20 = rankingRound.topCumulativeUsers.includes(normalizedAddress);
    const hasClaimedGrowth = rankingRound.growthClaimedUsers.includes(normalizedAddress);
    const hasClaimedCumulative = rankingRound.cumulativeClaimedUsers.includes(normalizedAddress);

    const growthPosition = isInGrowthTop20
      ? rankingRound.topGrowthUsers.indexOf(normalizedAddress) + 1
      : 0;
    const cumulativePosition = isInCumulativeTop20
      ? rankingRound.topCumulativeUsers.indexOf(normalizedAddress) + 1
      : 0;

    return {
      round,
      found: true,
      isInGrowthTop20,
      isInCumulativeTop20,
      growthPosition,
      cumulativePosition,
      hasClaimedGrowth,
      hasClaimedCumulative,
      growthAmount: rankingRound.growthAirdropAmount,
      cumulativeAmount: rankingRound.cumulativeAirdropAmount,
      isActive: rankingRound.isActive,
    };
  }

  /**
   * Get user's ranking history across all rounds
   */
  async getUserRankingHistory(address: string) {
    const rounds = await this.rankingRoundRepo.find({
      order: { round: 'DESC' },
    });

    const normalizedAddress = address.toLowerCase();

    return rounds.map((round) => {
      const isInGrowthTop20 = round.topGrowthUsers.includes(normalizedAddress);
      const isInCumulativeTop20 = round.topCumulativeUsers.includes(normalizedAddress);

      return {
        round: round.round,
        isInGrowthTop20,
        isInCumulativeTop20,
        growthPosition: isInGrowthTop20
          ? round.topGrowthUsers.indexOf(normalizedAddress) + 1
          : 0,
        cumulativePosition: isInCumulativeTop20
          ? round.topCumulativeUsers.indexOf(normalizedAddress) + 1
          : 0,
        hasClaimedGrowth: round.growthClaimedUsers.includes(normalizedAddress),
        hasClaimedCumulative: round.cumulativeClaimedUsers.includes(normalizedAddress),
        growthAmount: round.growthAirdropAmount,
        cumulativeAmount: round.cumulativeAirdropAmount,
        isActive: round.isActive,
        createdAt: round.createdAt,
      };
    });
  }

  /**
   * Mark user as claimed for growth airdrop
   * Called by indexer when claim event is detected
   */
  async markGrowthClaimed(address: string, round: number): Promise<void> {
    const rankingRound = await this.rankingRoundRepo.findOne({
      where: { round },
    });

    if (!rankingRound) {
      throw new NotFoundException(`Ranking round ${round} not found`);
    }

    const normalizedAddress = address.toLowerCase();
    if (!rankingRound.growthClaimedUsers.includes(normalizedAddress)) {
      rankingRound.growthClaimedUsers.push(normalizedAddress);
      await this.rankingRoundRepo.save(rankingRound);
    }
  }

  /**
   * Mark user as claimed for cumulative airdrop
   * Called by indexer when claim event is detected
   */
  async markCumulativeClaimed(address: string, round: number): Promise<void> {
    const rankingRound = await this.rankingRoundRepo.findOne({
      where: { round },
    });

    if (!rankingRound) {
      throw new NotFoundException(`Ranking round ${round} not found`);
    }

    const normalizedAddress = address.toLowerCase();
    if (!rankingRound.cumulativeClaimedUsers.includes(normalizedAddress)) {
      rankingRound.cumulativeClaimedUsers.push(normalizedAddress);
      await this.rankingRoundRepo.save(rankingRound);
    }
  }

  /**
   * Close a ranking round (disable claims)
   */
  async closeRankingRound(round: number): Promise<void> {
    const rankingRound = await this.rankingRoundRepo.findOne({
      where: { round },
    });

    if (!rankingRound) {
      throw new NotFoundException(`Ranking round ${round} not found`);
    }

    rankingRound.isActive = false;
    await this.rankingRoundRepo.save(rankingRound);
  }

  /**
   * Get ranking statistics
   */
  async getRankingStats() {
    try {
      const totalRounds = await this.rankingRoundRepo.count();
      const activeRounds = await this.rankingRoundRepo.count({ where: { isActive: true } });
      const latestRound = await this.rankingRoundRepo.findOne({
        order: { round: 'DESC' },
      });

      return {
        totalRounds,
        activeRounds,
        currentRound: latestRound?.round || 0,
        lastRoundTimestamp: latestRound?.createdAt || null,
      };
    } catch (err) {
      console.log('Error getting ranking stats:', err.message);
      return {
        totalRounds: 0,
        activeRounds: 0,
        currentRound: 0,
        lastRoundTimestamp: null,
      };
    }
  }

  /**
   * Get data formatted for smart contract call
   * Pads arrays to 20 addresses as required by contract
   */
  async getContractCallData(): Promise<{
    topGrowthUsers: string[];
    topCumulativeUsers: string[];
  }> {
    const preparedData = await this.prepareAirdropData();

    const topGrowthUsers = [...preparedData.topGrowthUsers.map((u) => u.address)];
    const topCumulativeUsers = [...preparedData.topCumulativeUsers.map((u) => u.address)];

    // Pad with zero addresses if less than 20
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    while (topGrowthUsers.length < 20) {
      topGrowthUsers.push(zeroAddress);
    }
    while (topCumulativeUsers.length < 20) {
      topCumulativeUsers.push(zeroAddress);
    }

    return {
      topGrowthUsers,
      topCumulativeUsers,
    };
  }
}
