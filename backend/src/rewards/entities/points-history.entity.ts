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
  
  export enum PointsSource {
    DONATION = 'donation',
    REFERRAL = 'referral',
  }
  
  @Entity('points_history')
  @Index(['userAddress', 'createdAt'])
  export class PointsHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 42 })
    userAddress: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'userAddress' })
    user: User;
  
    @Column({ type: 'decimal', precision: 36, scale: 18 })
    points: string;
  
    @Column({
      type: 'enum',
      enum: PointsSource,
    })
    source: PointsSource;
  
    @Column({ type: 'int', default: 1 })
    multiplier: number;
  
    @Column({ type: 'varchar', length: 66, nullable: true })
    txHash: string;
  
    @Column({ type: 'int', nullable: true })
    blockNumber: number;
  
    @CreateDateColumn()
    createdAt: Date;
  }