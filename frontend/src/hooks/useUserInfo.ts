"use client"

import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { formatUnits, Address } from "viem"
import { NST_FINANCE_ABI } from "@/lib/contracts/nst-abi"
import { ERC20_ABI } from "@/lib/contracts/bep20-abi"
import { getContracts } from "@/lib/contracts/config"

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
}

export interface TokenBalance {
  symbol: string
  balance: bigint
  formatted: string
  decimals: number
}

export interface GlobalStats {
  totalNodesIssued: number
  totalDonationsUSD: number
  totalUsers: number
  nodesRemaining: number
  totalPointsDistributed: number
}

export function useUserInfo() {
  const { address, isConnected, chainId } = useAccount()
  const contracts = getContracts(chainId ?? 97)

  // Fetch user info from contract
  const { data: userInfoData, isLoading: isLoadingUserInfo, refetch: refetchUserInfo } = useReadContract({
    address: contracts.NST_FINANCE,
    abi: NST_FINANCE_ABI,
    functionName: "getUserInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  })

  // Fetch if user is registered
  const { data: isUserRegistered } = useReadContract({
    address: contracts.NST_FINANCE,
    abi: NST_FINANCE_ABI,
    functionName: "isUser",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  })

  // Fetch total node count (including team nodes)
  const { data: totalNodeCount } = useReadContract({
    address: contracts.NST_FINANCE,
    abi: NST_FINANCE_ABI,
    functionName: "getTotalNodeCount",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  })

  // Parse user info
  const userInfo: UserInfo | null = userInfoData && address ? {
    address,
    totalDonationUSD: Number(formatUnits(userInfoData[0], 18)),
    nodeCount: Number(userInfoData[1]),
    teamNodeCount: 0, // This is not returned in getUserInfo, would need separate call
    totalNodes: totalNodeCount ? Number(totalNodeCount) : Number(userInfoData[1]),
    referrer: userInfoData[2] === "0x0000000000000000000000000000000000000000" ? null : userInfoData[2],
    directNodeCount: Number(userInfoData[3]),
    directDonationUSD: Number(formatUnits(userInfoData[4], 18)),
    nstReward: Number(formatUnits(userInfoData[5], 18)),
    hasAutoNode: userInfoData[6],
    points: Number(formatUnits(userInfoData[7], 18)),
    lastSnapshotPoints: Number(formatUnits(userInfoData[8], 18)),
    isNodeHolder: Number(userInfoData[1]) > 0 || (totalNodeCount ? Number(totalNodeCount) > 0 : false),
    isDonor: Number(formatUnits(userInfoData[0], 18)) >= 100,
    isRegistered: isUserRegistered ?? false,
  } : null

  return {
    userInfo,
    isLoading: isLoadingUserInfo,
    isConnected,
    refetch: refetchUserInfo,
  }
}

export function useTokenBalances() {
  const { address, isConnected, chainId } = useAccount()
  const contracts = getContracts(chainId ?? 97)

  // Fetch USDT balance
  const { data: usdtBalance, isLoading: isLoadingUSDT, refetch: refetchUSDT } = useReadContract({
    address: contracts.USDT,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  })

  // Fetch USDC balance  
  const { data: usdcBalance, isLoading: isLoadingUSDC, refetch: refetchUSDC } = useReadContract({
    address: contracts.USDC,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  })

  const balances: TokenBalance[] = [
    {
      symbol: "USDT",
      balance: usdtBalance ?? BigInt(0),
      formatted: usdtBalance ? formatUnits(usdtBalance, 18) : "0",
      decimals: 18,
    },
    {
      symbol: "USDC",
      balance: usdcBalance ?? BigInt(0),
      formatted: usdcBalance ? formatUnits(usdcBalance, 18) : "0",
      decimals: 18,
    },
  ]

  const getBalance = (symbol: string): TokenBalance | undefined => {
    return balances.find(b => b.symbol === symbol)
  }

  return {
    balances,
    getBalance,
    isLoading: isLoadingUSDT || isLoadingUSDC,
    refetch: () => {
      refetchUSDT()
      refetchUSDC()
    },
  }
}

export function useGlobalStats() {
  const { chainId } = useAccount()
  const contracts = getContracts(chainId ?? 97)

  // Fetch global stats
  const { data: globalStatsData, isLoading, refetch } = useReadContract({
    address: contracts.NST_FINANCE,
    abi: NST_FINANCE_ABI,
    functionName: "getGlobalStats",
  })

  const globalStats: GlobalStats | null = globalStatsData ? {
    totalNodesIssued: Number(globalStatsData[0]),
    totalDonationsUSD: Number(formatUnits(globalStatsData[1], 18)),
    totalUsers: Number(globalStatsData[2]),
    nodesRemaining: Number(globalStatsData[3]),
    totalPointsDistributed: Number(formatUnits(globalStatsData[4], 18)),
  } : null

  return {
    globalStats,
    isLoading,
    refetch,
  }
}

// Hook to check if user is eligible for auto node
export function useAutoNodeEligibility() {
  const { address, isConnected, chainId } = useAccount()
  const contracts = getContracts(chainId ?? 97)

  const { data: isEligible, isLoading, refetch } = useReadContract({
    address: contracts.NST_FINANCE,
    abi: NST_FINANCE_ABI,
    functionName: "isEligibleForAutoNode",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  })

  return {
    isEligible: isEligible ?? false,
    isLoading,
    refetch,
  }
}

