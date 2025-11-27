export interface UserData {
    address: string
    totalDonationUSD: number
    nodeCount: number
    referrer: string | null
    directNodeCount: number
    directDonationUSD: number
    nstReward: number
    points: number
    rank: number
    joinedAt: Date
    isNodeHolder: boolean
    isDonor: boolean
  }
  
  export interface DonationHistory {
    id: string
    chain: string
    token: string
    amount: number
    usdValue: number
    timestamp: Date
    txHash: string
  }
  
  export interface NodePurchase {
    id: string
    count: number
    totalUSD: number
    timestamp: Date
    txHash: string
    source: "purchase" | "upgrade" | "referral"
  }
  
  export interface ReferralData {
    address: string
    totalDonationUSD: number
    nodeCount: number
    joinedAt: Date
    earnedNST: number
  }
  
  export interface LeaderboardEntry {
    rank: number
    address: string
    points: number
    growth: number
    nodeCount: number
    donations: number
  }
  
  // Mock user data
  export const mockUserData: UserData = {
    address: "0x1234...5678",
    totalDonationUSD: 3500,
    nodeCount: 2,
    referrer: "0xabcd...efgh",
    directNodeCount: 5,
    directDonationUSD: 12500,
    nstReward: 2850,
    points: 7000,
    rank: 12,
    joinedAt: new Date("2024-01-15"),
    isNodeHolder: true,
    isDonor: true,
  }
  
  export const mockDonationHistory: DonationHistory[] = [
    {
      id: "1",
      chain: "BSC",
      token: "USDT",
      amount: 1500,
      usdValue: 1500,
      timestamp: new Date("2024-03-15"),
      txHash: "0xabc123...",
    },
    {
      id: "2",
      chain: "BSC",
      token: "USDC",
      amount: 1000,
      usdValue: 1000,
      timestamp: new Date("2024-02-20"),
      txHash: "0xdef456...",
    },
    {
      id: "3",
      chain: "BSC",
      token: "USDT",
      amount: 500,
      usdValue: 500,
      timestamp: new Date("2024-02-01"),
      txHash: "0xghi789...",
    },
    {
      id: "4",
      chain: "BSC",
      token: "USDT",
      amount: 500,
      usdValue: 500,
      timestamp: new Date("2024-01-20"),
      txHash: "0xjkl012...",
    },
  ]
  
  export const mockNodePurchases: NodePurchase[] = [
    { id: "1", count: 1, totalUSD: 2000, timestamp: new Date("2024-03-01"), txHash: "0xnode1...", source: "purchase" },
    { id: "2", count: 1, totalUSD: 0, timestamp: new Date("2024-02-25"), txHash: "0xnode2...", source: "upgrade" },
  ]
  
  export const mockReferrals: ReferralData[] = [
    { address: "0x1111...1111", totalDonationUSD: 5000, nodeCount: 2, joinedAt: new Date("2024-02-01"), earnedNST: 500 },
    { address: "0x2222...2222", totalDonationUSD: 3000, nodeCount: 1, joinedAt: new Date("2024-02-15"), earnedNST: 300 },
    { address: "0x3333...3333", totalDonationUSD: 2500, nodeCount: 1, joinedAt: new Date("2024-03-01"), earnedNST: 250 },
    { address: "0x4444...4444", totalDonationUSD: 1500, nodeCount: 0, joinedAt: new Date("2024-03-10"), earnedNST: 150 },
    { address: "0x5555...5555", totalDonationUSD: 500, nodeCount: 0, joinedAt: new Date("2024-03-15"), earnedNST: 50 },
  ]
  
  export const mockLeaderboardPoints: LeaderboardEntry[] = Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1,
    address: `0x${(i + 1).toString().padStart(4, "0")}...${(i + 1).toString().padStart(4, "0")}`,
    points: Math.floor(50000 - i * 2000 + Math.random() * 500),
    growth: Math.floor(Math.random() * 200) + 10,
    nodeCount: Math.floor(Math.random() * 5) + 1,
    donations: Math.floor((50000 - i * 2000) / 2),
  }))
  
  export const mockLeaderboardGrowth: LeaderboardEntry[] = Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1,
    address: `0x${String.fromCharCode(65 + i)}...${String.fromCharCode(65 + i)}`,
    points: Math.floor(Math.random() * 20000) + 5000,
    growth: Math.floor(500 - i * 20 + Math.random() * 50),
    nodeCount: Math.floor(Math.random() * 3) + 1,
    donations: Math.floor(Math.random() * 10000) + 1000,
  }))
  
  export const mockGlobalStats = {
    totalDonations: 2450000,
    totalNodes: 78,
    totalUsers: 1247,
    totalNSTDistributed: 125000,
    nodesRemaining: 22,
  }
  