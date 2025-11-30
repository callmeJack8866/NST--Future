"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GlowButton } from "@/components/ui/glow-button"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { useWeb3 } from "@/components/providers/web3-provider"
import { mockLeaderboardPoints, mockLeaderboardGrowth, mockUserData } from "@/lib/mock-data"
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
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LeaderboardPage() {
  const { isConnected, address, connect } = useWeb3()
  const [isApplying, setIsApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<"success" | "failed" | null>(null)
  const user = mockUserData

  // Check if user is in top 20
  const userPointsRank = mockLeaderboardPoints.findIndex((entry) => entry.points <= user.points) + 1
  const userGrowthRank =
    mockLeaderboardGrowth.findIndex(
      (entry) => entry.growth <= 150, // User's mock growth
    ) + 1

  const isEligiblePoints = userPointsRank > 0 && userPointsRank <= 20
  const isEligibleGrowth = userGrowthRank > 0 && userGrowthRank <= 20
  const isEligible = isEligiblePoints || isEligibleGrowth

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
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Leaderboard</h1>
              <p className="text-muted-foreground max-w-md mb-8">
                Connect your wallet to view rankings and apply for NST airdrops.
              </p>
              <GlowButton onClick={connect} size="lg">
                <Wallet className="w-5 h-5 mr-2" />
                Connect Wallet
              </GlowButton>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
            <p className="text-muted-foreground">
              Compete for monthly NST airdrops. Rankings update on the 10th and 20th of each month.
            </p>
          </div>

          {/* Your Stats & Airdrop Application */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="glass lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#facc15]" />
                  Your Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/30 text-center hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0s' }}>
                    <p className="text-3xl font-bold gradient-text">{user.points.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 text-center hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.2s' }}>
                    <p className="text-3xl font-bold">
                      {isEligiblePoints ? (
                        <span className="text-primary">#{userPointsRank}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Points Rank</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30 text-center hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.4s' }}>
                    <p className="text-3xl font-bold">
                      {isEligibleGrowth ? (
                        <span className="text-primary">#{userGrowthRank}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Growth Rank</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cn("glass", isEligible && "border-primary/50")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Apply for Airdrop
                </CardTitle>
                <CardDescription>Monthly airdrops for Top 20 rankings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  {isEligible ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-primary">You are eligible!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Not in Top 20</span>
                    </>
                  )}
                </div>

                {applyResult === "success" && (
                  <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Airdrop successfully claimed!
                  </div>
                )}

                {applyResult === "failed" && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Not eligible. Reach Top 20 to qualify.
                  </div>
                )}

                <GlowButton className="w-full" onClick={handleApplyForAirdrop} disabled={isApplying}>
                  {isApplying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Apply for Airdrop
                    </>
                  )}
                </GlowButton>
              </CardContent>
            </Card>
          </div>

          {/* Next Snapshot Info */}
          <Card className="glass mb-8">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Next Ranking Snapshot</p>
                    <p className="text-sm text-muted-foreground">December 10, 2024 at 00:00 UTC</p>
                  </div>
                </div>
                <Badge variant="outline" className="glass">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
                  Live Rankings
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard Tabs */}
          <Tabs defaultValue="points" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 glass">
              <TabsTrigger
                value="points"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Star className="w-4 h-4 mr-2" />
                Highest Points
              </TabsTrigger>
              <TabsTrigger
                value="growth"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Fastest Growth
              </TabsTrigger>
            </TabsList>

            <TabsContent value="points">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#facc15]" />
                    Top 20 by Total Points
                  </CardTitle>
                  <CardDescription>Users with the highest cumulative points</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Nodes</TableHead>
                        <TableHead className="text-right">Donations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockLeaderboardPoints.map((entry, i) => (
                        <TableRow
                          key={entry.address}
                          className={cn(i < 3 && "bg-primary/5", entry.address === user.address && "bg-accent/10")}
                        >
                          <TableCell className="font-medium">{getRankIcon(entry.rank)}</TableCell>
                          <TableCell className="font-mono">{formatAddress(entry.address)}</TableCell>
                          <TableCell>
                            <span className="font-semibold text-primary">{entry.points.toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="glass">
                              {entry.nodeCount} nodes
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">${entry.donations.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="growth">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Top 20 by Fastest Growth
                  </CardTitle>
                  <CardDescription>Users with the highest percentage growth since last snapshot</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Growth</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead className="text-right">Nodes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockLeaderboardGrowth.map((entry, i) => (
                        <TableRow key={entry.address} className={cn(i < 3 && "bg-primary/5")}>
                          <TableCell className="font-medium">{getRankIcon(entry.rank)}</TableCell>
                          <TableCell className="font-mono">{formatAddress(entry.address)}</TableCell>
                          <TableCell>
                            <span className="font-semibold text-primary">+{entry.growth}%</span>
                          </TableCell>
                          <TableCell>{entry.points.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="glass">
                              {entry.nodeCount} nodes
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Airdrop Info */}
          <Card className="glass mt-8">
            <CardHeader>
              <CardTitle>How Airdrops Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Monthly Snapshots</h3>
                  <p className="text-sm text-muted-foreground">
                    Rankings are captured on the 10th and 20th of each month at 00:00 UTC.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Two Categories</h3>
                  <p className="text-sm text-muted-foreground">
                    Top 20 in both Highest Points and Fastest Growth receive NST airdrops.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">Claim Your Reward</h3>
                  <p className="text-sm text-muted-foreground">
                    If eligible, click "Apply for Airdrop" to claim your NST tokens.
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
