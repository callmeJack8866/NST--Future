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
  
  export enum NodeType {
    PUBLIC = 'public',
    TEAM = 'team',
    AUTO = 'auto',
    FREE_REFERRAL = 'free_referral',
  }
  
  @Entity('nodes')
  @Index(['userAddress', 'type'])
  export class Node {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 42 })
    userAddress: string;
  
    @ManyToOne(() => User, (user) => user.nodes)
    @JoinColumn({ name: 'userAddress' })
    user: User;
  
    @Column({
      type: 'enum',
      enum: NodeType,
      default: NodeType.PUBLIC,
    })
    type: NodeType;
  
    @Column({ type: 'int', default: 1 })
    count: number;
  
    @Column({ type: 'decimal', precision: 36, scale: 18, default: '0' })
    costUSD: string;
  
    @Column({ type: 'varchar', length: 66, nullable: true })
    txHash: string;
  
    @Column({ type: 'int', nullable: true })
    blockNumber: number;
  
    @CreateDateColumn()
    createdAt: Date;
  }