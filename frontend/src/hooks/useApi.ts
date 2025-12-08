"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount } from "wagmi"
import {
  getUserDashboard,
  getUserDonations,
  getUserReferrals,
  getGlobalStats,
  getNodeStats,
  getRecentDonations,
  type UserDashboardResponse,
  type DonationResponse,
  type ReferralResponse,
  type GlobalStatsResponse,
  type NodeStatsResponse,
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

