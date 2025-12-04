"use client"

import { useState, useCallback } from "react"
import { 
  useAccount, 
  useWriteContract, 
  useReadContract,
  usePublicClient
} from "wagmi"
import { parseUnits, formatUnits, Address, maxUint256 } from "viem"
import { NST_FINANCE_ABI } from "@/lib/contracts/nst-abi"
import { ERC20_ABI } from "@/lib/contracts/bep20-abi"
import { getContracts } from "@/lib/contracts/config"
import { useWeb3Context } from "@/components/providers/web3-provider"
import { NODE_PRICE } from "@/lib/constants"

export interface NodePurchaseResult {
  hash: string
  success: boolean
  error?: string
}

export type NodePurchaseStep = "idle" | "checking" | "approving" | "purchasing" | "success" | "error"

export interface NodeStats {
  publicNodesIssued: number
  teamNodesIssued: number
  publicNodesRemaining: number
  teamNodesRemaining: number
}

export function useBuyNode() {
  const { address, isConnected, chainId } = useAccount()
  const { referrer } = useWeb3Context()
  const publicClient = usePublicClient()
  
  const [step, setStep] = useState<NodePurchaseStep>("idle")
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  
  const contracts = getContracts(chainId ?? 97)
  
  // Write contract hooks
  const { writeContractAsync: approve, isPending: isApproving } = useWriteContract()
  const { writeContractAsync: buyNode, isPending: isPurchasing } = useWriteContract()
  
  // Get token address by symbol
  const getTokenAddress = useCallback((symbol: string): Address => {
    if (symbol === "USDT") return contracts.USDT
    if (symbol === "USDC") return contracts.USDC
    throw new Error(`Unsupported token: ${symbol}`)
  }, [contracts])

  // Check token allowance
  const checkAllowance = useCallback(async (
    tokenSymbol: string, 
    amount: bigint
  ): Promise<boolean> => {
    if (!address || !publicClient) return false
    
    try {
      const tokenAddress = getTokenAddress(tokenSymbol)
      
      const allowance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, contracts.NST_FINANCE],
      })
      
      return allowance >= amount
    } catch (err) {
      console.error("Error checking allowance:", err)
      return false
    }
  }, [address, publicClient, contracts, getTokenAddress])

  // Check token balance
  const checkBalance = useCallback(async (
    tokenSymbol: string
  ): Promise<bigint> => {
    if (!address || !publicClient) return BigInt(0)
    
    try {
      const tokenAddress = getTokenAddress(tokenSymbol)
      
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      })
      
      return balance
    } catch (err) {
      console.error("Error checking balance:", err)
      return BigInt(0)
    }
  }, [address, publicClient, getTokenAddress])

  // Approve token spending
  const approveToken = useCallback(async (
    tokenSymbol: string,
    amount: bigint
  ): Promise<string | null> => {
    if (!address) return null
    
    try {
      const tokenAddress = getTokenAddress(tokenSymbol)
      
      // Approve max amount for convenience
      const hash = await approve({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contracts.NST_FINANCE, maxUint256],
      })
      
      return hash
    } catch (err: any) {
      console.error("Error approving token:", err)
      throw new Error(err?.shortMessage || err?.message || "Failed to approve token")
    }
  }, [address, contracts, approve, getTokenAddress])

  // Wait for transaction
  const waitForTransaction = useCallback(async (hash: string): Promise<boolean> => {
    if (!publicClient) return false
    
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: hash as `0x${string}`,
        confirmations: 1,
      })
      
      return receipt.status === "success"
    } catch (err) {
      console.error("Error waiting for transaction:", err)
      return false
    }
  }, [publicClient])

  // Main buy node function
  const executeBuyNode = useCallback(async (
    tokenSymbol: string,
    nodeCount: number,
    tokenDecimals: number = 18
  ): Promise<NodePurchaseResult> => {
    if (!address || !isConnected) {
      return { hash: "", success: false, error: "Wallet not connected" }
    }

    if (nodeCount <= 0 || nodeCount > 5) {
      return { hash: "", success: false, error: "Invalid node count (1-5)" }
    }

    setStep("checking")
    setError(null)
    setTxHash(null)

    try {
      const tokenAddress = getTokenAddress(tokenSymbol)
      const totalCostUSD = NODE_PRICE * nodeCount
      const amount = parseUnits(totalCostUSD.toString(), tokenDecimals)
      
      // Check balance
      const balance = await checkBalance(tokenSymbol)
      if (balance < amount) {
        const formattedBalance = formatUnits(balance, tokenDecimals)
        throw new Error(`Insufficient ${tokenSymbol} balance. You have ${formattedBalance} ${tokenSymbol}, need ${totalCostUSD}`)
      }

      // Check allowance and approve if needed
      const hasAllowance = await checkAllowance(tokenSymbol, amount)
      
      if (!hasAllowance) {
        setStep("approving")
        const approveHash = await approveToken(tokenSymbol, amount)
        
        if (approveHash) {
          // Wait for approval to be confirmed
          const approveSuccess = await waitForTransaction(approveHash)
          if (!approveSuccess) {
            throw new Error("Token approval failed")
          }
        }
      }

      // Execute node purchase
      setStep("purchasing")
      
      // Get referrer address (zero address if no referrer)
      const referrerAddress = (referrer && referrer.startsWith("0x") && referrer.length === 42)
        ? referrer as Address
        : "0x0000000000000000000000000000000000000000" as Address

      const purchaseHash = await buyNode({
        address: contracts.NST_FINANCE,
        abi: NST_FINANCE_ABI,
        functionName: "buyNode",
        args: [tokenAddress, BigInt(nodeCount), referrerAddress],
      })

      setTxHash(purchaseHash)

      // Wait for purchase to be confirmed
      const purchaseSuccess = await waitForTransaction(purchaseHash)
      
      if (purchaseSuccess) {
        setStep("success")
        return { hash: purchaseHash, success: true }
      } else {
        throw new Error("Node purchase transaction failed")
      }

    } catch (err: any) {
      console.error("Node purchase error:", err)
      const errorMessage = err?.shortMessage || err?.message || "Node purchase failed"
      setError(errorMessage)
      setStep("error")
      return { hash: "", success: false, error: errorMessage }
    }
  }, [
    address,
    isConnected,
    contracts,
    referrer,
    getTokenAddress,
    checkBalance,
    checkAllowance,
    approveToken,
    buyNode,
    waitForTransaction
  ])

  // Reset state
  const reset = useCallback(() => {
    setStep("idle")
    setError(null)
    setTxHash(null)
  }, [])

  return {
    buyNode: executeBuyNode,
    step,
    error,
    txHash,
    isLoading: step === "checking" || step === "approving" || step === "purchasing",
    isApproving: step === "approving",
    isPurchasing: step === "purchasing",
    isSuccess: step === "success",
    isError: step === "error",
    reset,
    checkBalance,
    checkAllowance,
  }
}

// Hook to get node statistics from contract
export function useNodeStats() {
  const { chainId } = useAccount()
  const contracts = getContracts(chainId ?? 97)

  // Fetch node stats
  const { data: nodeStatsData, isLoading, refetch } = useReadContract({
    address: contracts.NST_FINANCE,
    abi: NST_FINANCE_ABI,
    functionName: "getNodeStats",
  })

  const nodeStats: NodeStats | null = nodeStatsData ? {
    publicNodesIssued: Number(nodeStatsData[0]),
    teamNodesIssued: Number(nodeStatsData[1]),
    publicNodesRemaining: Number(nodeStatsData[2]),
    teamNodesRemaining: Number(nodeStatsData[3]),
  } : null

  return {
    nodeStats,
    isLoading,
    refetch,
  }
}

