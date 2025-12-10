"use client"

import { useState, useCallback } from "react"
import { useAccount, useWriteContract, useReadContract, usePublicClient } from "wagmi"
import { parseUnits, formatEther } from "viem"
import { NST_FINANCE_ABI } from "@/lib/contracts/nst-abi"
import { getContracts } from "@/lib/contracts/config"

// Type for address[20] tuple
type Address20Tuple = readonly [
  `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`,
  `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`,
  `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`,
  `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`, `0x${string}`
]

export type AdminActionType = 
  | "createAirdrop"
  | "closeAirdrop"
  | "setTreasury"
  | "setNSTToken"
  | "setClaimEnabled"
  | "addToken"
  | "removeToken"
  | "allocateTeamNodes"
  | "emergencyWithdraw"
  | "batchUpdateSnapshots"
  | null

export interface AdminResult {
  success: boolean
  hash?: string
  error?: string
}

export interface ContractStats {
  currentRound: bigint
  totalUsers: bigint
  totalDonationsUSD: bigint
  totalNodesIssued: bigint
  nodesRemaining: bigint
  totalPointsDistributed: bigint
  publicNodesIssued: bigint
  teamNodesIssued: bigint
  publicNodesRemaining: bigint
  teamNodesRemaining: bigint
  claimEnabled: boolean
  treasury: string
  nstToken: string
  owner: string
}

export function useAdminContract() {
  const { address, chainId } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()
  
  const [processingAction, setProcessingAction] = useState<AdminActionType>(null)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const contracts = getContracts(chainId ?? 97)
  const contractAddress = contracts.NST_FINANCE as `0x${string}`

  // Read contract data
  const { data: owner, refetch: refetchOwner } = useReadContract({
    address: contractAddress,
    abi: NST_FINANCE_ABI,
    functionName: "owner",
  })

  const { data: treasury, refetch: refetchTreasury } = useReadContract({
    address: contractAddress,
    abi: NST_FINANCE_ABI,
    functionName: "treasury",
  })

  const { data: nstToken, refetch: refetchNstToken } = useReadContract({
    address: contractAddress,
    abi: NST_FINANCE_ABI,
    functionName: "nstToken",
  })

  const { data: claimEnabled, refetch: refetchClaimEnabled } = useReadContract({
    address: contractAddress,
    abi: NST_FINANCE_ABI,
    functionName: "claimEnabled",
  })

  const { data: currentRound, refetch: refetchCurrentRound } = useReadContract({
    address: contractAddress,
    abi: NST_FINANCE_ABI,
    functionName: "currentRound",
  })

  const { data: globalStats, refetch: refetchGlobalStats } = useReadContract({
    address: contractAddress,
    abi: NST_FINANCE_ABI,
    functionName: "getGlobalStats",
  })

  const { data: nodeStats, refetch: refetchNodeStats } = useReadContract({
    address: contractAddress,
    abi: NST_FINANCE_ABI,
    functionName: "getNodeStats",
  })

  const isOwner = address && owner && address.toLowerCase() === (owner as string).toLowerCase()

  // Helper: Wait for transaction
  const waitForTx = useCallback(async (hash: `0x${string}`): Promise<boolean> => {
    if (!publicClient) return false
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      })
      return receipt.status === "success"
    } catch {
      return false
    }
  }, [publicClient])

  // Helper: Execute contract write with action tracking
  const executeWrite = useCallback(async (
    actionType: AdminActionType,
    functionName: string,
    args: any[]
  ): Promise<AdminResult> => {
    setProcessingAction(actionType)
    setError(null)
    setTxHash(null)

    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: NST_FINANCE_ABI,
        functionName,
        args,
      } as any)

      setTxHash(hash)
      const success = await waitForTx(hash)

      setProcessingAction(null)

      if (success) {
        return { success: true, hash }
      } else {
        setError("Transaction failed")
        return { success: false, error: "Transaction failed" }
      }
    } catch (err: any) {
      const errorMsg = err?.shortMessage || err?.message || "Transaction failed"
      setProcessingAction(null)
      setError(errorMsg)
      return { success: false, error: errorMsg }
    }
  }, [contractAddress, writeContractAsync, waitForTx])

  // Reset state
  const reset = useCallback(() => {
    setProcessingAction(null)
    setError(null)
    setTxHash(null)
  }, [])

  // Refetch all stats
  const refetchAll = useCallback(() => {
    refetchOwner()
    refetchTreasury()
    refetchNstToken()
    refetchClaimEnabled()
    refetchCurrentRound()
    refetchGlobalStats()
    refetchNodeStats()
  }, [refetchOwner, refetchTreasury, refetchNstToken, refetchClaimEnabled, refetchCurrentRound, refetchGlobalStats, refetchNodeStats])

  // ============ Admin Actions ============

  // Create Airdrop Round
  const createAirdropRound = useCallback(async (
    topGrowthUsers: string[],
    topPointsUsers: string[],
    growthRewardPerUser: string,
    pointsRewardPerUser: string
  ): Promise<AdminResult> => {
    const zeroAddress = "0x0000000000000000000000000000000000000000" as `0x${string}`
    
    // Pad arrays to 20 addresses
    const growthAddresses: `0x${string}`[] = [...topGrowthUsers.map(a => a as `0x${string}`)]
    while (growthAddresses.length < 20) growthAddresses.push(zeroAddress)
    
    const pointsAddresses: `0x${string}`[] = [...topPointsUsers.map(a => a as `0x${string}`)]
    while (pointsAddresses.length < 20) pointsAddresses.push(zeroAddress)

    const growthTuple = growthAddresses.slice(0, 20) as unknown as Address20Tuple
    const pointsTuple = pointsAddresses.slice(0, 20) as unknown as Address20Tuple

    const result = await executeWrite("createAirdrop", "createAirdropRound", [
      growthTuple,
      pointsTuple,
      parseUnits(growthRewardPerUser, 18),
      parseUnits(pointsRewardPerUser, 18),
    ])

    if (result.success) refetchCurrentRound()
    return result
  }, [executeWrite, refetchCurrentRound])

  // Close Airdrop Round
  const closeAirdropRound = useCallback(async (round: number): Promise<AdminResult> => {
    return executeWrite("closeAirdrop", "closeAirdropRound", [BigInt(round)])
  }, [executeWrite])

  // Set Treasury
  const setTreasury = useCallback(async (newTreasury: string): Promise<AdminResult> => {
    const result = await executeWrite("setTreasury", "setTreasury", [newTreasury as `0x${string}`])
    if (result.success) refetchTreasury()
    return result
  }, [executeWrite, refetchTreasury])

  // Set NST Token
  const setNSTToken = useCallback(async (tokenAddress: string): Promise<AdminResult> => {
    const result = await executeWrite("setNSTToken", "setNSTToken", [tokenAddress as `0x${string}`])
    if (result.success) refetchNstToken()
    return result
  }, [executeWrite, refetchNstToken])

  // Toggle Claim Enabled
  const setClaimEnabled = useCallback(async (enabled: boolean): Promise<AdminResult> => {
    const result = await executeWrite("setClaimEnabled", "setClaimEnabled", [enabled])
    if (result.success) refetchClaimEnabled()
    return result
  }, [executeWrite, refetchClaimEnabled])

  // Add Supported Token
  const addSupportedToken = useCallback(async (
    tokenAddress: string, 
    decimals: number
  ): Promise<AdminResult> => {
    return executeWrite("addToken", "addSupportedToken", [tokenAddress as `0x${string}`, decimals])
  }, [executeWrite])

  // Remove Supported Token
  const removeSupportedToken = useCallback(async (tokenAddress: string): Promise<AdminResult> => {
    return executeWrite("removeToken", "removeSupportedToken", [tokenAddress as `0x${string}`])
  }, [executeWrite])

  // Allocate Team Nodes
  const allocateTeamNodes = useCallback(async (
    teamMember: string, 
    nodeCount: number
  ): Promise<AdminResult> => {
    const result = await executeWrite("allocateTeamNodes", "allocateTeamNodes", [
      teamMember as `0x${string}`,
      BigInt(nodeCount),
    ])
    if (result.success) refetchNodeStats()
    return result
  }, [executeWrite, refetchNodeStats])

  // Emergency Withdraw NST
  const emergencyWithdrawNST = useCallback(async (amount: string): Promise<AdminResult> => {
    return executeWrite("emergencyWithdraw", "emergencyWithdrawNST", [parseUnits(amount, 18)])
  }, [executeWrite])

  // Batch Update Snapshots
  const batchUpdateSnapshots = useCallback(async (addresses: string[]): Promise<AdminResult> => {
    const validAddresses = addresses
      .map(a => a.trim().toLowerCase())
      .filter(a => a.startsWith("0x") && a.length === 42) as `0x${string}`[]
    
    if (validAddresses.length === 0) {
      setError("No valid addresses provided")
      return { success: false, error: "No valid addresses provided" }
    }

    return executeWrite("batchUpdateSnapshots", "batchUpdateSnapshots", [validAddresses])
  }, [executeWrite])

  // Build stats object
  const stats: ContractStats | null = globalStats && nodeStats ? {
    currentRound: currentRound ?? BigInt(0),
    totalNodesIssued: globalStats[0],
    totalDonationsUSD: globalStats[1],
    totalUsers: globalStats[2],
    nodesRemaining: globalStats[3],
    totalPointsDistributed: globalStats[4],
    publicNodesIssued: nodeStats[0],
    teamNodesIssued: nodeStats[1],
    publicNodesRemaining: nodeStats[2],
    teamNodesRemaining: nodeStats[3],
    claimEnabled: claimEnabled as boolean ?? false,
    treasury: (treasury as string) ?? "",
    nstToken: (nstToken as string) ?? "",
    owner: (owner as string) ?? "",
  } : null

  // Helper to check if a specific action is processing
  const isActionProcessing = useCallback((action: AdminActionType) => {
    return processingAction === action
  }, [processingAction])

  return {
    // State
    processingAction,
    error,
    txHash,
    isOwner,
    stats,
    
    // Actions
    createAirdropRound,
    closeAirdropRound,
    setTreasury,
    setNSTToken,
    setClaimEnabled,
    addSupportedToken,
    removeSupportedToken,
    allocateTeamNodes,
    emergencyWithdrawNST,
    batchUpdateSnapshots,
    
    // Utilities
    reset,
    refetchAll,
    isActionProcessing,
    
    // Computed
    isProcessing: processingAction !== null,
  }
}
