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
import { useLanguage } from "@/contexts/language-context"
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
  const { t } = useLanguage()
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
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">{t("donate.makeADonation")}</h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-8">
                {t("donate.connectMessage")}
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
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("donate.title")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("donate.subtitle")}
            </p>
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

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm">{t("donate.donationAmount")}</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        placeholder={t("donate.enterAmount")}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-9 sm:pl-10 text-base sm:text-lg h-12 sm:h-14 glass"
                      />
                    </div>
                    {amount && !isValidAmount && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {t("donate.minimumError")} ${MIN_DONATION}
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
                        {user.isNodeHolder && <span className="text-primary"> {t("donate.nodeHolderBonus")}</span>}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Donate Button */}
                  <GlowButton
                    className="w-full h-12 sm:h-14 text-base sm:text-lg"
                    disabled={!isValidAmount || isLoading}
                    onClick={handleDonate}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        {t("common.processing")}
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        {t("donate.donateButton")} ${numAmount.toLocaleString() || "0"}
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
                    {t("donate.yourDonationHistory")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.token")}</TableHead>
                        <TableHead>{t("common.amount")}</TableHead>
                        <TableHead>{t("common.points")}</TableHead>
                        <TableHead>{t("common.date")}</TableHead>
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
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Gift className="w-5 h-5 text-primary" />
                    {t("donate.autoNodeUpgrade")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold gradient-text">${user.totalDonationUSD.toLocaleString()}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("donate.ofGoal")} ${AUTO_UPGRADE_THRESHOLD.toLocaleString()} {t("donate.goal")}</p>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${progressToUpgrade}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {progressToUpgrade >= 100
                      ? t("donate.eligibleForNode")
                      : `$${(AUTO_UPGRADE_THRESHOLD - user.totalDonationUSD).toLocaleString()} ${t("donate.moreForNode")}`}
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
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">{t("donate.totalDonated")}</span>
                    <span className="font-medium">${user.totalDonationUSD.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">{t("donate.totalPoints")}</span>
                    <span className="font-medium">{user.points.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("donate.status")}</span>
                    <Badge
                      variant="outline"
                      className={cn(user.isNodeHolder ? "text-primary border-primary" : "text-muted-foreground")}
                    >
                      {user.isNodeHolder ? t("common.nodeHolder") : user.isDonor ? t("common.donor") : t("donate.regular")}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("donate.multiplier")}</span>
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
