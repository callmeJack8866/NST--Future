import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
    Unique,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  
  @Entity('referrals')
  @Unique(['refereeAddress'])
  @Index(['referrerAddress'])
  export class Referral {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 42 })
    referrerAddress: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'referrerAddress' })
    referrer: User;
  
    @Column({ type: 'varchar', length: 42 })
    refereeAddress: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'refereeAddress' })
    referee: User;
  
    @Column({ type: 'varchar', length: 66, nullable: true })
    txHash: string;
  
    @Column({ type: 'int', nullable: true })
    blockNumber: number;
  
    @CreateDateColumn()
    boundAt: Date;
  }