"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { toast } from "sonner"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlowButton } from "@/components/ui/glow-button"
import { ProgressRing } from "@/components/ui/progress-ring"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { useLanguage } from "@/contexts/language-context"
import { NODE_REFERRAL_REWARD, DONATION_REFERRAL_REWARD, FREE_NODE_REFERRAL_COUNT } from "@/lib/constants"
import { Users, Wallet, Copy, Check, Share2, Gift, Coins, Box, TrendingUp, LinkIcon, Loader2, RefreshCw } from "lucide-react"
import { FaXTwitter } from "react-icons/fa6"
import { FaTelegram, FaDiscord } from "react-icons/fa"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useReferralStatsApi, useUserInfoApi } from "@/hooks/useApi"

export default function ReferralPage() {
  const { address, isConnected } = useAccount()
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Use API hooks for data from backend
  const { stats: referralStats, isLoading: isLoadingStats, refetch: refetchStats } = useReferralStatsApi()
  const { userInfo, isLoading: isLoadingUser, refetch: refetchUser } = useUserInfoApi()

  // Set mounted after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const referralLink = `https://net.finance?ref=${address || "0x..."}`
  
  // Calculate values from API data
  const directNodeCount = referralStats?.directNodeCount ?? userInfo?.directNodeCount ?? 0
  const directDonationUSD = referralStats?.directDonationUSD ?? userInfo?.directDonationUSD ?? 0
  const totalReferrals = referralStats?.totalReferrals ?? 0
  const referrals = referralStats?.referrals ?? []
  
  const progressToFreeNode = (directNodeCount / FREE_NODE_REFERRAL_COUNT) * 100
  const earnedFromDonations = Math.floor(directDonationUSD / 1000) * DONATION_REFERRAL_REWARD
  const earnedFromNodes = directNodeCount * NODE_REFERRAL_REWARD
  const totalEarned = earnedFromDonations + earnedFromNodes

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success("Referral link copied to clipboard!", {
      description: "Share it with your friends to earn rewards!"
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOnTwitter = () => {
    const text = `Join me on NST Finance - the most transparent donation ecosystem in Web3! 🚀\n\nEarn rewards through donations, node ownership, and referrals.\n\n${referralLink}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank")
  }

  const shareOnTelegram = () => {
    const text = `Join me on NST Finance - the most transparent donation ecosystem in Web3! Earn rewards through donations, node ownership, and referrals.`
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`,
      "_blank",
    )
  }

  const shareOnDiscord = () => {
    // Copy link and notify user to paste in Discord
    navigator.clipboard.writeText(
      `Join me on NST Finance - the most transparent donation ecosystem in Web3! 🚀\n\nEarn rewards through donations, node ownership, and referrals.\n\n${referralLink}`
    )
    toast.success("Link copied!", {
      description: "Paste it in your Discord server or DMs."
    })
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Calculate earned NST for a referral
  const calculateEarnedNST = (referral: { nodeCount: number; totalDonationUSD: number }) => {
    const fromNodes = referral.nodeCount * NODE_REFERRAL_REWARD
    const fromDonations = Math.floor(referral.totalDonationUSD / 1000) * DONATION_REFERRAL_REWARD
    return fromNodes + fromDonations
  }

  // Show loading during hydration
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
                <Users className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{t("referral.title")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-8">
                {t("referral.connectMessage")}
              </p>
              <ConnectButton />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const isLoading = isLoadingStats || isLoadingUser

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("referral.title")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("referral.subtitle")}
            </p>
          </div>

          {/* Referral Link Card */}
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                {t("referral.yourReferralLink")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t("referral.shareToEarn")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="glass font-mono text-xs sm:text-sm" />
                <Button variant="outline" className="cursor-pointer glass shrink-0 bg-transparent" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <Button variant="outline" className="cursor-pointer glass bg-transparent text-xs sm:text-sm" onClick={copyLink}>
                  <Copy className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="truncate">{copied ? t("referral.copied") : t("referral.copyLink")}</span>
                </Button>
                <Button variant="outline" className="cursor-pointer glass bg-transparent text-xs sm:text-sm" onClick={shareOnTwitter}>
                  <FaXTwitter className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="truncate">{t("referral.shareOnX")}</span>
                </Button>
                <Button variant="outline" className="cursor-pointer glass bg-transparent text-xs sm:text-sm" onClick={shareOnTelegram}>
                  <FaTelegram className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="truncate">{t("referral.telegram")}</span>
                </Button>
                <Button variant="outline" className="cursor-pointer glass bg-transparent text-xs sm:text-sm" onClick={shareOnDiscord}>
                  <FaDiscord className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="truncate">{t("referral.discord")}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0s' }}>
              <CardContent className="p-4 sm:p-6 text-center">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                ) : (
                  <>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">
                      <AnimatedCounter value={totalReferrals} />
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("referral.totalReferrals")}</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-4 sm:p-6 text-center">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                ) : (
                  <>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                      <AnimatedCounter value={directNodeCount} />
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("referral.nodeHolders")}</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-4 sm:p-6 text-center">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                ) : (
                  <>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                      $<AnimatedCounter value={Math.round(directDonationUSD)} />
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("referral.referralDonations")}</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.6s' }}>
              <CardContent className="p-4 sm:p-6 text-center">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                ) : (
                  <>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#22d3ee]">
                      <AnimatedCounter value={totalEarned} />
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("referral.nstEarned")}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Referrals Table */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      {t("referral.yourReferrals")}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        refetchStats()
                        refetchUser()
                      }}
                      disabled={isLoading}
                    >
                      <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {isLoadingStats ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : referrals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No referrals yet.</p>
                      <p className="text-xs mt-2">Share your referral link to start earning!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">{t("referral.address")}</TableHead>
                          <TableHead className="whitespace-nowrap">{t("referral.donated")}</TableHead>
                          <TableHead className="whitespace-nowrap">{t("referral.nodes")}</TableHead>
                          <TableHead className="whitespace-nowrap">{t("referral.joined")}</TableHead>
                          <TableHead className="text-right whitespace-nowrap">{t("common.nstEarned")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.map((referral) => (
                          <TableRow key={referral.address}>
                            <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">{formatAddress(referral.address)}</TableCell>
                            <TableCell className="whitespace-nowrap">${referral.totalDonationUSD.toLocaleString()}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {referral.nodeCount > 0 ? (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 whitespace-nowrap">
                                  {referral.nodeCount} {t("common.nodes")}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap text-xs sm:text-sm">
                              {new Date(referral.joinedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right font-medium text-primary whitespace-nowrap">
                              +{calculateEarnedNST(referral)} NST
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Reward Breakdown */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-[#22d3ee]" />
                    {t("referral.rewardBreakdown")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Box className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm sm:text-base font-medium">{t("referral.nodeReferralRewards")}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {directNodeCount} {t("referral.nodeHoldersMultiplied")} × {NODE_REFERRAL_REWARD} NST
                            </p>
                          </div>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap">+{earnedFromNodes} NST</p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#22d3ee]/10 shrink-0">
                          <TrendingUp className="w-5 h-5 text-[#22d3ee]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm sm:text-base font-medium">{t("referral.donationReferralRewards")}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              ${directDonationUSD.toLocaleString()} ÷ $1,000 × {DONATION_REFERRAL_REWARD} NST
                            </p>
                          </div>
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-[#22d3ee] whitespace-nowrap">+{earnedFromDonations} NST</p>
                      </div>
                      <div className="border-t border-border pt-4 flex items-center justify-between">
                        <p className="text-sm sm:text-base font-semibold">{t("referral.totalEarned")}</p>
                        <p className="text-xl sm:text-2xl font-bold gradient-text whitespace-nowrap">{totalEarned} NST</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress to Free Node */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Gift className="w-5 h-5 text-primary" />
                    {t("referral.freeNodeProgress")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  ) : (
                    <>
                      <ProgressRing progress={progressToFreeNode} size={140} animated>
                        <div className="text-center">
                          <p className="text-2xl sm:text-3xl font-bold">{directNodeCount}</p>
                          <p className="text-xs text-muted-foreground">of {FREE_NODE_REFERRAL_COUNT}</p>
                        </div>
                      </ProgressRing>
                      <p className="mt-4 text-xs sm:text-sm text-muted-foreground text-center">
                        {FREE_NODE_REFERRAL_COUNT - directNodeCount > 0
                          ? `${FREE_NODE_REFERRAL_COUNT - directNodeCount} ${t("referral.moreForFreeNode")}`
                          : t("referral.earnedFreeNode")}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Reward Rules */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Share2 className="w-5 h-5 text-muted-foreground" />
                    {t("referral.rewardRules")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Box className="w-4 h-4 text-primary" />
                      <p className="font-medium">{t("referral.nodeReferral")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("referral.nodeReferralDesc")}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Coins className="w-4 h-4 text-[#22d3ee]" />
                      <p className="font-medium">{t("referral.donationReferral")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("referral.donationReferralDesc")}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="w-4 h-4 text-accent" />
                      <p className="font-medium">{t("referral.freeNodeMilestone")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("referral.freeNodeMilestoneDesc")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">{t("referral.tipsForSuccess")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{t("referral.tip1")}</p>
                  <p>{t("referral.tip2")}</p>
                  <p>{t("referral.tip3")}</p>
                  <p>{t("referral.tip4")}</p>
                  <p>{t("referral.tip5")}</p>
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
