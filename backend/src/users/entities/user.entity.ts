import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { Donation } from '../../donations/entities/donation.entity';
  import { Node } from '../../nodes/entities/node.entity';
  import { NstReward } from '../../rewards/entities/nst-reward.entity';
  
  @Entity('users')
  export class User {
    @PrimaryColumn({ type: 'varchar', length: 42 })
    address: string;
  
    @Column({ type: 'decimal', precision: 36, scale: 18, default: '0' })
    totalDonationUSD: string;
  
    @Column({ type: 'int', default: 0 })
    nodeCount: number;
  
    @Column({ type: 'int', default: 0 })
    teamNodeCount: number;
  
    @Column({ type: 'varchar', length: 42, nullable: true })
    referrerAddress: string;
  
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'referrerAddress' })
    referrer: User;
  
    @Column({ type: 'int', default: 0 })
    directNodeCount: number;
  
    @Column({ type: 'decimal', precision: 36, scale: 18, default: '0' })
    directDonationUSD: string;
  
    @Column({ type: 'decimal', precision: 36, scale: 18, default: '0' })
    nstReward: string;
  
    @Column({ type: 'boolean', default: false })
    hasAutoNode: boolean;
  
    @Column({ type: 'decimal', precision: 36, scale: 18, default: '0' })
    points: string;
  
    @Column({ type: 'decimal', precision: 36, scale: 18, default: '0' })
    lastSnapshotPoints: string;
  
    @Column({ type: 'boolean', default: false })
    isTeamMember: boolean;
  
    @Column({ type: 'bigint', nullable: true })
    teamNodeUnlockTime: string;
  
    @OneToMany(() => Donation, (donation) => donation.user)
    donations: Donation[];
  
    @OneToMany(() => Node, (node) => node.user)
    nodes: Node[];
  
    @OneToMany(() => NstReward, (reward) => reward.user)
    rewards: NstReward[];
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }