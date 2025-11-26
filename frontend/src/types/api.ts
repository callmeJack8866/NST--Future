export interface User {
    address: string;
    totalDonation: number;
    nodeCount: number;
    teamNodeCount: number;
    points: number;
    nstRewards: number;
    referrer: string | null;
    referralCount: number;
    rank: number | null;
  }
  
  export interface DonationHistory {
    id: string;
    amount: number;
    token: string;
    timestamp: number;
    txHash: string;
  }
  
  export interface NodeHistory {
    id: string;
    count: number;
    cost: number;
    type: 'purchase' | 'auto' | 'referral';
    timestamp: number;
    txHash: string;
  }