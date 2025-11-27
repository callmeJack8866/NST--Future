"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlowButton } from "@/components/ui/glow-button"
import { useWeb3 } from "@/components/providers/web3-provider"
import { MIN_DONATION, SUPPORTED_TOKENS, AUTO_UPGRADE_THRESHOLD } from "@/lib/constants"
import { mockUserData, mockDonationHistory } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import {
  Heart,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Wallet,
  Info,
  Gift,
  Star,
  TrendingUp,
  Clock,
  ExternalLink,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DonatePage() {
  const { isConnected, address, connect } = useWeb3()
  const [selectedToken, setSelectedToken] = useState("USDT")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const user = mockUserData

  const numAmount = Number.parseFloat(amount) || 0
  const isValidAmount = numAmount >= MIN_DONATION
  const pointsToEarn = Math.floor(numAmount / 1000) * 1000 * (user.isNodeHolder ? 2 : 1)
  const progressToUpgrade = Math.min(((user.totalDonationUSD + numAmount) / AUTO_UPGRADE_THRESHOLD) * 100, 100)

  const quickAmounts = [100, 250, 500, 1000, 2000, 5000]

  const handleDonate = async () => {
    if (!isValidAmount) return

    setIsLoading(true)
    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    setAmount("")
    alert("Donation successful! (Demo mode)")
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-float">
                <Heart className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Make a Donation</h1>
              <p className="text-muted-foreground max-w-md mb-8">
                Connect your wallet to start donating and earning rewards in the NST ecosystem.
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
            <h1 className="text-3xl font-bold mb-2">Donate</h1>
            <p className="text-muted-foreground">
              Support the ecosystem and earn points, rewards, and automatic node upgrades.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Donation Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    Make a Donation
                  </CardTitle>
                  <CardDescription>Minimum donation is ${MIN_DONATION} USD</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Token Selection */}
                  <div className="space-y-2">
                    <Label>Select Token</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {SUPPORTED_TOKENS.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => setSelectedToken(token.symbol)}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                            selectedToken === token.symbol
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 bg-secondary/30",
                          )}
                        >
                          <span className="text-2xl">{token.icon}</span>
                          <div className="text-left">
                            <p className="font-semibold">{token.symbol}</p>
                            <p className="text-xs text-muted-foreground">{token.name}</p>
                          </div>
                          {selectedToken === token.symbol && <CheckCircle className="w-5 h-5 text-primary ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Donation Amount (USD)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-10 text-lg h-14 glass"
                      />
                    </div>
                    {amount && !isValidAmount && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Minimum donation is ${MIN_DONATION}
                      </p>
                    )}
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="space-y-2">
                    <Label>Quick Select</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {quickAmounts.map((amt) => (
                        <Button
                          key={amt}
                          variant="outline"
                          className={cn("glass", Number.parseFloat(amount) === amt && "border-primary bg-primary/10")}
                          onClick={() => setAmount(amt.toString())}
                        >
                          ${amt.toLocaleString()}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Points Preview */}
                  {numAmount >= MIN_DONATION && (
                    <Alert className="glass border-primary/50">
                      <Star className="w-4 h-4 text-primary" />
                      <AlertTitle>Points Preview</AlertTitle>
                      <AlertDescription>
                        You will earn{" "}
                        <span className="font-bold text-primary">{pointsToEarn.toLocaleString()} points</span>
                        {user.isNodeHolder && <span className="text-primary"> (2x node holder bonus!)</span>}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Donate Button */}
                  <GlowButton
                    className="w-full h-14 text-lg"
                    disabled={!isValidAmount || isLoading}
                    onClick={handleDonate}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        Donate ${numAmount.toLocaleString() || "0"}
                      </>
                    )}
                  </GlowButton>
                </CardContent>
              </Card>

              {/* Donation History */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    Your Donation History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">TX</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockDonationHistory.map((donation) => (
                        <TableRow key={donation.id}>
                          <TableCell>
                            <Badge variant="outline" className="glass">
                              {donation.token}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">${donation.usdValue.toLocaleString()}</TableCell>
                          <TableCell className="text-primary">+{Math.floor(donation.usdValue / 1000) * 1000}</TableCell>
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress to Auto Upgrade */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Gift className="w-5 h-5 text-primary" />
                    Auto Node Upgrade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text">${user.totalDonationUSD.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">of ${AUTO_UPGRADE_THRESHOLD.toLocaleString()} goal</p>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${progressToUpgrade}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {progressToUpgrade >= 100
                      ? "🎉 Eligible for free node!"
                      : `$${(AUTO_UPGRADE_THRESHOLD - user.totalDonationUSD).toLocaleString()} more for free node`}
                  </p>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="w-5 h-5 text-muted-foreground" />
                    Donation Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Star className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Earn Points</p>
                      <p className="text-sm text-muted-foreground">1000 points per $1000 donated</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">2x Node Bonus</p>
                      <p className="text-sm text-muted-foreground">Node holders earn double points</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Gift className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Free Node</p>
                      <p className="text-sm text-muted-foreground">Auto upgrade at $2000 total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Your Stats */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    Your Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Donated</span>
                    <span className="font-medium">${user.totalDonationUSD.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Points</span>
                    <span className="font-medium">{user.points.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant="outline"
                      className={cn(user.isNodeHolder ? "text-primary border-primary" : "text-muted-foreground")}
                    >
                      {user.isNodeHolder ? "Node Holder" : user.isDonor ? "Donor" : "Regular"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Multiplier</span>
                    <span className="font-medium text-primary">{user.isNodeHolder ? "2x" : "1x"}</span>
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
