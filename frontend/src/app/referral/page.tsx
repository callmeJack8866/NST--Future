"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlowButton } from "@/components/ui/glow-button"
import { ProgressRing } from "@/components/ui/progress-ring"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { useWeb3 } from "@/components/providers/web3-provider"
import { mockUserData, mockReferrals } from "@/lib/mock-data"
import { NODE_REFERRAL_REWARD, DONATION_REFERRAL_REWARD, FREE_NODE_REFERRAL_COUNT } from "@/lib/constants"
import { Users, Wallet, Copy, Check, Share2, Gift, Coins, Box, TrendingUp, LinkIcon, Twitter, Send, MessageCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function ReferralPage() {
  const { isConnected, address, connect } = useWeb3()
  const [copied, setCopied] = useState(false)
  const user = mockUserData

  const referralLink = `https://nst.finance?ref=${address || "0x..."}`
  const progressToFreeNode = (user.directNodeCount / FREE_NODE_REFERRAL_COUNT) * 100
  const earnedFromDonations = Math.floor(user.directDonationUSD / 1000) * DONATION_REFERRAL_REWARD
  const earnedFromNodes = user.directNodeCount * NODE_REFERRAL_REWARD
  const totalEarned = earnedFromDonations + earnedFromNodes

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
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
    alert("Link copied! Paste it in your Discord server or DMs.")
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
                <Users className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Referral Program</h1>
              <p className="text-muted-foreground max-w-md mb-8">
                Connect your wallet to get your unique referral link and start earning rewards.
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
            <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
            <p className="text-muted-foreground">
              Invite friends and earn NST rewards for every node holder and donation.
            </p>
          </div>

          {/* Referral Link Card */}
          <Card className="glass mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                Your Referral Link
              </CardTitle>
              <CardDescription>Share this link to earn rewards when your referrals donate or buy nodes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="glass font-mono text-sm" />
                <Button variant="outline" className="glass shrink-0 bg-transparent" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="glass bg-transparent" onClick={copyLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button variant="outline" className="glass bg-transparent" onClick={shareOnTwitter}>
                  <Twitter className="w-4 h-4 mr-2" />
                  Share on X
                </Button>
                <Button variant="outline" className="glass bg-transparent" onClick={shareOnTelegram}>
                  <Send className="w-4 h-4 mr-2" />
                  Share on Telegram
                </Button>
                <Button variant="outline" className="glass bg-transparent" onClick={shareOnDiscord}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Share on Discord
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0s' }}>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold gradient-text">
                  <AnimatedCounter value={mockReferrals.length} />
                </p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </CardContent>
            </Card>
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-primary">
                  <AnimatedCounter value={user.directNodeCount} />
                </p>
                <p className="text-sm text-muted-foreground">Node Holders</p>
              </CardContent>
            </Card>
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold">
                  $<AnimatedCounter value={user.directDonationUSD} />
                </p>
                <p className="text-sm text-muted-foreground">Referral Donations</p>
              </CardContent>
            </Card>
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.6s' }}>
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-[#22d3ee]">
                  <AnimatedCounter value={totalEarned} />
                </p>
                <p className="text-sm text-muted-foreground">NST Earned</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Referrals Table */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    Your Referrals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Address</TableHead>
                        <TableHead>Donated</TableHead>
                        <TableHead>Nodes</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">NST Earned</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockReferrals.map((referral, i) => (
                        <TableRow key={referral.address}>
                          <TableCell className="font-mono">{formatAddress(referral.address)}</TableCell>
                          <TableCell>${referral.totalDonationUSD.toLocaleString()}</TableCell>
                          <TableCell>
                            {referral.nodeCount > 0 ? (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                {referral.nodeCount} node{referral.nodeCount > 1 ? "s" : ""}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {referral.joinedAt.toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right font-medium text-primary">
                            +{referral.earnedNST} NST
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Reward Breakdown */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-[#22d3ee]" />
                    Reward Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Box className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Node Referral Rewards</p>
                          <p className="text-sm text-muted-foreground">
                            {user.directNodeCount} node holders × {NODE_REFERRAL_REWARD} NST
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-primary">+{earnedFromNodes} NST</p>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#22d3ee]/10">
                          <TrendingUp className="w-5 h-5 text-[#22d3ee]" />
                        </div>
                        <div>
                          <p className="font-medium">Donation Referral Rewards</p>
                          <p className="text-sm text-muted-foreground">
                            ${user.directDonationUSD.toLocaleString()} ÷ $1,000 × {DONATION_REFERRAL_REWARD} NST
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-[#22d3ee]">+{earnedFromDonations} NST</p>
                    </div>
                    <div className="border-t border-border pt-4 flex items-center justify-between">
                      <p className="font-semibold">Total Earned</p>
                      <p className="text-2xl font-bold gradient-text">{totalEarned} NST</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress to Free Node */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Gift className="w-5 h-5 text-primary" />
                    Free Node Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <ProgressRing progress={progressToFreeNode} size={160} animated>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{user.directNodeCount}</p>
                      <p className="text-xs text-muted-foreground">of {FREE_NODE_REFERRAL_COUNT}</p>
                    </div>
                  </ProgressRing>
                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    {FREE_NODE_REFERRAL_COUNT - user.directNodeCount > 0
                      ? `${FREE_NODE_REFERRAL_COUNT - user.directNodeCount} more node referrals for a free node`
                      : "🎉 You earned a free node!"}
                  </p>
                </CardContent>
              </Card>

              {/* Reward Rules */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Share2 className="w-5 h-5 text-muted-foreground" />
                    Reward Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Box className="w-4 h-4 text-primary" />
                      <p className="font-medium">Node Referral</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Earn <span className="text-primary font-semibold">{NODE_REFERRAL_REWARD} NST</span> when your
                      referral becomes a node holder
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Coins className="w-4 h-4 text-[#22d3ee]" />
                      <p className="font-medium">Donation Referral</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Earn <span className="text-[#22d3ee] font-semibold">{DONATION_REFERRAL_REWARD} NST</span> per
                      $1,000 donated by referrals
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="w-4 h-4 text-accent" />
                      <p className="font-medium">Free Node Milestone</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get a <span className="text-accent font-semibold">free node</span> after{" "}
                      {FREE_NODE_REFERRAL_COUNT} node referrals
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-lg">Tips for Success</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>• Share your link on social media and crypto communities</p>
                  <p>• Explain the benefits of node ownership</p>
                  <p>• Highlight the 2x points bonus for node holders</p>
                  <p>• Mention the monthly airdrop opportunities</p>
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
