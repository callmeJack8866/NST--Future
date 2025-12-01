"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GlowButton } from "@/components/ui/glow-button"
import { ProgressRing } from "@/components/ui/progress-ring"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { useWeb3 } from "@/components/providers/web3-provider"
import { useLanguage } from "@/contexts/language-context"
import {
  NODE_PRICE,
  MAX_NODES_PER_USER,
  GLOBAL_NODE_SUPPLY,
  SUPPORTED_TOKENS,
  NODE_REFERRAL_REWARD,
  FREE_NODE_REFERRAL_COUNT,
} from "@/lib/constants"
import { mockUserData, mockNodePurchases, mockGlobalStats } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
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
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function NodesPage() {
  const { isConnected, address, connect } = useWeb3()
  const { t } = useLanguage()
  const [selectedToken, setSelectedToken] = useState("USDT")
  const [nodeCount, setNodeCount] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const user = mockUserData

  const maxPurchasable = Math.min(MAX_NODES_PER_USER - user.nodeCount, mockGlobalStats.nodesRemaining)
  const totalCost = nodeCount * NODE_PRICE
  const nodesSold = GLOBAL_NODE_SUPPLY - mockGlobalStats.nodesRemaining
  const globalProgress = (nodesSold / GLOBAL_NODE_SUPPLY) * 100
  const userProgress = (user.nodeCount / MAX_NODES_PER_USER) * 100

  const handlePurchase = async () => {
    if (nodeCount <= 0 || nodeCount > maxPurchasable) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    alert(`Successfully purchased ${nodeCount} node(s)! (Demo mode)`)
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
              <GlowButton onClick={connect} size="lg">
                <Wallet className="w-5 h-5 mr-2" />
                {t("common.connectWallet")}
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
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("nodes.title")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("nodes.subtitle")}
            </p>
          </div>

          {/* Global Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0s' }}>
              <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold gradient-text">
                  <AnimatedCounter value={nodesSold} />/{GLOBAL_NODE_SUPPLY}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t("nodes.nodesSold")}</p>
              </CardContent>
            </Card>
            <Card className="glass hover-lift animate-float-slow cursor-pointer" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-3 sm:p-4 md:p-6 text-center">
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary">
                  <AnimatedCounter value={mockGlobalStats.nodesRemaining} />
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t("nodes.available")}</p>
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
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-accent">
                  <AnimatedCounter value={user.nodeCount} />/{MAX_NODES_PER_USER}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{t("nodes.yourNodes")}</p>
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
                      {SUPPORTED_TOKENS.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => setSelectedToken(token.symbol)}
                          className={cn(
                            "flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200",
                            selectedToken === token.symbol
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 bg-secondary/30",
                          )}
                        >
                          <span className="text-xl sm:text-2xl">{token.icon}</span>
                          <div className="text-left min-w-0 flex-1">
                            <p className="text-sm sm:text-base font-semibold">{token.symbol}</p>
                            <p className="text-xs text-muted-foreground truncate">{token.name}</p>
                          </div>
                          {selectedToken === token.symbol && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />}
                        </button>
                      ))}
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
                        disabled={nodeCount <= 1}
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
                        disabled={nodeCount >= maxPurchasable}
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
                        disabled={num > maxPurchasable}
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

                  {maxPurchasable === 0 && (
                    <Alert className="glass border-destructive/50">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <AlertTitle>{t("nodes.cannotPurchase")}</AlertTitle>
                      <AlertDescription>
                        {user.nodeCount >= MAX_NODES_PER_USER
                          ? t("nodes.maxNodesReached")
                          : t("nodes.allNodesSold")}
                      </AlertDescription>
                    </Alert>
                  )}

                  <GlowButton
                    className="w-full h-12 sm:h-14 text-base sm:text-lg"
                    disabled={maxPurchasable === 0 || isLoading}
                    onClick={handlePurchase}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        {t("common.processing")}
                      </>
                    ) : (
                      <>
                        <Box className="w-5 h-5 mr-2" />
                        {t("nodes.purchaseButton")} {nodeCount} {t("nodes.node")}
                      </>
                    )}
                  </GlowButton>
                </CardContent>
              </Card>

              {/* Node History */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    {t("nodes.yourNodeHistory")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.source")}</TableHead>
                        <TableHead>{t("common.nodes")}</TableHead>
                        <TableHead>{t("common.cost")}</TableHead>
                        <TableHead>{t("common.date")}</TableHead>
                        <TableHead className="text-right">TX</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockNodePurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              purchase.source === "purchase"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : purchase.source === "upgrade"
                                  ? "bg-[#22d3ee]/10 text-[#22d3ee] border-[#22d3ee]/20"
                                  : "bg-accent/10 text-accent border-accent/20",
                            )}
                          >
                            {t(`common.${purchase.source}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {purchase.count} {t("common.nodes")}
                        </TableCell>
                        <TableCell>
                          {purchase.totalUSD > 0 ? `$${purchase.totalUSD.toLocaleString()}` : t("common.free")}
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
                  <ProgressRing progress={globalProgress} size={140}>
                    <div className="text-center">
                      <p className="text-2xl sm:text-3xl font-bold">{nodesSold}</p>
                      <p className="text-xs text-muted-foreground">of {GLOBAL_NODE_SUPPLY}</p>
                    </div>
                  </ProgressRing>
                  <p className="mt-4 text-xs sm:text-sm text-muted-foreground text-center">
                    {mockGlobalStats.nodesRemaining} {t("nodes.nodesRemaining")}
                  </p>
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
                    <p className="text-sm text-muted-foreground">{t("nodes.directPurchaseDesc")} ${NODE_PRICE.toLocaleString()} {t("nodes.each")}</p>
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
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
