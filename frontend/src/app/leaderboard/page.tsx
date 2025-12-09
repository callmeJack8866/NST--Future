"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GlowButton } from "@/components/ui/glow-button"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"
import {
  Trophy,
  TrendingUp,
  Star,
  Medal,
  Crown,
  Wallet,
  Gift,
  Calendar,
  CheckCircle,
  XCircle,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useUserInfoApi,
  useLeaderboardPointsApi,
  useLeaderboardGrowthApi,
  useUserLeaderboardRank,
} from "@/hooks/useApi"

export default function LeaderboardPage() {
  const { address, isConnected } = useAccount()
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<"success" | "failed" | null>(null)

  // API hooks
  const { userInfo, isLoading: isLoadingUser } = useUserInfoApi()
  const { entries: pointsLeaderboard, isLoading: isLoadingPoints, refetch: refetchPoints } = useLeaderboardPointsApi(20)
  const { entries: growthLeaderboard, isLoading: isLoadingGrowth, refetch: refetchGrowth } = useLeaderboardGrowthApi(20)
  const { userPointsRank, userGrowthRank, isEligiblePoints, isEligibleGrowth, isEligible } = useUserLeaderboardRank()

  const isLoading = isLoadingPoints || isLoadingGrowth
  const userPoints = userInfo?.points ?? 0

  // Hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

  const refetchAll = () => {
    refetchPoints()
    refetchGrowth()
  }

  const handleApplyForAirdrop = async () => {
    setIsApplying(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsApplying(false)
    setApplyResult(isEligible ? "success" : "failed")
    setTimeout(() => setApplyResult(null), 5000)
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-[#ffd700]" />
    if (rank === 2) return <Medal className="w-5 h-5 text-[#c0c0c0]" />
    if (rank === 3) return <Medal className="w-5 h-5 text-[#cd7f32]" />
    return <span className="text-muted-foreground">#{rank}</span>
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
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
                <Trophy className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{t("leaderboard.title")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-8">
                {t("leaderboard.connectMessage")}
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
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("leaderboard.title")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t("leaderboard.subtitle")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refetchAll}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Your Stats & Airdrop Application */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="glass lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#facc15]" />
                  {t("leaderboard.yourRankings")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUser ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 sm:p-4 rounded-xl bg-secondary/30 text-center hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0s' }}>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">{Math.round(userPoints).toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{t("leaderboard.totalPoints")}</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-secondary/30 text-center hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.2s' }}>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                        {userPointsRank > 0 ? (
                          <span className={isEligiblePoints ? "text-primary" : "text-muted-foreground"}>#{userPointsRank}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{t("leaderboard.pointsRank")}</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-xl bg-secondary/30 text-center hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.4s' }}>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold">
                        {userGrowthRank > 0 ? (
                          <span className={isEligibleGrowth ? "text-primary" : "text-muted-foreground"}>#{userGrowthRank}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{t("leaderboard.growthRank")}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={cn("glass", isEligible && "border-primary/50")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  {t("leaderboard.applyForAirdrop")}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">{t("leaderboard.monthlyAirdrops")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  {isEligible ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-primary">{t("leaderboard.youAreEligible")}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("leaderboard.notInTop20")}</span>
                    </>
                  )}
                </div>

                {applyResult === "success" && (
                  <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {t("leaderboard.airdropClaimed")}
                  </div>
                )}

                {applyResult === "failed" && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {t("leaderboard.notEligible")}
                  </div>
                )}

                <GlowButton className="w-full" onClick={handleApplyForAirdrop} disabled={isApplying}>
                  {isApplying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      {t("leaderboard.checking")}
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      {t("leaderboard.applyButton")}
                    </>
                  )}
                </GlowButton>
              </CardContent>
            </Card>
          </div>

          {/* Next Snapshot Info */}
          <Card className="glass mb-8">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm sm:text-base font-medium">{t("leaderboard.nextSnapshot")}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("leaderboard.snapshotDate")}</p>
                  </div>
                </div>
                <Badge variant="outline" className="glass">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
                  {t("leaderboard.liveRankings")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Tabs */}
          <Tabs defaultValue="points" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 glass">
              <TabsTrigger
                value="points"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
              >
                <Star className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t("leaderboard.highestPoints")} </span>{t("common.points")}
              </TabsTrigger>
              <TabsTrigger
                value="growth"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
              >
                <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t("leaderboard.fastestGrowth")} </span>{t("common.growth")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="points">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#facc15]" />
                    {t("leaderboard.topByPoints")}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{t("leaderboard.topByPointsDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {isLoadingPoints ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : pointsLeaderboard.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No leaderboard data yet.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 sm:w-16 whitespace-nowrap">{t("leaderboard.rank")}</TableHead>
                          <TableHead className="whitespace-nowrap">{t("leaderboard.address")}</TableHead>
                          <TableHead className="whitespace-nowrap">{t("leaderboard.points")}</TableHead>
                          <TableHead className="whitespace-nowrap">{t("leaderboard.nodes")}</TableHead>
                          <TableHead className="text-right whitespace-nowrap">{t("leaderboard.donations")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pointsLeaderboard.map((entry, i) => (
                          <TableRow
                            key={entry.address}
                            className={cn(
                              i < 3 && "bg-primary/5", 
                              address && entry.address.toLowerCase() === address.toLowerCase() && "bg-accent/10"
                            )}
                          >
                            <TableCell className="font-medium whitespace-nowrap">{getRankIcon(entry.rank)}</TableCell>
                            <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                              {formatAddress(entry.address)}
                              {address && entry.address.toLowerCase() === address.toLowerCase() && (
                                <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="font-semibold text-primary">{Math.round(entry.points).toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline" className="glass whitespace-nowrap">
                                {entry.nodeCount} {t("common.nodes")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">${Math.round(entry.donations).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="growth">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {t("leaderboard.topByGrowth")}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{t("leaderboard.topByGrowthDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {isLoadingGrowth ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : growthLeaderboard.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No growth data yet.</p>
                      <p className="text-xs mt-1">Growth is calculated after the first snapshot.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 sm:w-16 whitespace-nowrap">{t("leaderboard.rank")}</TableHead>
                          <TableHead className="whitespace-nowrap">{t("leaderboard.address")}</TableHead>
                          <TableHead className="whitespace-nowrap">{t("leaderboard.growth")}</TableHead>
                          <TableHead className="whitespace-nowrap">{t("leaderboard.points")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {growthLeaderboard.map((entry, i) => (
                          <TableRow 
                            key={entry.address} 
                            className={cn(
                              i < 3 && "bg-primary/5",
                              address && entry.address.toLowerCase() === address.toLowerCase() && "bg-accent/10"
                            )}
                          >
                            <TableCell className="font-medium whitespace-nowrap">{getRankIcon(entry.rank)}</TableCell>
                            <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                              {formatAddress(entry.address)}
                              {address && entry.address.toLowerCase() === address.toLowerCase() && (
                                <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="font-semibold text-primary">+{entry.growth.toFixed(1)}%</span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{Math.round(entry.points).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Airdrop Info */}
          <Card className="glass mt-8">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t("leaderboard.howAirdropsWork")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold">{t("leaderboard.monthlySnapshots")}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("leaderboard.monthlySnapshotsDesc")}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold">{t("leaderboard.twoCategories")}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("leaderboard.twoCategoriesDesc")}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold">{t("leaderboard.claimYourReward")}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("leaderboard.claimRewardDesc")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
