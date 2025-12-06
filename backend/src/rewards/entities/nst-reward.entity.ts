import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RewardSource {
  NODE_REFERRAL = 'node_referral',
  DONATION_REFERRAL = 'donation_referral',
  AIRDROP = 'airdrop',
}

@Entity('nst_rewards')
@Index(['userAddress', 'source'])
export class NstReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 42 })
  userAddress: string;

  @ManyToOne(() => User, (user) => user.rewards)
  @JoinColumn({ name: 'userAddress' })
  user: User;

  @Column({ type: 'decimal', precision: 36, scale: 18 })
  amount: string;

  @Column({
    type: 'enum',
    enum: RewardSource,
  })
  source: RewardSource;

  @Column({ type: 'varchar', length: 42, nullable: true })
  sourceAddress: string; // refereed user or airdrop round

  @Column({ type: 'varchar', length: 66, nullable: true })
  txHash: string;

  @Column({ type: 'int', nullable: true })
  blockNumber: number;

  @CreateDateColumn()
  createdAt: Date;
}