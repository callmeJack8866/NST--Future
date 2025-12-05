import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
  } from 'typeorm';
  
  @Entity('airdrop_rounds')
  @Index(['round'], { unique: true })
  export class AirdropRound {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'int' })
    round: number;
  
    @Column({ type: 'decimal', precision: 36, scale: 18 })
    airdropAmount: string;
  
    @Column({ type: 'jsonb' })
    eligibleUsers: string[];
  
    @Column({ type: 'jsonb', default: [] })
    claimedUsers: string[];
  
    @Column({ type: 'boolean', default: true })
    isActive: boolean;
  
    @Column({ type: 'int', nullable: true })
    blockNumber: number;
  
    @CreateDateColumn()
    createdAt: Date;
  }