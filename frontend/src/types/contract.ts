import { Address } from 'viem';

export interface UserInfo {
  totalDonationUSD: bigint;
  nodeCount: bigint;
  referrer: Address;
  directNodeCount: bigint;
  directDonationUSD: bigint;
  nstReward: bigint;
  hasAutoNode: boolean;
  points: bigint;
  lastSnapshotPoints: bigint;
}

export interface GlobalStats {
  totalNodesIssued: bigint;
  totalDonationsUSD: bigint;
  totalUsers: bigint;
  nodesRemaining: bigint;
  totalPointsDistributed: bigint;
}

export interface NodeStats {
  publicNodesIssued: bigint;
  teamNodesIssued: bigint;
  publicNodesRemaining: bigint;
  teamNodesRemaining: bigint;
}

export interface AirdropEligibility {
  eligible: boolean;
  claimed: boolean;
  amount: bigint;
}

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
}