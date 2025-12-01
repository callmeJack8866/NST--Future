"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { ProgressRing } from "@/components/ui/progress-ring"
import { GlowButton } from "@/components/ui/glow-button"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { useWeb3 } from "@/components/providers/web3-provider"
import { mockUserData, mockDonationHistory, mockNodePurchases } from "@/lib/mock-data"
import { MAX_NODES_PER_USER, AUTO_UPGRADE_THRESHOLD } from "@/lib/constants"
import {
  Wallet,
  DollarSign,
  Box,
  Coins,
  Star,
  Users,
  Clock,
  ArrowUpRight,
  Gift,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function DashboardPage() {
  const { isConnected, address, connect } = useWeb3()
  const [claimEnabled] = useState(false) // Pre-launch state
  const user = mockUserData

  const nodeProgress = (user.nodeCount / MAX_NODES_PER_USER) * 100
  const upgradeProgress = Math.min((user.totalDonationUSD / AUTO_UPGRADE_THRESHOLD) * 100, 100)
  const hasAutoUpgrade = user.totalDonationUSD >= AUTO_UPGRADE_THRESHOLD

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
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Connect Your Wallet</h1>
              <p className="text-muted-foreground max-w-md mb-8">
                Connect your Web3 wallet to access your dashboard and start earning rewards.
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Welcome back! Here's your NST Finance overview.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="glass px-4 py-2">
                {user.isNodeHolder ? (
                  <>
                    <Box className="w-4 h-4 mr-2 text-primary" />
                    Node Holder
                  </>
                ) : user.isDonor ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                    Donor
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Regular User
                  </>
                )}
              </Badge>
              <Badge variant="outline" className="glass px-4 py-2 font-mono">
                Rank #{user.rank}
              </Badge>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <ScrollReveal delay={0.1}>
              <StatCard
                title="Total Donated"
                value={user.totalDonationUSD}
                prefix="$"
                icon={DollarSign}
                trend={12.5}
                iconColor="text-primary"
              />
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <StatCard
                title="My Nodes"
                value={user.nodeCount}
                suffix={`/${MAX_NODES_PER_USER}`}
                icon={Box}
                description={`${MAX_NODES_PER_USER - user.nodeCount} slots available`}
                iconColor="text-accent"
              />
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <StatCard
                title="My Points"
                value={user.points}
                icon={Star}
                trend={8.2}
                description={user.isNodeHolder ? "2x multiplier active" : undefined}
                iconColor="text-[#facc15]"
              />
            </ScrollReveal>
            <ScrollReveal delay={0.4}>
              <StatCard
                title="NST Rewards"
                value={user.nstReward}
                icon={Coins}
                description={claimEnabled ? "Available to claim" : "Claim coming soon"}
                iconColor="text-[#22d3ee]"
              />
            </ScrollReveal>
          </div>

          {/* Progress Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Node Progress */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-primary" />
                  Node Ownership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 sm:gap-8">
                  <div className="flex-shrink-0">
                    <ProgressRing progress={nodeProgress} size={120} animated>
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold">{user.nodeCount}</p>
                        <p className="text-xs text-muted-foreground">of {MAX_NODES_PER_USER}</p>
                      </div>
                    </ProgressRing>
                  </div>
                  <div className="flex-1 space-y-4 min-w-0">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Node Slots Used</span>
                        <span className="font-medium">
                          {user.nodeCount}/{MAX_NODES_PER_USER}
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
                          Buy Nodes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auto Upgrade Progress */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Auto Node Upgrade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 sm:gap-8">
                  <div className="flex-shrink-0">
                    <ProgressRing progress={upgradeProgress} size={120} animated>
                      <div className="text-center px-1">
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight">${user.totalDonationUSD.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">of ${AUTO_UPGRADE_THRESHOLD.toLocaleString()}</p>
                      </div>
                    </ProgressRing>
                  </div>
                  <div className="flex-1 space-y-4 min-w-0">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress to Free Node</span>
                        <span className="font-medium">{Math.round(upgradeProgress)}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-primary to-accent transition-all duration-500"
                          style={{ width: `${upgradeProgress}%` }}
                        />
                      </div>
                    </div>
                    {hasAutoUpgrade ? (
                      <div className="flex items-center gap-2 text-primary text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Eligible for auto upgrade!
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Donate ${(AUTO_UPGRADE_THRESHOLD - user.totalDonationUSD).toLocaleString()} more to get a free
                        node
                      </p>
                    )}
                    <Link href="/donate">
                      <Button variant="outline" className="w-full glass bg-transparent">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Make a Donation
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* NST Rewards Card */}
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#22d3ee]" />
                NST Token Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="min-w-20 h-20 px-3 rounded-2xl bg-linear-to-br from-[#22d3ee]/20 to-primary/20 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">{user.nstReward.toLocaleString()}</span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold">NST Available</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {claimEnabled ? "Ready to claim to your wallet" : "Token launch coming soon"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <GlowButton disabled={!claimEnabled || user.nstReward === 0} glowColor="cyan">
                    <Coins className="w-4 h-4 mr-2" />
                    {claimEnabled ? "Claim NST" : "Claim Coming Soon"}
                  </GlowButton>
                </div>
              </div>
              {!claimEnabled && (
                <div className="mt-4 p-4 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  NST token claiming will be enabled after the official token launch. Your rewards are securely stored
                  on-chain.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referral Stats */}
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Referral Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-secondary/30">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold">{user.directNodeCount}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Node Referrals</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-secondary/30">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold">${user.directDonationUSD.toLocaleString()}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Referral Donations</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-secondary/30">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold">{Math.floor(user.directDonationUSD / 1000) * 100}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">NST from Donations</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-secondary/30">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold">{user.directNodeCount >= 10 ? "1" : "0"}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Free Nodes Earned</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {10 - user.directNodeCount > 0
                    ? `${10 - user.directNodeCount} more node referrals for a free node`
                    : "You earned a free node from referrals!"}
                </p>
                <Link href="/referral" className="w-full sm:w-auto">
                  <Button variant="outline" className="glass bg-transparent w-full sm:w-auto whitespace-nowrap">
                    <Users className="w-4 h-4 mr-2" />
                    View Referral Dashboard
                  </Button>
                </Link>
              </div>
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
                    Recent Donations
                  </span>
                  <Link href="/donate" className="text-sm text-primary hover:underline">
                    View All
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">TX</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDonationHistory.slice(0, 4).map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell>
                          <Badge variant="outline" className="glass">
                            {donation.token}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">${donation.usdValue.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {donation.timestamp.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Node History */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-muted-foreground" />
                    Node Acquisitions
                  </span>
                  <Link href="/nodes" className="text-sm text-primary hover:underline">
                    View All
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Nodes</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">TX</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockNodePurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              purchase.source === "purchase"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : purchase.source === "upgrade"
                                  ? "bg-[#22d3ee]/10 text-[#22d3ee] border-[#22d3ee]/20"
                                  : "bg-accent/10 text-accent border-accent/20"
                            }
                          >
                            {purchase.source.charAt(0).toUpperCase() + purchase.source.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {purchase.count} Node{purchase.count > 1 ? "s" : ""}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {purchase.timestamp.toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
