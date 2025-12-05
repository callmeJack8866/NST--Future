"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GlowButton } from "@/components/ui/glow-button"
import { ProgressRing } from "@/components/ui/progress-ring"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { useLanguage } from "@/contexts/language-context"
import {
  NODE_PRICE,
  MAX_NODES_PER_USER,
  GLOBAL_NODE_SUPPLY,
  SUPPORTED_TOKENS,
  NODE_REFERRAL_REWARD,
  FREE_NODE_REFERRAL_COUNT,
} from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useBuyNode, useNodeStats, NodePurchaseStep } from "@/hooks/useNode"
import { useUserInfo, useTokenBalances, useGlobalStats } from "@/hooks/useUserInfo"
import { getContracts } from "@/lib/contracts/config"
import {
  Box,
  Wallet,
  Minus,
  Plus,
  AlertCircle,
  CheckCircle,
  Coins,
  Users,
  Gift,
  Zap,
  Shield,
  Star,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Get explorer URL based on chain
function getExplorerUrl(chainId: number): string {
  if (chainId === 97) return "https://testnet.bscscan.com"
  return "https://bscscan.com"
}

export default function NodesPage() {
  const { address, isConnected, chainId } = useAccount()
  const { t } = useLanguage()
  
  // Hydration fix: wait for client-side mount before rendering wallet-dependent content
  const [mounted, setMounted] = useState(false)
  
  // Form state
  const [selectedToken, setSelectedToken] = useState("USDT")
  const [nodeCount, setNodeCount] = useState(1)
  
  // Hooks
  const { buyNode, step, error, txHash, isLoading, reset } = useBuyNode()
  const { userInfo, isLoading: isLoadingUser, refetch: refetchUser } = useUserInfo()
  const { balances, getBalance, isLoading: isLoadingBalances, refetch: refetchBalances } = useTokenBalances()
  const { globalStats, isLoading: isLoadingGlobal, refetch: refetchGlobal } = useGlobalStats()
  const { nodeStats, isLoading: isLoadingNodeStats, refetch: refetchNodeStats } = useNodeStats()
  
  const contracts = getContracts(chainId ?? 97)
  const explorerUrl = getExplorerUrl(chainId ?? 97)
  
  // Set mounted after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate derived values from real contract data
  const userNodeCount = userInfo?.nodeCount ?? 0
  const publicNodesRemaining = nodeStats?.publicNodesRemaining ?? GLOBAL_NODE_SUPPLY
  const publicNodesIssued = nodeStats?.publicNodesIssued ?? 0
  
  const maxPurchasable = Math.min(MAX_NODES_PER_USER - userNodeCount, publicNodesRemaining)
  const totalCost = nodeCount * NODE_PRICE
  const globalProgress = (publicNodesIssued / GLOBAL_NODE_SUPPLY) * 100
  const userProgress = (userNodeCount / MAX_NODES_PER_USER) * 100

  // Get selected token balance
  const selectedTokenBalance = getBalance(selectedToken)
  const hasInsufficientBalance = selectedTokenBalance && totalCost > Number(selectedTokenBalance.formatted)

  // Handle purchase
  const handlePurchase = async () => {
    if (nodeCount <= 0 || nodeCount > maxPurchasable || hasInsufficientBalance) return

    const tokenInfo = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken)
    const decimals = tokenInfo?.decimals ?? 18

    const result = await buyNode(selectedToken, nodeCount, decimals)
    
    if (result.success) {
      setNodeCount(1)
      // Refetch all data after successful purchase
      setTimeout(() => {
        refetchUser()
        refetchBalances()
        refetchGlobal()
        refetchNodeStats()
      }, 2000)
    }
  }

  // Reset on disconnect
  useEffect(() => {
    if (!isConnected) {
      reset()
      setNodeCount(1)
    }
  }, [isConnected, reset])

  // Get step message
  const getStepMessage = (step: NodePurchaseStep): string => {
    switch (step) {
      case "checking": return "Checking balance and allowance..."
      case "approving": return "Please approve the token spending..."
      case "purchasing": return "Processing your node purchase..."
      case "success": return "Node purchase successful!"
      case "error": return error || "Transaction failed"
      default: return ""
    }
  }

  // Show loading state during hydration to prevent mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-float">
                <Box className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{t("nodes.title")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-8">
                {t("nodes.connectMessage")}
              </p>
              <ConnectButton />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("nodes.title")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t("nodes.subtitle")}
              </p>
            </div>
          </div>

          {/* Global Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0s' }}>
              <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                {isLoadingNodeStats ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                ) : (
                  <>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold gradient-text">
                      <AnimatedCounter value={publicNodesIssued} />/{GLOBAL_NODE_SUPPLY}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("nodes.nodesSold")}</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                {isLoadingNodeStats ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                ) : (
                  <>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary">
                      <AnimatedCounter value={publicNodesRemaining} />
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("nodes.available")}</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                  $<AnimatedCounter value={NODE_PRICE} />
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t("nodes.pricePerNode")}</p>
              </CardContent>
            </Card>
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.6s' }}>
              <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                {isLoadingUser ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                ) : (
                  <>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-accent">
                      <AnimatedCounter value={userNodeCount} />/{MAX_NODES_PER_USER}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("nodes.yourNodes")}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Purchase Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-primary" />
                    {t("nodes.purchaseNodes")}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{t("nodes.eachNodeCosts")} ${NODE_PRICE.toLocaleString()} USD</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Token Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("nodes.selectPaymentToken")}</label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {SUPPORTED_TOKENS.map((token) => {
                        const tokenBalance = getBalance(token.symbol)
                        return (
                          <button
                            key={token.symbol}
                            onClick={() => setSelectedToken(token.symbol)}
                            className={cn(
                              "flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200",
                              selectedToken === token.symbol
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50 bg-secondary/30",
                            )}
                            disabled={isLoading}
                          >
                            <span className="text-xl sm:text-2xl">{token.icon}</span>
                            <div className="text-left min-w-0 flex-1">
                              <p className="text-sm sm:text-base font-semibold">{token.symbol}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {isLoadingBalances ? (
                                  "Loading..."
                                ) : tokenBalance ? (
                                  `${Number(tokenBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.symbol}`
                                ) : (
                                  "0.00"
                                )}
                              </p>
                            </div>
                            {selectedToken === token.symbol && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Node Count Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("nodes.numberOfNodes")}</label>
                    <div className="flex items-center justify-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl bg-secondary/30">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full glass bg-transparent"
                        onClick={() => setNodeCount(Math.max(1, nodeCount - 1))}
                        disabled={nodeCount <= 1 || isLoading}
                      >
                        <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                      <div className="text-center min-w-[100px] sm:min-w-[120px]">
                        <p className="text-4xl sm:text-5xl font-bold gradient-text">{nodeCount}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{t("nodes.node")}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full glass bg-transparent"
                        onClick={() => setNodeCount(Math.min(maxPurchasable, nodeCount + 1))}
                        disabled={nodeCount >= maxPurchasable || isLoading}
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Button>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground text-center">
                      {t("nodes.maxPurchasable")} {maxPurchasable} {t("nodes.node")}
                    </p>
                  </div>

                  {/* Quick Select */}
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Button
                        key={num}
                        variant="outline"
                        className={cn("glass", nodeCount === num && "border-primary bg-primary/10")}
                        onClick={() => setNodeCount(Math.min(num, maxPurchasable))}
                        disabled={num > maxPurchasable || isLoading}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>

                  {/* Cost Summary */}
                  <div className="p-3 sm:p-4 rounded-xl bg-secondary/30 space-y-2">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-muted-foreground">{t("common.nodes")}</span>
                      <span>
                        {nodeCount} × ${NODE_PRICE.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between items-center">
                      <span className="text-sm sm:text-base font-semibold">{t("nodes.total")}</span>
                      <span className="text-lg sm:text-xl font-bold gradient-text">
                        ${totalCost.toLocaleString()} {selectedToken}
                      </span>
                    </div>
                  </div>

                  {/* Insufficient Balance Warning */}
                  {hasInsufficientBalance && (
                    <Alert className="glass border-destructive/50">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <AlertTitle>Insufficient Balance</AlertTitle>
                      <AlertDescription>
                        You need ${totalCost.toLocaleString()} {selectedToken} but have only{" "}
                        {Number(selectedTokenBalance?.formatted ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedToken}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Max Nodes Reached Warning */}
                  {maxPurchasable === 0 && !hasInsufficientBalance && (
                    <Alert className="glass border-destructive/50">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <AlertTitle>{t("nodes.cannotPurchase")}</AlertTitle>
                      <AlertDescription>
                        {userNodeCount >= MAX_NODES_PER_USER
                          ? t("nodes.maxNodesReached")
                          : t("nodes.allNodesSold")}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Transaction Status */}
                  {step !== "idle" && (
                    <Alert className={cn(
                      "glass",
                      step === "success" && "border-green-500/50 bg-green-500/10",
                      step === "error" && "border-destructive/50 bg-destructive/10"
                    )}>
                      {step === "success" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : step === "error" ? (
                        <AlertCircle className="w-4 h-4 text-destructive" />
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      <AlertTitle>
                        {step === "success" ? "Success!" : step === "error" ? "Error" : "Processing"}
                      </AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p>{getStepMessage(step)}</p>
                        {txHash && (
                          <a 
                            href={`${explorerUrl}/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline text-sm"
                          >
                            View on Explorer <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Purchase Button */}
                  <GlowButton
                    className="w-full h-12 sm:h-14 text-base sm:text-lg"
                    disabled={maxPurchasable === 0 || isLoading || hasInsufficientBalance}
                    onClick={handlePurchase}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        {step === "approving" ? "Approving..." : step === "purchasing" ? "Purchasing..." : t("common.processing")}
                      </>
                    ) : (
                      <>
                        <Box className="w-5 h-5 mr-2" />
                        {t("nodes.purchaseButton")} {nodeCount} {t("nodes.node")}
                      </>
                    )}
                  </GlowButton>

                  {/* Network Info */}
                  <div className="text-center text-xs text-muted-foreground">
                    <p>Network: {chainId === 97 ? "BSC Testnet" : chainId === 56 ? "BSC Mainnet" : `Chain ${chainId}`}</p>
                    <p className="font-mono text-[10px] mt-1 break-all">
                      Contract: {contracts.NST_FINANCE}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Your Stats Card */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    Your Node Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingUser ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <p className="text-2xl font-bold text-primary">{userInfo?.nodeCount ?? 0}</p>
                        <p className="text-sm text-muted-foreground">Regular Nodes</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <p className="text-2xl font-bold text-accent">{userInfo?.totalNodes ?? 0}</p>
                        <p className="text-sm text-muted-foreground">Total Nodes</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <p className="text-2xl font-bold">${userInfo?.totalDonationUSD.toLocaleString() ?? "0"}</p>
                        <p className="text-sm text-muted-foreground">Total Contributed</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <p className="text-2xl font-bold">{userInfo?.points.toLocaleString() ?? "0"}</p>
                        <p className="text-sm text-muted-foreground">Points Earned</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <p className="text-2xl font-bold">{userInfo?.directNodeCount ?? 0}</p>
                        <p className="text-sm text-muted-foreground">Referred Nodes</p>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <p className="text-2xl font-bold">{userInfo?.nstReward.toLocaleString() ?? "0"}</p>
                        <p className="text-sm text-muted-foreground">NST Rewards</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status badges */}
                  {userInfo && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {userInfo.isNodeHolder && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          ✅ Node Holder
                        </Badge>
                      )}
                      {userInfo.hasAutoNode && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          🎁 Auto Node Received
                        </Badge>
                      )}
                      {userInfo.isDonor && (
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                          💝 Donor
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Global Supply */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Zap className="w-5 h-5 text-primary" />
                    {t("nodes.globalSupply")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {isLoadingNodeStats ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  ) : (
                    <>
                      <ProgressRing progress={globalProgress} size={140}>
                        <div className="text-center">
                          <p className="text-2xl sm:text-3xl font-bold">{publicNodesIssued}</p>
                          <p className="text-xs text-muted-foreground">of {GLOBAL_NODE_SUPPLY}</p>
                        </div>
                      </ProgressRing>
                      <p className="mt-4 text-xs sm:text-sm text-muted-foreground text-center">
                        {publicNodesRemaining} {t("nodes.nodesRemaining")}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Node Benefits */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Gift className="w-5 h-5 text-primary" />
                    {t("nodes.nodeBenefits")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Star className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("nodes.doublePoints")}</p>
                      <p className="text-sm text-muted-foreground">{t("nodes.doublePointsDesc")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Coins className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("nodes.nstRewards")}</p>
                      <p className="text-sm text-muted-foreground">{t("nodes.nstRewardsDesc")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("nodes.referralBonus")}</p>
                      <p className="text-sm text-muted-foreground">
                        {NODE_REFERRAL_REWARD} {t("nodes.referralBonusDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("nodes.earlyAccess")}</p>
                      <p className="text-sm text-muted-foreground">{t("nodes.earlyAccessDesc")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ways to Get Nodes */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Box className="w-5 h-5 text-muted-foreground" />
                    {t("nodes.waysToGetNodes")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="font-medium mb-1">{t("nodes.directPurchase")}</p>
                    <p className="text-sm text-muted-foreground">{t("nodes.directPurchaseDesc")} </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="font-medium mb-1">{t("nodes.donationUpgrade")}</p>
                    <p className="text-sm text-muted-foreground">{t("nodes.donationUpgradeDesc")}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="font-medium mb-1">{t("nodes.referralMilestone")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("nodes.referralMilestoneDesc")} {FREE_NODE_REFERRAL_COUNT} {t("nodes.nodeReferrals")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Stats */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Coins className="w-5 h-5 text-muted-foreground" />
                    Platform Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoadingGlobal ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-muted-foreground">Total Users</span>
                        <span className="font-medium">{globalStats?.totalUsers.toLocaleString() ?? "0"}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-muted-foreground">Total Donations</span>
                        <span className="font-medium">${globalStats?.totalDonationsUSD.toLocaleString() ?? "0"}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-muted-foreground">Total Nodes</span>
                        <span className="font-medium">{globalStats?.totalNodesIssued ?? "0"}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-muted-foreground">Points Distributed</span>
                        <span className="font-medium">{globalStats?.totalPointsDistributed.toLocaleString() ?? "0"}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
