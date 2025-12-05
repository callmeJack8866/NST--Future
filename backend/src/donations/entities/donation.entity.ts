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
  
  export enum DonationSource {
    DONATION = 'donation',
    NODE_PURCHASE = 'node_purchase',
  }
  
  @Entity('donations')
  @Index(['userAddress', 'createdAt'])
  @Index(['txHash'], { unique: true })
  export class Donation {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 42 })
    userAddress: string;
  
    @ManyToOne(() => User, (user) => user.donations)
    @JoinColumn({ name: 'userAddress' })
    user: User;
  
    @Column({ type: 'varchar', length: 42 })
    tokenAddress: string;
  
    @Column({ type: 'varchar', length: 10 })
    tokenSymbol: string;
  
    @Column({ type: 'decimal', precision: 36, scale: 18 })
    amount: string;
  
    @Column({ type: 'decimal', precision: 36, scale: 18 })
    usdValue: string;
  
    @Column({ type: 'varchar', length: 66 })
    txHash: string;
  
    @Column({ type: 'int' })
    blockNumber: number;
  
    @Column({ type: 'int' })
    chainId: number;
  
    @Column({
      type: 'enum',
      enum: DonationSource,
      default: DonationSource.DONATION,
    })
    source: DonationSource;
  
    @Column({ type: 'varchar', length: 42, nullable: true })
    referrerAddress: string;
  
    @CreateDateColumn()
    createdAt: Date;
  }