"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { ProgressRing } from "@/components/ui/progress-ring"
import { GlowButton } from "@/components/ui/glow-button"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { useLanguage } from "@/contexts/language-context"
import { MAX_NODES_PER_USER, AUTO_UPGRADE_THRESHOLD, FREE_NODE_REFERRAL_COUNT } from "@/lib/constants"
import {
  Wallet,
  DollarSign,
  Box,
  Coins,
  Star,
  Users,
  Clock,
  Gift,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
  useUserInfoApi, 
  useUserDonations, 
  useUserNodesApi,
  useReferralStatsApi,
} from "@/hooks/useApi"

// Get explorer URL based on chain
function getExplorerUrl(chainId: number): string {
  if (chainId === 97) return "https://testnet.bscscan.com"
  return "https://bscscan.com"
}

export default function DashboardPage() {
  const { address, isConnected, chainId } = useAccount()
  const { t } = useLanguage()
  const [claimEnabled] = useState(false) // Pre-launch state
  const [mounted, setMounted] = useState(false)

  // API hooks for real data
  const { userInfo, isLoading: isLoadingUser, refetch: refetchUser } = useUserInfoApi()
  const { donations, isLoading: isLoadingDonations, refetch: refetchDonations } = useUserDonations(5)
  const { nodes, isLoading: isLoadingNodes, refetch: refetchNodes } = useUserNodesApi()
  const { stats: referralStats, isLoading: isLoadingReferrals, refetch: refetchReferrals } = useReferralStatsApi()

  const explorerUrl = getExplorerUrl(chainId ?? 97)
  
  // Set mounted after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Derived values from API data
  const totalDonationUSD = userInfo?.totalDonationUSD ?? 0
  const nodeCount = userInfo?.nodeCount ?? 0
  const totalNodes = userInfo?.totalNodes ?? 0
  const points = userInfo?.points ?? 0
  const nstReward = userInfo?.nstReward ?? 0
  const isNodeHolder = userInfo?.isNodeHolder ?? false
  const isDonor = userInfo?.isDonor ?? false
  const hasAutoNode = userInfo?.hasAutoNode ?? false
  const directNodeCount = referralStats?.directNodeCount ?? userInfo?.directNodeCount ?? 0
  const directDonationUSD = referralStats?.directDonationUSD ?? userInfo?.directDonationUSD ?? 0

  const nodeProgress = (totalNodes / MAX_NODES_PER_USER) * 100
  const upgradeProgress = Math.min((totalDonationUSD / AUTO_UPGRADE_THRESHOLD) * 100, 100)
  const hasAutoUpgrade = totalDonationUSD >= AUTO_UPGRADE_THRESHOLD

  const isLoading = isLoadingUser || isLoadingDonations || isLoadingNodes || isLoadingReferrals

  const refetchAll = () => {
    refetchUser()
    refetchDonations()
    refetchNodes()
    refetchReferrals()
  }

  // Loading state during hydration
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
                <Wallet className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{t("common.connectYourWallet")}</h1>
              <p className="text-muted-foreground max-w-md mb-8">
                {t("dashboard.connectMessage")}
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("dashboard.title")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{t("dashboard.subtitle")}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={refetchAll}
                disabled={isLoading}
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
              <Badge variant="outline" className="glass px-4 py-2">
                {isNodeHolder ? (
                  <>
                    <Box className="w-4 h-4 mr-2 text-primary" />
                    {t("common.nodeHolder")}
                  </>
                ) : isDonor ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                    {t("common.donor")}
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {t("common.regularUser")}
                  </>
                )}
              </Badge>
              {hasAutoNode && (
                <Badge variant="outline" className="glass px-4 py-2 bg-green-500/10 text-green-500 border-green-500/20">
                  <Gift className="w-4 h-4 mr-2" />
                  Auto Node
                </Badge>
              )}
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <ScrollReveal delay={0.1}>
              {isLoadingUser ? (
                <Card className="glass p-6">
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                </Card>
              ) : (
                <StatCard
                  title={t("dashboard.totalDonated")}
                  value={Math.round(totalDonationUSD)}
                  prefix="$"
                  icon={DollarSign}
                  iconColor="text-primary"
                />
              )}
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              {isLoadingUser ? (
                <Card className="glass p-6">
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                </Card>
              ) : (
                <StatCard
                  title={t("dashboard.myNodes")}
                  value={totalNodes}
                  suffix={`/${MAX_NODES_PER_USER}`}
                  icon={Box}
                  description={`${MAX_NODES_PER_USER - totalNodes} ${t("common.slotsAvailable")}`}
                  iconColor="text-accent"
                />
              )}
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              {isLoadingUser ? (
                <Card className="glass p-6">
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                </Card>
              ) : (
                <StatCard
                  title={t("dashboard.myPoints")}
                  value={Math.round(points)}
                  icon={Star}
                  description={isNodeHolder ? `2x ${t("common.multiplierActive")}` : undefined}
                  iconColor="text-[#facc15]"
                />
              )}
            </ScrollReveal>
            <ScrollReveal delay={0.4}>
              {isLoadingUser ? (
                <Card className="glass p-6">
                  <div className="flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                </Card>
              ) : (
                <StatCard
                  title={t("dashboard.nstRewards")}
                  value={Math.round(nstReward)}
                  icon={Coins}
                  description={claimEnabled ? t("common.availableToClaim") : t("common.claimComingSoon")}
                  iconColor="text-[#22d3ee]"
                />
              )}
            </ScrollReveal>
          </div>

          {/* Progress Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Node Progress */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-primary" />
                  {t("dashboard.nodeOwnership")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUser ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 sm:gap-8">
                    <div className="shrink-0">
                      <ProgressRing progress={nodeProgress} size={120} animated>
                        <div className="text-center">
                          <p className="text-xl sm:text-2xl md:text-3xl font-bold">{totalNodes}</p>
                          <p className="text-xs text-muted-foreground">of {MAX_NODES_PER_USER}</p>
                        </div>
                      </ProgressRing>
                    </div>
                    <div className="flex-1 space-y-4 min-w-0">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{t("dashboard.nodeSlotsUsed")}</span>
                          <span className="font-medium">
                            {totalNodes}/{MAX_NODES_PER_USER}
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-primary to-accent transition-all duration-500"
                            style={{ width: `${nodeProgress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href="/nodes" className="flex-1">
                          <Button variant="outline" className="w-full glass bg-transparent">
                            <Box className="w-4 h-4 mr-2" />
                            {t("common.buyNodes")}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auto Upgrade Progress */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  {t("dashboard.autoNodeUpgrade")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUser ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 sm:gap-8">
                    <div className="shrink-0">
                      <ProgressRing progress={upgradeProgress} size={120} animated>
                        <div className="text-center px-1">
                          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight">${Math.round(totalDonationUSD).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">of ${AUTO_UPGRADE_THRESHOLD.toLocaleString()}</p>
                        </div>
                      </ProgressRing>
                    </div>
                    <div className="flex-1 space-y-4 min-w-0">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{t("dashboard.progressToFreeNode")}</span>
                          <span className="font-medium">{Math.round(upgradeProgress)}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-primary to-accent transition-all duration-500"
                            style={{ width: `${upgradeProgress}%` }}
                          />
                        </div>
                      </div>
                      {hasAutoNode ? (
                        <div className="flex items-center gap-2 text-green-500 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Auto Node Received!
                        </div>
                      ) : hasAutoUpgrade ? (
                        <div className="flex items-center gap-2 text-primary text-sm">
                          <CheckCircle className="w-4 h-4" />
                          {t("dashboard.eligibleForUpgrade")}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t("dashboard.donateMore")} ${Math.round(AUTO_UPGRADE_THRESHOLD - totalDonationUSD).toLocaleString()} {t("dashboard.moreForFreeNode")}
                        </p>
                      )}
                      <Link href="/donate">
                        <Button variant="outline" className="w-full glass bg-transparent">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {t("dashboard.makeADonation")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* NST Rewards Card */}
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#22d3ee]" />
                {t("dashboard.nstTokenRewards")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingUser ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="min-w-20 h-20 px-3 rounded-2xl bg-linear-to-br from-[#22d3ee]/20 to-primary/20 flex items-center justify-center">
                        <span className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">{Math.round(nstReward).toLocaleString()}</span>
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold">{t("dashboard.nstAvailable")}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {claimEnabled ? t("dashboard.readyToClaim") : t("dashboard.tokenLaunchSoon")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <GlowButton disabled={!claimEnabled || nstReward === 0} glowColor="cyan">
                        <Coins className="w-4 h-4 mr-2" />
                        {claimEnabled ? t("dashboard.claimNST") : t("common.claimComingSoon")}
                      </GlowButton>
                    </div>
                  </div>
                  {!claimEnabled && (
                    <div className="mt-4 p-4 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      {t("dashboard.nstClaimInfo")}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Referral Stats */}
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {t("dashboard.referralOverview")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingReferrals ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 rounded-lg bg-secondary/30">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold">{directNodeCount}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{t("dashboard.nodeReferrals")}</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-secondary/30">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold">${Math.round(directDonationUSD).toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{t("dashboard.referralDonationsLabel")}</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-secondary/30">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold">{Math.floor(directDonationUSD / 1000) * 100}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{t("dashboard.nstFromDonations")}</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-secondary/30">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold">{Math.floor(directNodeCount / FREE_NODE_REFERRAL_COUNT)}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{t("dashboard.freeNodesEarned")}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {FREE_NODE_REFERRAL_COUNT - directNodeCount > 0
                        ? `${FREE_NODE_REFERRAL_COUNT - directNodeCount} ${t("dashboard.moreNodeReferrals")}`
                        : t("dashboard.earnedFreeNode")}
                    </p>
                    <Link href="/referral" className="w-full sm:w-auto">
                      <Button variant="outline" className="glass bg-transparent w-full sm:w-auto whitespace-nowrap">
                        <Users className="w-4 h-4 mr-2" />
                        {t("dashboard.viewReferralDashboard")}
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donation History */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    {t("dashboard.recentDonations")}
                  </span>
                  <Link href="/donate" className="text-sm text-primary hover:underline">
                    {t("common.viewAll")}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {isLoadingDonations ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : donations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No donations yet.</p>
                    <Link href="/donate" className="text-primary hover:underline text-sm">
                      Make your first donation
                    </Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.token")}</TableHead>
                        <TableHead>{t("common.amount")}</TableHead>
                        <TableHead>{t("common.date")}</TableHead>
                        <TableHead className="text-right">TX</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donations.slice(0, 4).map((donation) => (
                        <TableRow key={donation.id}>
                          <TableCell>
                            <Badge variant="outline" className="glass">
                              {donation.tokenSymbol}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">${Math.round(donation.usdValue).toLocaleString()}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(donation.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <a 
                              href={`${explorerUrl}/tx/${donation.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Node History */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-muted-foreground" />
                    {t("dashboard.nodeAcquisitions")}
                  </span>
                  <Link href="/nodes" className="text-sm text-primary hover:underline">
                    {t("common.viewAll")}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {isLoadingNodes ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : nodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No nodes yet.</p>
                    <Link href="/nodes" className="text-primary hover:underline text-sm">
                      Buy your first node
                    </Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.source")}</TableHead>
                        <TableHead>{t("common.nodes")}</TableHead>
                        <TableHead>{t("common.date")}</TableHead>
                        <TableHead className="text-right">TX</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nodes.slice(0, 4).map((node) => (
                        <TableRow key={node.id}>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                node.type === "public" || node.type === "team"
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : node.type === "auto"
                                    ? "bg-[#22d3ee]/10 text-[#22d3ee] border-[#22d3ee]/20"
                                    : "bg-accent/10 text-accent border-accent/20"
                              }
                            >
                              {node.type === "public" || node.type === "team" ? t("common.purchase") : 
                               node.type === "auto" ? t("common.upgrade") :
                               node.type === "free_referral" ? t("common.referral") : node.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {node.count} {t("common.nodes")}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(node.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <a 
                              href={`${explorerUrl}/tx/${node.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
