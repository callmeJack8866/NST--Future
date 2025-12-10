import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('ranking_rounds')
@Index(['round'], { unique: true })
export class RankingRound {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  round: number;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  growthAirdropAmount: string;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  cumulativeAirdropAmount: string;

  @Column({ type: 'jsonb', default: [] })
  topGrowthUsers: string[]; // Top 20 addresses sorted by growth %

  @Column({ type: 'jsonb', default: [] })
  topCumulativeUsers: string[]; // Top 20 addresses sorted by total points

  @Column({ type: 'jsonb', default: [] })
  growthClaimedUsers: string[];

  @Column({ type: 'jsonb', default: [] })
  cumulativeClaimedUsers: string[];

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 66, nullable: true })
  txHash: string;

  @Column({ type: 'int', nullable: true })
  blockNumber: number;

  @Column({ type: 'jsonb', nullable: true })
  snapshotData: {
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
  };

  @CreateDateColumn()
  createdAt: Date;
}
