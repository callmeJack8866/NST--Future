"use client"

import { useState, useEffect } from "react"
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GlowButton } from "@/components/ui/glow-button"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"
import { NST_FINANCE_ABI } from "@/lib/contracts/nst-abi"
import { getContracts } from "@/lib/contracts/config"
import { formatEther } from "viem"
import {
  Trophy,
  TrendingUp,
  Star,
  Medal,
  Crown,
  Gift,
  Calendar,
  CheckCircle,
  XCircle,
  Sparkles,
  Loader2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  useUserInfoApi,
  useLeaderboardPointsApi,
  useLeaderboardGrowthApi,
  useUserLeaderboardRank,
} from "@/hooks/useApi"

export default function LeaderboardPage() {
  const { address, isConnected, chainId } = useAccount()
  const { t } = useLanguage()
  const publicClient = usePublicClient()
  const [mounted, setMounted] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState<{ success: boolean; message: string; txHash?: string } | null>(null)

  const contracts = getContracts(chainId ?? 97)
  const explorerUrl = chainId === 97 ? "https://testnet.bscscan.com" : "https://bscscan.com"

  // API hooks
  const { userInfo, isLoading: isLoadingUser } = useUserInfoApi()
  const { entries: pointsLeaderboard, isLoading: isLoadingPoints, refetch: refetchPoints } = useLeaderboardPointsApi(20)
  const { entries: growthLeaderboard, isLoading: isLoadingGrowth, refetch: refetchGrowth } = useLeaderboardGrowthApi(20)
  const { userPointsRank, userGrowthRank, isEligiblePoints, isEligibleGrowth, isEligible } = useUserLeaderboardRank()

  // Contract reads
  const { data: currentRound } = useReadContract({
    address: contracts.NST_FINANCE as `0x${string}`,
    abi: NST_FINANCE_ABI,
    functionName: "currentRound",
  })

  const { data: airdropStatus, refetch: refetchAirdropStatus } = useReadContract({
    address: contracts.NST_FINANCE as `0x${string}`,
    abi: NST_FINANCE_ABI,
    functionName: "checkAirdropStatus",
    args: address ? [address, currentRound ?? BigInt(1)] : undefined,
    query: {
      enabled: !!address && !!currentRound,
    },
  })

  // Parse airdrop status
  const isInGrowthTop20 = airdropStatus?.[0] ?? false
  const isInPointsTop20 = airdropStatus?.[1] ?? false
  const hasClaimedGrowth = airdropStatus?.[2] ?? false
  const hasClaimedPoints = airdropStatus?.[3] ?? false
  const growthReward = airdropStatus?.[4] ? Number(formatEther(airdropStatus[4])) : 0
  const pointsReward = airdropStatus?.[5] ? Number(formatEther(airdropStatus[5])) : 0
  const totalClaimable = airdropStatus?.[6] ? Number(formatEther(airdropStatus[6])) : 0

  const canClaim = totalClaimable > 0

  // Contract write
  const { writeContractAsync } = useWriteContract()

  const isLoading = isLoadingPoints || isLoadingGrowth
  const userPoints = userInfo?.points ?? 0

  // Hydration fix
  useEffect(() => {
    setMounted(true)
  }, [])

  const refetchAll = () => {
    refetchPoints()
    refetchGrowth()
    refetchAirdropStatus()
  }

  const handleClaimAirdrop = async () => {
    if (!address || !currentRound || !canClaim || !publicClient) return

    setIsClaiming(true)
    setClaimResult(null)

    try {
      const hash = await writeContractAsync({
        address: contracts.NST_FINANCE as `0x${string}`,
        abi: NST_FINANCE_ABI,
        functionName: "claimAirdrop",
        args: [currentRound],
      })

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      })

      if (receipt.status === "success") {
        setClaimResult({
          success: true,
          message: `Successfully claimed ${totalClaimable.toLocaleString()} NST!`,
          txHash: hash,
        })
        refetchAirdropStatus()
      } else {
        setClaimResult({
          success: false,
          message: "Transaction failed",
        })
      }
    } catch (err: any) {
      console.error("Claim error:", err)
      setClaimResult({
        success: false,
        message: err?.shortMessage || err?.message || "Failed to claim airdrop",
      })
    } finally {
      setIsClaiming(false)
    }
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="glass">
                Round #{currentRound?.toString() ?? "0"}
              </Badge>
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
          </div>

          {/* Claim Result Alert */}
          {claimResult && (
            <Alert className={cn(
              "mb-6",
              claimResult.success ? "border-green-500/50 bg-green-500/10" : "border-destructive/50 bg-destructive/10"
            )}>
              {claimResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive" />
              )}
              <AlertTitle>{claimResult.success ? "Success!" : "Error"}</AlertTitle>
              <AlertDescription>
                {claimResult.message}
                {claimResult.txHash && (
                  <a
                    href={`${explorerUrl}/tx/${claimResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-primary hover:underline"
                  >
                    View TX <ExternalLink className="w-3 h-3 inline" />
                  </a>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Your Stats & Airdrop Claim */}
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

            {/* Airdrop Claim Card */}
            <Card className={cn("glass", canClaim && "border-primary/50")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Claim Airdrop
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Round #{currentRound?.toString() ?? "0"} Rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Eligibility Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Growth Top 20</span>
                    <div className="flex items-center gap-2">
                      {isInGrowthTop20 ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">{growthReward.toLocaleString()} NST</span>
                          {hasClaimedGrowth && <Badge variant="outline" className="text-xs">Claimed</Badge>}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Not eligible</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Points Top 20</span>
                    <div className="flex items-center gap-2">
                      {isInPointsTop20 ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-500">{pointsReward.toLocaleString()} NST</span>
                          {hasClaimedPoints && <Badge variant="outline" className="text-xs">Claimed</Badge>}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Not eligible</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total Claimable */}
                {totalClaimable > 0 && (
                  <div className="p-3 rounded-lg bg-primary/10 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total Claimable</p>
                    <p className="text-2xl font-bold gradient-text">{totalClaimable.toLocaleString()} NST</p>
                  </div>
                )}

                {/* Already Claimed */}
                {(hasClaimedGrowth && hasClaimedPoints) && (isInGrowthTop20 || isInPointsTop20) && (
                  <div className="p-3 rounded-lg bg-green-500/10 text-green-500 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    You've claimed all rewards for this round!
                  </div>
                )}

                {/* Not Eligible */}
                {!isInGrowthTop20 && !isInPointsTop20 && Number(currentRound) > 0 && (
                  <div className="p-3 rounded-lg bg-secondary/30 text-muted-foreground text-sm text-center">
                    You're not in the Top 20 for this round. Keep earning points!
                  </div>
                )}

                {/* No Active Round */}
                {Number(currentRound) === 0 && (
                  <div className="p-3 rounded-lg bg-secondary/30 text-muted-foreground text-sm text-center">
                    No airdrop rounds yet. Stay tuned!
                  </div>
                )}

                {/* Claim Button */}
                <GlowButton 
                  className="w-full" 
                  onClick={handleClaimAirdrop} 
                  disabled={isClaiming || !canClaim}
                >
                  {isClaiming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : canClaim ? (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Claim {totalClaimable.toLocaleString()} NST
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      {(hasClaimedGrowth || hasClaimedPoints) ? "Already Claimed" : "Nothing to Claim"}
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
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 sm:w-16 whitespace-nowrap">{t("leaderboard.rank")}</TableHead>
                          <TableHead className="whitespace-nowrap">{t("leaderboard.address")}</TableHead>
                          <TableHead className="whitespace-nowrap">Growth</TableHead>
                          <TableHead className="whitespace-nowrap">Current</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Previous</TableHead>
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
                              <span className="font-semibold text-green-500">+{entry.growthPercentage?.toFixed(1) ?? 0}%</span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="text-primary">{Math.round(entry.currentPoints ?? entry.points ?? 0).toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                              {Math.round(entry.previousPoints ?? 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info Section */}
          <Card className="glass mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                How Airdrops Work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/30">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Growth Top 20
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Users with the highest % increase in points since the last snapshot.
                    Example: 100 → 1000 = +900% growth.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/30">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-[#facc15]" />
                    Points Top 20
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Users with the highest total cumulative points.
                    Earn points by donating and referring others.
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Airdrops occur twice monthly (10th & 20th). If you're in the Top 20 for either category,
                you can claim your NST rewards after the admin processes the round.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
