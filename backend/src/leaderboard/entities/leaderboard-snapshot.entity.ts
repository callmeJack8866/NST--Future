import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
  } from 'typeorm';
  
  @Entity('leaderboard_snapshots')
  @Index(['round', 'type'])
  export class LeaderboardSnapshot {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'int' })
    round: number;
  
    @Column({ type: 'varchar', length: 20 })
    type: 'highest_points' | 'fastest_growth';
  
    @Column({ type: 'jsonb' })
    rankings: {
      rank: number;
      address: string;
      points: string;
      growth?: string; // For fastest_growth type
    }[];
  
    @Column({ type: 'int', nullable: true })
    blockNumber: number;
  
    @CreateDateColumn()
    snapshotAt: Date;
  }