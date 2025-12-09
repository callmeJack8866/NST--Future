"use client"

import { useState, useEffect, useCallback } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003"

// ============ Types ============

export interface GrowthRanking {
  address: string
  previousPoints: number
  currentPoints: number
  growthPercentage: number
  rank: number
}

export interface CumulativeRanking {
  address: string
  totalPoints: number
  rank: number
}

export interface PreparedAirdropData {
  round: number
  topGrowthUsers: GrowthRanking[]
  topCumulativeUsers: CumulativeRanking[]
  timestamp: string
}

export interface RankingRound {
  id: string
  round: number
  growthAirdropAmount: string
  cumulativeAirdropAmount: string
  topGrowthUsers: string[]
  topCumulativeUsers: string[]
  isProcessed: boolean
  isActive: boolean
  createdAt: string
}

export interface RankingStats {
  totalRounds: number
  activeRounds: number
  currentRound: number
  lastRoundTimestamp: string | null
}

// ============ Hook: Prepared Airdrop Data ============

export function usePreparedAirdropData() {
  const [data, setData] = useState<PreparedAirdropData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/airdrops/ranking/prepare`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        setError("Failed to fetch prepared data")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  return {
    preparedData: data,
    isLoading,
    error,
    refetch: fetch_,
  }
}

// ============ Hook: Ranking Rounds ============

export function useRankingRounds() {
  const [rounds, setRounds] = useState<RankingRound[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/airdrops/ranking/rounds`)
      if (response.ok) {
        const result = await response.json()
        setRounds(result)
      } else {
        setError("Failed to fetch rounds")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  return {
    rounds,
    isLoading,
    error,
    refetch: fetch_,
  }
}

// ============ Hook: Ranking Stats ============

export function useRankingStats() {
  const [stats, setStats] = useState<RankingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/airdrops/ranking/stats`)
      if (response.ok) {
        const result = await response.json()
        setStats(result)
      } else {
        setError("Failed to fetch stats")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
  }, [fetch_])

  return {
    stats,
    isLoading,
    error,
    refetch: fetch_,
  }
}

// ============ API Actions ============

// NOTE: processRankingRoundApi has been removed
// New flow: Admin calls smart contract createAirdropRound() → Indexer syncs from blockchain event
// No manual API calls needed to create rounds

export async function closeRankingRoundApi(round: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/airdrops/ranking/close/${round}`, {
      method: "POST",
    })
    
    if (response.ok) {
      return { success: true }
    } else {
      return { success: false, error: "Failed to close round" }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to close" }
  }
}

export async function updateAllSnapshotsApi(): Promise<{ success: boolean; usersUpdated?: number; error?: string }> {
  try {
    console.log('Calling API:', `${API_BASE_URL}/airdrops/ranking/update-snapshots`)
    const response = await fetch(`${API_BASE_URL}/airdrops/ranking/update-snapshots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    
    console.log('API Response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('API Response data:', data)
      return { success: true, usersUpdated: data.usersUpdated }
    } else {
      const errorText = await response.text()
      console.error('API Error response:', errorText)
      return { success: false, error: `Failed to update snapshots: ${response.status} ${errorText}` }
    }
  } catch (err) {
    console.error('API Exception:', err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to update" }
  }
}

export async function resetAllSnapshotsApi(): Promise<{ success: boolean; usersUpdated?: number; error?: string }> {
  try {
    console.log('Calling API:', `${API_BASE_URL}/airdrops/ranking/reset-snapshots`)
    const response = await fetch(`${API_BASE_URL}/airdrops/ranking/reset-snapshots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    
    console.log('API Response status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('API Response data:', data)
      return { success: true, usersUpdated: data.usersUpdated }
    } else {
      const errorText = await response.text()
      console.error('API Error response:', errorText)
      return { success: false, error: `Failed to reset snapshots: ${response.status} ${errorText}` }
    }
  } catch (err) {
    console.error('API Exception:', err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to reset" }
  }
}

