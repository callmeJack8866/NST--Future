import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('sync_state')
export class SyncState {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  key: string;

  @Column({ type: 'bigint' })
  lastSyncedBlock: string;

  @Column({ type: 'bigint', nullable: true })
  lastCatchupBlock: string | null;

  @Column({ type: 'boolean', default: false })
  isCatchingUp: boolean;

  @Column({ type: 'int' })
  chainId: number;

  @UpdateDateColumn()
  updatedAt: Date;
}