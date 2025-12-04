"use client"

import { useState, useCallback } from "react"
import { 
  useAccount, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useReadContract,
  usePublicClient
} from "wagmi"
import { parseUnits, formatUnits, Address, maxUint256 } from "viem"
import { NST_FINANCE_ABI } from "@/lib/contracts/nst-abi"
import { ERC20_ABI } from "@/lib/contracts/bep20-abi"
import { getContracts } from "@/lib/contracts/config"
import { useWeb3Context } from "@/components/providers/web3-provider"

export interface DonationResult {
  hash: string
  success: boolean
  error?: string
}

export type DonationStep = "idle" | "checking" | "approving" | "donating" | "success" | "error"

export function useDonate() {
  const { address, isConnected, chainId } = useAccount()
  const { referrer } = useWeb3Context()
  const publicClient = usePublicClient()
  
  const [step, setStep] = useState<DonationStep>("idle")
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  
  const contracts = getContracts(chainId ?? 97)
  
  // Write contract hooks
  const { writeContractAsync: approve, isPending: isApproving } = useWriteContract()
  const { writeContractAsync: donate, isPending: isDonating } = useWriteContract()
  
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

  // Main donate function
  const executeDonate = useCallback(async (
    tokenSymbol: string,
    amountUSD: number,
    tokenDecimals: number = 18
  ): Promise<DonationResult> => {
    if (!address || !isConnected) {
      return { hash: "", success: false, error: "Wallet not connected" }
    }

    setStep("checking")
    setError(null)
    setTxHash(null)

    try {
      const tokenAddress = getTokenAddress(tokenSymbol)
      const amount = parseUnits(amountUSD.toString(), tokenDecimals)
      
      // Check balance
      const balance = await checkBalance(tokenSymbol)
      if (balance < amount) {
        const formattedBalance = formatUnits(balance, tokenDecimals)
        throw new Error(`Insufficient ${tokenSymbol} balance. You have ${formattedBalance} ${tokenSymbol}`)
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

      // Execute donation
      setStep("donating")
      
      // Get referrer address (zero address if no referrer)
      const referrerAddress = (referrer && referrer.startsWith("0x") && referrer.length === 42)
        ? referrer as Address
        : "0x0000000000000000000000000000000000000000" as Address

      const donateHash = await donate({
        address: contracts.NST_FINANCE,
        abi: NST_FINANCE_ABI,
        functionName: "donate",
        args: [tokenAddress, amount, referrerAddress],
      })

      setTxHash(donateHash)

      // Wait for donation to be confirmed
      const donateSuccess = await waitForTransaction(donateHash)
      
      if (donateSuccess) {
        setStep("success")
        return { hash: donateHash, success: true }
      } else {
        throw new Error("Donation transaction failed")
      }

    } catch (err: any) {
      console.error("Donation error:", err)
      const errorMessage = err?.shortMessage || err?.message || "Donation failed"
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
    donate,
    waitForTransaction
  ])

  // Reset state
  const reset = useCallback(() => {
    setStep("idle")
    setError(null)
    setTxHash(null)
  }, [])

  return {
    donate: executeDonate,
    step,
    error,
    txHash,
    isLoading: step === "checking" || step === "approving" || step === "donating",
    isApproving: step === "approving",
    isDonating: step === "donating",
    isSuccess: step === "success",
    isError: step === "error",
    reset,
    checkBalance,
    checkAllowance,
  }
}

