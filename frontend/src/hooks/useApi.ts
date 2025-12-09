"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAccount } from "wagmi"
import {
  getUserDashboard,
  getUserDonations,
  getUserReferrals,
  getGlobalStats,
  getNodeStats,
  getRecentDonations,
  getUserNodes,
  getUserNodeSummary,
  getRecentNodePurchases,
  getNodeHolders,
  getReferralsByReferrer,
  getReferralStats,
  getUserReferrer,
  type UserDashboardResponse,
  type DonationResponse,
  type ReferralResponse,
  type GlobalStatsResponse,
  type NodeStatsResponse,
  type NodeResponse,
  type NodeSummaryResponse,
  type RecentNodePurchaseResponse,
  type NodeHolderResponse,
  type ReferralDetailResponse,
  type ReferralStatsResponse,
  type ReferralRecordResponse,
} from "@/lib/api/client"

// ============================================================================
// Types
// ============================================================================

export interface UserInfo {
  address: string
  totalDonationUSD: number
  nodeCount: number
  teamNodeCount: number
  totalNodes: number
  referrer: string | null
  directNodeCount: number
  directDonationUSD: number
  nstReward: number
  hasAutoNode: boolean
  points: number
  lastSnapshotPoints: number
  isNodeHolder: boolean
  isDonor: boolean
  isRegistered: boolean
  isTeamMember: boolean
  createdAt: Date | null
}

export interface Donation {
  id: string
  userAddress: string
  tokenSymbol: string
  amount: number
  usdValue: number
  txHash: string
  blockNumber: number
  chainId: number
  source: "donation" | "node_purchase"
  referrerAddress: string | null
  createdAt: Date
}

export interface Referral {
  address: string
  totalDonationUSD: number
  nodeCount: number
  createdAt: Date
}

export interface GlobalStats {
  totalUsers: number
  totalDonationsUSD: number
  totalNodesIssued: number
  nodesRemaining: number
  totalPointsDistributed: number
}

export interface NodeStats {
  publicNodesIssued: number
  teamNodesIssued: number
  publicNodesRemaining: number
  teamNodesRemaining: number
}

// ============================================================================
// Transform functions
// ============================================================================

function transformUserDashboard(data: UserDashboardResponse): UserInfo {
  return {
    address: data.address,
    totalDonationUSD: parseFloat(data.totalDonationUSD) || 0,
    nodeCount: data.nodeCount,
    teamNodeCount: data.teamNodeCount,
    totalNodes: data.totalNodes,
    referrer: data.referrerAddress,
    directNodeCount: data.directNodeCount,
    directDonationUSD: parseFloat(data.directDonationUSD) || 0,
    nstReward: parseFloat(data.nstReward) || 0,
    hasAutoNode: data.hasAutoNode,
    points: parseFloat(data.points) || 0,
    lastSnapshotPoints: parseFloat(data.lastSnapshotPoints) || 0,
    isNodeHolder: data.isNodeHolder,
    isDonor: data.isDonor,
    isRegistered: true,
    isTeamMember: data.isTeamMember,
    createdAt: new Date(data.createdAt),
  }
}

function transformDonation(data: DonationResponse): Donation {
  return {
    id: data.id,
    userAddress: data.userAddress,
    tokenSymbol: data.tokenSymbol,
    amount: parseFloat(data.amount) || 0,
    usdValue: parseFloat(data.usdValue) || 0,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    chainId: data.chainId,
    source: data.source,
    referrerAddress: data.referrerAddress,
    createdAt: new Date(data.createdAt),
  }
}

function transformReferral(data: ReferralResponse): Referral {
  return {
    address: data.address,
    totalDonationUSD: parseFloat(data.totalDonationUSD) || 0,
    nodeCount: data.nodeCount,
    createdAt: new Date(data.createdAt),
  }
}

function transformGlobalStats(data: GlobalStatsResponse): GlobalStats {
  return {
    totalUsers: data.totalUsers,
    totalDonationsUSD: parseFloat(data.totalDonationsUSD),
    totalNodesIssued: data.totalNodesIssued,
    nodesRemaining: data.publicNodesRemaining,
    totalPointsDistributed: parseFloat(data.totalPointsDistributed),
  }
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch user information from the backend API
 */
export function useUserInfoApi() {
  const { address, isConnected } = useAccount()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserInfo = useCallback(async () => {
    if (!address || !isConnected) {
      setUserInfo(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await getUserDashboard(address)
      
      if (response.error) {
        setError(response.error)
        setUserInfo(null)
      } else if (response.data) {
        setUserInfo(transformUserDashboard(response.data))
      } else {
        // User not found in database (not registered yet)
        setUserInfo({
          address,
          totalDonationUSD: 0,
          nodeCount: 0,
          teamNodeCount: 0,
          totalNodes: 0,
          referrer: null,
          directNodeCount: 0,
          directDonationUSD: 0,
          nstReward: 0,
          hasAutoNode: false,
          points: 0,
          lastSnapshotPoints: 0,
          isNodeHolder: false,
          isDonor: false,
          isRegistered: false,
          isTeamMember: false,
          createdAt: null,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user info")
      setUserInfo(null)
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

  return {
    userInfo,
    isLoading,
    error,
    isConnected,
    refetch: fetchUserInfo,
  }
}

/**
 * Hook to fetch user's donation history from the backend API
 */
export function useUserDonations(limit = 50) {
  const { address, isConnected } = useAccount()
  const [donations, setDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const fetchDonations = useCallback(async (resetOffset = false) => {
    if (!address || !isConnected) {
      setDonations([])
      return
    }

    setIsLoading(true)
    setError(null)

    const currentOffset = resetOffset ? 0 : offset

    try {
      const response = await getUserDonations(address, limit, currentOffset)
      
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        const transformedDonations = response.data.map(transformDonation)
        
        if (resetOffset) {
          setDonations(transformedDonations)
          setOffset(limit)
        } else {
          setDonations(prev => [...prev, ...transformedDonations])
          setOffset(prev => prev + limit)
        }
        
        setHasMore(response.data.length === limit)
      } else {
        setDonations([])
        setHasMore(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch donations")
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected, limit, offset])

  useEffect(() => {
    if (address && isConnected) {
      fetchDonations(true)
    }
  }, [address, isConnected])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchDonations(false)
    }
  }, [fetchDonations, isLoading, hasMore])

  return {
    donations,
    isLoading,
    error,
    hasMore,
    refetch: () => fetchDonations(true),
    loadMore,
  }
}

/**
 * Hook to fetch user's referrals from the backend API
 */
export function useUserReferrals() {
  const { address, isConnected } = useAccount()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReferrals = useCallback(async () => {
    if (!address || !isConnected) {
      setReferrals([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await getUserReferrals(address)
      
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setReferrals(response.data.map(transformReferral))
      } else {
        setReferrals([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch referrals")
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    fetchReferrals()
  }, [fetchReferrals])

  return {
    referrals,
    isLoading,
    error,
    refetch: fetchReferrals,
  }
}

/**
 * Hook to fetch global platform statistics from the backend API
 */
export function useGlobalStatsApi() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getGlobalStats()
      
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setStats(transformGlobalStats(response.data))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch global stats")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    globalStats: stats,
    isLoading,
    error,
    refetch: fetchStats,
  }
}

/**
 * Hook to fetch node statistics from the backend API
 */
export function useNodeStatsApi() {
  const [stats, setStats] = useState<NodeStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getNodeStats()
      
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setStats(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch node stats")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    nodeStats: stats,
    isLoading,
    error,
    refetch: fetchStats,
  }
}

/**
 * Hook to fetch recent platform donations from the backend API
 */
export function useRecentDonationsApi(limit = 20) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDonations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getRecentDonations(limit)
      
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setDonations(response.data.map(transformDonation))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch recent donations")
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchDonations()
  }, [fetchDonations])

  return {
    donations,
    isLoading,
    error,
    refetch: fetchDonations,
  }
}

/**
 * Hook to check if user is eligible for auto node upgrade
 * Uses data from the API instead of direct contract call
 */
export function useAutoNodeEligibilityApi() {
  const { userInfo, isLoading } = useUserInfoApi()
  
  const isEligible = userInfo 
    ? !userInfo.hasAutoNode && userInfo.totalDonationUSD >= 2000
    : false

  return {
    isEligible,
    isLoading,
    hasAutoNode: userInfo?.hasAutoNode ?? false,
    totalDonated: userInfo?.totalDonationUSD ?? 0,
  }
}

// ============================================================================
// Node Types
// ============================================================================

export interface UserNode {
  id: string
  userAddress: string
  type: "public" | "team" | "auto" | "free_referral"
  count: number
  costUSD: number
  txHash: string | null
  blockNumber: number | null
  createdAt: Date
}

export interface NodeSummary {
  public: number
  team: number
  auto: number
  freeReferral: number
  total: number
}

export interface RecentNodePurchase {
  userAddress: string
  count: number
  costUSD: number
  txHash: string
  createdAt: Date
}

export interface NodeHolder {
  userAddress: string
  totalNodes: number
}

// ============================================================================
// Node Transform Functions
// ============================================================================

function transformUserNode(data: NodeResponse): UserNode {
  return {
    id: data.id,
    userAddress: data.userAddress,
    type: data.type,
    count: data.count,
    costUSD: parseFloat(data.costUSD) || 0,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    createdAt: new Date(data.createdAt),
  }
}

function transformRecentNodePurchase(data: RecentNodePurchaseResponse): RecentNodePurchase {
  return {
    userAddress: data.userAddress,
    count: data.count,
    costUSD: parseFloat(data.costUSD) || 0,
    txHash: data.txHash,
    createdAt: new Date(data.createdAt),
  }
}

function transformNodeHolder(data: NodeHolderResponse): NodeHolder {
  return {
    userAddress: data.userAddress,
    totalNodes: parseInt(data.totalNodes) || 0,
  }
}

// ============================================================================
// Node Hooks
// ============================================================================

/**
 * Hook to fetch user's nodes from the backend API
 */
export function useUserNodesApi() {
  const { address, isConnected } = useAccount()
  const [nodes, setNodes] = useState<UserNode[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNodes = useCallback(async () => {
    if (!address || !isConnected) {
      setNodes([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await getUserNodes(address)
      
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setNodes(response.data.map(transformUserNode))
      } else {
        setNodes([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch nodes")
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    fetchNodes()
  }, [fetchNodes])

  return {
    nodes,
    isLoading,
    error,
    refetch: fetchNodes,
  }
}

/**
 * Hook to fetch user's node summary from the backend API
 */
export function useUserNodeSummaryApi() {
  const { address, isConnected } = useAccount()
  const [summary, setSummary] = useState<NodeSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    if (!address || !isConnected) {
      setSummary(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await getUserNodeSummary(address)
      
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setSummary(response.data)
      } else {
        setSummary({
          public: 0,
          team: 0,
          auto: 0,
          freeReferral: 0,
          total: 0,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch node summary")
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return {
    summary,
    isLoading,
    error,
    refetch: fetchSummary,
  }
}

/**
 * Hook to fetch recent node purchases from the backend API
 */
export function useRecentNodePurchasesApi(limit = 20) {
  const [purchases, setPurchases] = useState<RecentNodePurchase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPurchases = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getRecentNodePurchases(limit)
      
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setPurchases(response.data.map(transformRecentNodePurchase))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch recent purchases")
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  return {
    purchases,
    isLoading,
    error,
    refetch: fetchPurchases,
  }
}

/**
 * Hook to fetch all node holders from the backend API
 */
export function useNodeHoldersApi() {
  const [holders, setHolders] = useState<NodeHolder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHolders = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getNodeHolders()
      
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setHolders(response.data.map(transformNodeHolder))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch node holders")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHolders()
  }, [fetchHolders])

  return {
    holders,
    isLoading,
    error,
    refetch: fetchHolders,
  }
}

// ============================================================================
// Referral Types
// ============================================================================

export interface ReferralDetail {
  address: string
  totalDonationUSD: number
  nodeCount: number
  joinedAt: Date
}

export interface ReferralStats {
  totalReferrals: number
  directNodeCount: number
  directDonationUSD: number
  referrals: ReferralDetail[]
}

export interface ReferralRecord {
  id: string
  referrerAddress: string
  refereeAddress: string
  txHash: string | null
  blockNumber: number | null
  boundAt: Date
}

// ============================================================================
// Referral Transform Functions
// ============================================================================

function transformReferralDetail(data: ReferralDetailResponse): ReferralDetail {
  return {
    address: data.address,
    totalDonationUSD: parseFloat(data.totalDonationUSD) || 0,
    nodeCount: data.nodeCount,
    joinedAt: new Date(data.joinedAt),
  }
}

function transformReferralStats(data: ReferralStatsResponse): ReferralStats {
  return {
    totalReferrals: data.totalReferrals,
    directNodeCount: data.directNodeCount,
    directDonationUSD: parseFloat(data.directDonationUSD) || 0,
    referrals: data.referrals.map(transformReferralDetail),
  }
}

function transformReferralRecord(data: ReferralRecordResponse): ReferralRecord {
  return {
    id: data.id,
    referrerAddress: data.referrerAddress,
    refereeAddress: data.refereeAddress,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    boundAt: new Date(data.boundAt),
  }
}

// ============================================================================
// Referral Hooks
// ============================================================================

/**
 * Hook to fetch referral statistics from the backend API
 */
export function useReferralStatsApi() {
  const { address, isConnected } = useAccount()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!address || !isConnected) {
      setStats(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await getReferralStats(address)
      
      if (response.error) {
        setError(response.error)
        setStats(null)
      } else if (response.data) {
        setStats(transformReferralStats(response.data))
      } else {
        // No referral stats (user not found)
        setStats({
          totalReferrals: 0,
          directNodeCount: 0,
          directDonationUSD: 0,
          referrals: [],
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch referral stats")
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  }
}

/**
 * Hook to fetch referral records from the backend API
 */
export function useReferralRecordsApi() {
  const { address, isConnected } = useAccount()
  const [records, setRecords] = useState<ReferralRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecords = useCallback(async () => {
    if (!address || !isConnected) {
      setRecords([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await getReferralsByReferrer(address)
      
      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        setRecords(response.data.map(transformReferralRecord))
      } else {
        setRecords([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch referral records")
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return {
    records,
    isLoading,
    error,
    refetch: fetchRecords,
  }
}

/**
 * Hook to fetch user's referrer from the backend API
 */
export function useUserReferrerApi() {
  const { address, isConnected } = useAccount()
  const [referrer, setReferrer] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReferrer = useCallback(async () => {
    if (!address || !isConnected) {
      setReferrer(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await getUserReferrer(address)
      
      if (response.error) {
        setError(response.error)
      } else {
        setReferrer(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch referrer")
    } finally {
      setIsLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    fetchReferrer()
  }, [fetchReferrer])

  return {
    referrer,
    isLoading,
    error,
    refetch: fetchReferrer,
  }
}

// ============================================================================
// Leaderboard Hooks
// ============================================================================

import {
  getLeaderboardPoints,
  getLeaderboardGrowth,
  getLeaderboardDonors,
  getLeaderboardReferrers,
  LeaderboardPointsEntry,
  LeaderboardGrowthEntry,
  LeaderboardDonorsEntry,
  LeaderboardReferrersEntry,
} from "@/lib/api/client"

export interface LeaderboardEntry {
  rank: number
  address: string
  points: number
  nodeCount: number
  donations: number
}

export interface LeaderboardGrowthItem {
  rank: number
  address: string
  growth: number
  points: number
  nodeCount: number
}

function transformLeaderboardPoints(data: LeaderboardPointsEntry[], userAddress?: string): LeaderboardEntry[] {
  return data.map((entry, index) => ({
    rank: index + 1,
    address: entry.address,
    points: parseFloat(entry.points) || 0,
    nodeCount: entry.nodeCount,
    donations: parseFloat(entry.totalDonationUSD) || 0,
  }))
}

function transformLeaderboardGrowth(data: LeaderboardGrowthEntry[]): LeaderboardGrowthItem[] {
  return data.map((entry, index) => ({
    rank: index + 1,
    address: entry.address,
    growth: entry.growthPercentage || 0,
    points: parseFloat(entry.points) || 0,
    nodeCount: 0, // Not provided by growth endpoint
  }))
}

/**
 * Hook to fetch points leaderboard from the backend API
 */
export function useLeaderboardPointsApi(limit = 20) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getLeaderboardPoints(limit)
      
      if (response.error) {
        setError(response.error)
        setEntries([])
      } else if (response.data) {
        setEntries(transformLeaderboardPoints(response.data))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch leaderboard")
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return {
    entries,
    isLoading,
    error,
    refetch: fetchLeaderboard,
  }
}

/**
 * Hook to fetch growth leaderboard from the backend API
 */
export function useLeaderboardGrowthApi(limit = 20) {
  const [entries, setEntries] = useState<LeaderboardGrowthItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getLeaderboardGrowth(limit)
      
      if (response.error) {
        setError(response.error)
        setEntries([])
      } else if (response.data) {
        setEntries(transformLeaderboardGrowth(response.data))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch leaderboard")
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return {
    entries,
    isLoading,
    error,
    refetch: fetchLeaderboard,
  }
}

/**
 * Hook to get user's rank in the leaderboard
 */
export function useUserLeaderboardRank() {
  const { address, isConnected } = useAccount()
  const { entries: pointsEntries, isLoading: isLoadingPoints } = useLeaderboardPointsApi(100)
  const { entries: growthEntries, isLoading: isLoadingGrowth } = useLeaderboardGrowthApi(100)

  const userPointsRank = useMemo(() => {
    if (!address || !isConnected || pointsEntries.length === 0) return 0
    const index = pointsEntries.findIndex(
      (entry) => entry.address.toLowerCase() === address.toLowerCase()
    )
    return index >= 0 ? index + 1 : 0
  }, [address, isConnected, pointsEntries])

  const userGrowthRank = useMemo(() => {
    if (!address || !isConnected || growthEntries.length === 0) return 0
    const index = growthEntries.findIndex(
      (entry) => entry.address.toLowerCase() === address.toLowerCase()
    )
    return index >= 0 ? index + 1 : 0
  }, [address, isConnected, growthEntries])

  const userPoints = useMemo(() => {
    if (!address || !isConnected || pointsEntries.length === 0) return 0
    const entry = pointsEntries.find(
      (entry) => entry.address.toLowerCase() === address.toLowerCase()
    )
    return entry?.points ?? 0
  }, [address, isConnected, pointsEntries])

  const isEligiblePoints = userPointsRank > 0 && userPointsRank <= 20
  const isEligibleGrowth = userGrowthRank > 0 && userGrowthRank <= 20
  const isEligible = isEligiblePoints || isEligibleGrowth

  return {
    userPointsRank,
    userGrowthRank,
    userPoints,
    isEligiblePoints,
    isEligibleGrowth,
    isEligible,
    isLoading: isLoadingPoints || isLoadingGrowth,
  }
}

