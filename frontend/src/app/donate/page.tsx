"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlowButton } from "@/components/ui/glow-button"
import { useLanguage } from "@/contexts/language-context"
import { MIN_DONATION, SUPPORTED_TOKENS, AUTO_UPGRADE_THRESHOLD } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useDonate, DonationStep } from "@/hooks/useDonate"
import { useUserInfo, useTokenBalances, useAutoNodeEligibility } from "@/hooks/useUserInfo"
import { getContracts } from "@/lib/contracts/config"
import {
  Heart,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Info,
  Gift,
  Star,
  TrendingUp,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Get explorer URL based on chain
function getExplorerUrl(chainId: number): string {
  if (chainId === 97) return "https://testnet.bscscan.com"
  return "https://bscscan.com"
}

export default function DonatePage() {
  const { address, isConnected, chainId } = useAccount()
  const { t } = useLanguage()
  
  // Hydration fix - wait for client mount before rendering wallet-dependent UI
  const [mounted, setMounted] = useState(false)
  
  // Form state
  const [selectedToken, setSelectedToken] = useState("USDT")
  const [amount, setAmount] = useState("")
  
  // Hooks
  const { donate, step, error, txHash, isLoading, reset } = useDonate()
  const { userInfo, isLoading: isLoadingUser, refetch: refetchUser } = useUserInfo()
  const { balances, getBalance, isLoading: isLoadingBalances, refetch: refetchBalances } = useTokenBalances()
  const { isEligible: isEligibleForAutoNode } = useAutoNodeEligibility()
  
  const contracts = getContracts(chainId ?? 97)
  const explorerUrl = getExplorerUrl(chainId ?? 97)

  const numAmount = Number.parseFloat(amount) || 0
  const isValidAmount = numAmount >= MIN_DONATION
  
  // Calculate points to earn (based on user's node holder status)
  const isNodeHolder = userInfo?.isNodeHolder ?? false
  const pointsToEarn = Math.floor(numAmount) * (isNodeHolder ? 2 : 1)
  
  // Progress to auto upgrade
  const totalDonated = userInfo?.totalDonationUSD ?? 0
  const progressToUpgrade = Math.min(((totalDonated + numAmount) / AUTO_UPGRADE_THRESHOLD) * 100, 100)

  // Get selected token balance
  const selectedTokenBalance = getBalance(selectedToken)
  const hasInsufficientBalance = selectedTokenBalance && numAmount > Number(selectedTokenBalance.formatted)

  const quickAmounts = [100, 250, 500, 1000, 2000, 5000]

  // Handle donation
  const handleDonate = async () => {
    if (!isValidAmount || hasInsufficientBalance) return

    const tokenInfo = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken)
    const decimals = tokenInfo?.decimals ?? 18

    const result = await donate(selectedToken, numAmount, decimals)
    
    if (result.success) {
      setAmount("")
      // Refetch user data after successful donation
      setTimeout(() => {
        refetchUser()
        refetchBalances()
      }, 2000)
    }
  }

  // Set mounted to true on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset on disconnect
  useEffect(() => {
    if (!isConnected) {
      reset()
      setAmount("")
    }
  }, [isConnected, reset])

  // Get step message
  const getStepMessage = (step: DonationStep): string => {
    switch (step) {
      case "checking": return "Checking balance and allowance..."
      case "approving": return "Please approve the token spending..."
      case "donating": return "Processing your donation..."
      case "success": return "Donation successful!"
      case "error": return error || "Transaction failed"
      default: return ""
    }
  }

  if (!mounted || !isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-float">
                <Heart className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{t("donate.makeADonation")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-8">
                {t("donate.connectMessage")}
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
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("donate.title")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t("donate.subtitle")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Donation Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    {t("donate.makeADonation")}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{t("donate.minimumDonation")} ${MIN_DONATION} USD</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Token Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm">{t("donate.selectToken")}</Label>
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

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm">{t("donate.donationAmount")}</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        placeholder={t("donate.enterAmount")}
                        value={amount}
                        onChange={(e) => {
                          const value = e.target.value
                          // Only allow non-negative numbers
                          if (value === "" || Number(value) >= 0) {
                            setAmount(value)
                          }
                        }}
                        className="pl-9 sm:pl-10 text-base sm:text-lg h-12 sm:h-14 glass"
                        disabled={isLoading}
                      />
                    </div>
                    {amount && !isValidAmount && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {t("donate.minimumError")} ${MIN_DONATION}
                      </p>
                    )}
                    {amount && isValidAmount && hasInsufficientBalance && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Insufficient {selectedToken} balance
                      </p>
                    )}
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="space-y-2">
                    <Label className="text-sm">{t("donate.quickSelect")}</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {quickAmounts.map((amt) => (
                        <Button
                          key={amt}
                          variant="outline"
                          className={cn("glass text-xs sm:text-sm px-2 sm:px-4", Number.parseFloat(amount) === amt && "border-primary bg-primary/10")}
                          onClick={() => setAmount(amt.toString())}
                          disabled={isLoading}
                        >
                          ${amt >= 1000 ? `${amt / 1000}k` : amt}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Points Preview */}
                  {numAmount >= MIN_DONATION && (
                    <Alert className="glass border-primary/50">
                      <Star className="w-4 h-4 text-primary" />
                      <AlertTitle>{t("donate.pointsPreview")}</AlertTitle>
                      <AlertDescription>
                        {t("donate.youWillEarn")}{" "}
                        <span className="font-bold text-primary">{pointsToEarn.toLocaleString()} {t("common.points")}</span>
                        {isNodeHolder && <span className="text-primary"> {t("donate.nodeHolderBonus")}</span>}
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

                  {/* Donate Button */}
                  <GlowButton
                    className="w-full h-12 sm:h-14 text-base sm:text-lg"
                    disabled={!isValidAmount || isLoading || hasInsufficientBalance}
                    onClick={handleDonate}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        {step === "approving" ? "Approving..." : step === "donating" ? "Donating..." : t("common.processing")}
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        {t("donate.donateButton")} ${numAmount.toLocaleString() || "0"}
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

              {/* Recent Activity placeholder - In production, this would fetch from blockchain events */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    {t("donate.yourDonationHistory")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Donation history will be loaded from blockchain events.</p>
                    <p className="text-xs mt-2">Your total donations: ${userInfo?.totalDonationUSD.toLocaleString() ?? "0"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress to Auto Upgrade */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Gift className="w-5 h-5 text-primary" />
                    {t("donate.autoNodeUpgrade")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    {isLoadingUser ? (
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    ) : (
                      <>
                        <p className="text-2xl sm:text-3xl font-bold gradient-text">${totalDonated.toLocaleString()}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{t("donate.ofGoal")} ${AUTO_UPGRADE_THRESHOLD.toLocaleString()} {t("donate.goal")}</p>
                      </>
                    )}
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${(totalDonated / AUTO_UPGRADE_THRESHOLD) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {userInfo?.hasAutoNode
                      ? "✅ You already received your auto node!"
                      : isEligibleForAutoNode
                      ? "🎉 You're eligible for a free node!"
                      : totalDonated >= AUTO_UPGRADE_THRESHOLD
                      ? t("donate.eligibleForNode")
                      : `$${(AUTO_UPGRADE_THRESHOLD - totalDonated).toLocaleString()} ${t("donate.moreForNode")}`}
                  </p>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Info className="w-5 h-5 text-muted-foreground" />
                    {t("donate.donationBenefits")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Star className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("donate.earnPoints")}</p>
                      <p className="text-sm text-muted-foreground">{t("donate.pointsPerDonation")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("donate.nodeBonus")}</p>
                      <p className="text-sm text-muted-foreground">{t("donate.nodeBonusDesc")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Gift className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{t("donate.freeNode")}</p>
                      <p className="text-sm text-muted-foreground">{t("donate.freeNodeDesc")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Your Stats */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    {t("donate.yourStats")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoadingUser ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-muted-foreground">{t("donate.totalDonated")}</span>
                        <span className="font-medium">${userInfo?.totalDonationUSD.toLocaleString() ?? "0"}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-muted-foreground">{t("donate.totalPoints")}</span>
                        <span className="font-medium">{userInfo?.points.toLocaleString() ?? "0"}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-muted-foreground">Nodes Owned</span>
                        <span className="font-medium">{userInfo?.totalNodes ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-muted-foreground">NST Rewards</span>
                        <span className="font-medium">{userInfo?.nstReward.toLocaleString() ?? "0"} NST</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("donate.status")}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            userInfo?.isNodeHolder 
                              ? "text-primary border-primary" 
                              : userInfo?.isDonor 
                              ? "text-green-500 border-green-500" 
                              : "text-muted-foreground"
                          )}
                        >
                          {userInfo?.isNodeHolder ? t("common.nodeHolder") : userInfo?.isDonor ? t("common.donor") : t("donate.regular")}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("donate.multiplier")}</span>
                        <span className="font-medium text-primary">{userInfo?.isNodeHolder ? "2x" : "1x"}</span>
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
