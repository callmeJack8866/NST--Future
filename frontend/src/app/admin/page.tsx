"use client"

import React, { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { formatEther } from "viem"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GlowButton } from "@/components/ui/glow-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useAdminContract } from "@/hooks/useAdminContract"
import { toast } from "sonner"
import {
  usePreparedAirdropData,
  useRankingRounds,
  useRankingStats,
  closeRankingRoundApi,
  updateAllSnapshotsApi,
  resetAllSnapshotsApi,
} from "@/hooks/useAdminApi"
import {
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Gift,
  TrendingUp,
  Star,
  Settings,
  Zap,
  Users,
  ExternalLink,
  Wallet,
  Coins,
  Box,
  Plus,
  Ban,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

export default function AdminPage() {
  const { address, isConnected, chainId } = useAccount()
  const [mounted, setMounted] = useState(false)
  
  // Form states
  const [growthAirdropAmount, setGrowthAirdropAmount] = useState("100")
  const [pointsAirdropAmount, setPointsAirdropAmount] = useState("100")
  const [newTreasury, setNewTreasury] = useState("")
  const [newNstToken, setNewNstToken] = useState("")
  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenDecimals, setTokenDecimals] = useState("18")
  const [teamMemberAddress, setTeamMemberAddress] = useState("")
  const [teamNodeCount, setTeamNodeCount] = useState("1")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [snapshotAddresses, setSnapshotAddresses] = useState("")
  const [expandedRound, setExpandedRound] = useState<number | null>(null)
  
  // Messages
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Hooks
  const contract = useAdminContract()
  const { preparedData, refetch: refetchPrepared } = usePreparedAirdropData()
  const { rounds: rankingRounds, refetch: refetchRounds } = useRankingRounds()
  const { stats: rankingStats, refetch: refetchStats } = useRankingStats()

  const explorerUrl = chainId === 97 ? "https://testnet.bscscan.com" : "https://bscscan.com"
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  useEffect(() => {
    setMounted(true)
  }, [])

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
    contract.reset()
  }

  const refreshAll = () => {
    contract.refetchAll()
    refetchPrepared()
    refetchRounds()
    refetchStats()
  }

  // ============ Handlers ============

  const handleProcessAirdrop = async () => {
    if (!preparedData) return
    clearMessages()

    const topGrowthAddresses = preparedData.topGrowthUsers.map(u => u.address)
    const topPointsAddresses = preparedData.topCumulativeUsers.map(u => u.address)
    console.log('Creating airdrop round #', preparedData.round)
    console.log('Top Growth Addresses:', topGrowthAddresses)
    console.log('Top Points Addresses:', topPointsAddresses)

    // Call smart contract to create airdrop round
    // The indexer will automatically sync data from the AirdropRoundCreated event
    const result = await contract.createAirdropRound(
      topGrowthAddresses,
      topPointsAddresses,
      growthAirdropAmount,
      pointsAirdropAmount
    )

    if (result.success) {
      setSuccess(`Airdrop round ${preparedData.round} created on-chain! TX: ${result.hash}. Waiting for indexer to sync...`)
      toast.success(`Airdrop round ${preparedData.round} created successfully!`)
      
      setIsRefreshing(true)
      
      // Progressive refetch with delays to allow blockchain indexer to update
      const delays = [3000, 5000, 8000, 12000, 15000] // Total: ~43 seconds
      
      for (let i = 0; i < delays.length; i++) {
        await new Promise(resolve => setTimeout(resolve, delays[i]))
        
        // Refetch all data
        await Promise.all([
          contract.refetchAll(),
          refetchPrepared(),
          refetchRounds(),
          refetchStats()
        ])
        
        if (i < delays.length - 1) {
          console.log(`Refetch attempt ${i + 1}/${delays.length} completed, waiting for indexer...`)
        }
      }
      
      setIsRefreshing(false)
      setSuccess(`Airdrop round ${preparedData.round} created and synced successfully!`)
    } else {
      setError(result.error || "Failed to create airdrop round")
      toast.error(result.error || "Failed to create airdrop round")
    }
  }

  const handleCloseRound = async (round: number) => {
    clearMessages()
    const result = await contract.closeAirdropRound(round)
    if (result.success) {
      await closeRankingRoundApi(round)
      setSuccess(`Round ${round} closed successfully! Refreshing data...`)
      toast.success(`Round ${round} closed successfully!`)
      
      setIsRefreshing(true)
      
      // Progressive refetch with delays to allow blockchain indexer to update
      const delays = [3000, 5000, 8000] // Total: ~16 seconds (shorter for close action)
      
      for (let i = 0; i < delays.length; i++) {
        await new Promise(resolve => setTimeout(resolve, delays[i]))
        
        // Refetch round data
        await Promise.all([
          contract.refetchAll(),
          refetchRounds(),
          refetchStats()
        ])
        
        if (i < delays.length - 1) {
          console.log(`Close round refetch attempt ${i + 1} completed, waiting for indexer...`)
        }
      }
      
      setIsRefreshing(false)
      setSuccess(`Round ${round} closed and data refreshed successfully!`)
    } else {
      setError(result.error || "Failed to close round")
      toast.error(result.error || "Failed to close round")
    }
  }

  const handleSetTreasury = async () => {
    if (!newTreasury) return
    clearMessages()
    const result = await contract.setTreasury(newTreasury)
    if (result.success) {
      setSuccess("Treasury updated successfully")
      setNewTreasury("")
    } else {
      setError(result.error || "Failed to set treasury")
    }
  }

  const handleSetNstToken = async () => {
    if (!newNstToken) return
    clearMessages()
    const result = await contract.setNSTToken(newNstToken)
    if (result.success) {
      setSuccess("NST Token updated successfully")
      setNewNstToken("")
    } else {
      setError(result.error || "Failed to set NST token")
    }
  }

  const handleToggleClaimEnabled = async () => {
    clearMessages()
    const newValue = !contract.stats?.claimEnabled
    const result = await contract.setClaimEnabled(newValue)
    if (result.success) {
      setSuccess(`Claims ${newValue ? "enabled" : "disabled"} successfully`)
    } else {
      setError(result.error || "Failed to toggle claims")
    }
  }

  const handleAddToken = async () => {
    if (!tokenAddress || !tokenDecimals) return
    clearMessages()
    const result = await contract.addSupportedToken(tokenAddress, Number(tokenDecimals))
    if (result.success) {
      setSuccess("Token added successfully")
      setTokenAddress("")
      setTokenDecimals("18")
    } else {
      setError(result.error || "Failed to add token")
    }
  }

  const handleRemoveToken = async () => {
    if (!tokenAddress) return
    clearMessages()
    const result = await contract.removeSupportedToken(tokenAddress)
    if (result.success) {
      setSuccess("Token removed successfully")
      setTokenAddress("")
    } else {
      setError(result.error || "Failed to remove token")
    }
  }

  const handleAllocateTeamNodes = async () => {
    if (!teamMemberAddress || !teamNodeCount) return
    clearMessages()
    const result = await contract.allocateTeamNodes(teamMemberAddress, Number(teamNodeCount))
    if (result.success) {
      setSuccess(`${teamNodeCount} team node(s) allocated to ${formatAddress(teamMemberAddress)}`)
      setTeamMemberAddress("")
      setTeamNodeCount("1")
    } else {
      setError(result.error || "Failed to allocate team nodes")
    }
  }

  const handleEmergencyWithdraw = async () => {
    if (!withdrawAmount) return
    clearMessages()
    const result = await contract.emergencyWithdrawNST(withdrawAmount)
    if (result.success) {
      setSuccess(`Withdrawn ${withdrawAmount} NST successfully`)
      setWithdrawAmount("")
    } else {
      setError(result.error || "Failed to withdraw")
    }
  }

  const handleBatchUpdateSnapshots = async () => {
    if (!snapshotAddresses) return
    clearMessages()
    const addresses = snapshotAddresses.split(/[,\n]/).map(a => a.trim())
    const result = await contract.batchUpdateSnapshots(addresses)
    if (result.success) {
      setSuccess(`Updated snapshots for ${addresses.length} users`)
      setSnapshotAddresses("")
    } else {
      setError(result.error || "Failed to update snapshots")
    }
  }

  const handleUpdateAllSnapshots = async () => {
    clearMessages()
    console.log('handleUpdateAllSnapshots called')
    try {
      const result = await updateAllSnapshotsApi()
      console.log('updateAllSnapshotsApi result:', result)
      if (result.success) {
        setSuccess(`Updated snapshots for ${result.usersUpdated} users in database`)
        toast.success(`Updated snapshots for ${result.usersUpdated} users in database`)
      } else {
        setError(result.error || "Failed to update snapshots in database")
        toast.error(result.error || "Failed to update snapshots in database")
      }
    } catch (err) {
      console.error('Error in handleUpdateAllSnapshots:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      toast.error(err instanceof Error ? err.message : 'Unknown error occurred')
    }
  }

  const handleResetAllSnapshots = async () => {
    clearMessages()
    console.log('handleResetAllSnapshots called')
    try {
      const result = await resetAllSnapshotsApi()
      console.log('resetAllSnapshotsApi result:', result)
      if (result.success) {
        setSuccess(`Reset snapshots to 0 for ${result.usersUpdated} users. All users will now show 100% growth!`)
        toast.success(`Reset snapshots to 0 for ${result.usersUpdated} users`)
      } else {
        setError(result.error || "Failed to reset snapshots in database")
        toast.error(result.error || "Failed to reset snapshots in database")
      }
    } catch (err) {
      console.error('Error in handleResetAllSnapshots:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      toast.error(err instanceof Error ? err.message : 'Unknown error occurred')
    }
  }

  // ============ Render States ============

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isConnected || !contract.isOwner) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <Shield className="w-12 h-12 text-destructive" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-4">Admin Access Required</h1>
              <p className="text-muted-foreground max-w-md mb-4">
                This page is restricted to contract owner and authorized administrators only.
              </p>
              {isConnected && address && (
                <p className="text-sm text-muted-foreground font-mono">
                  Connected: {formatAddress(address)}
                </p>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const { stats } = contract

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage airdrops, tokens, and smart contract settings
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={refreshAll} disabled={contract.isProcessing || isRefreshing}>
                <RefreshCw className={cn("w-4 h-4 mr-2", (contract.isProcessing || isRefreshing) && "animate-spin")} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Badge variant="outline" className="glass px-4 py-2">
                Contract Owner
              </Badge>
            </div>
          </div>

          {/* Alerts */}
          {(error || contract.error) && (
            <Alert className="mb-6 border-destructive/50 bg-destructive/10">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error || contract.error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-500/50 bg-green-500/10">
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                {success}
                {isRefreshing && " Please wait while we sync with the blockchain..."}
                {contract.txHash && (
                  <a
                    href={`${explorerUrl}/tx/${contract.txHash}`}
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

          {/* Contract Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <Card className="glass">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Current Round</p>
                <p className="text-xl font-bold gradient-text">{stats?.currentRound?.toString() || "0"}</p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Total Users</p>
                <p className="text-xl font-bold gradient-text">{stats?.totalUsers?.toString() || "0"}</p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Public Nodes</p>
                <p className="text-xl font-bold gradient-text">{stats?.publicNodesIssued?.toString() || "0"}/100</p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Team Nodes</p>
                <p className="text-xl font-bold gradient-text">{stats?.teamNodesIssued?.toString() || "0"}/20</p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Claims</p>
                <p className={cn("text-xl font-bold", stats?.claimEnabled ? "text-green-500" : "text-red-500")}>
                  {stats?.claimEnabled ? "Enabled" : "Disabled"}
                </p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Total Donations</p>
                <p className="text-xl font-bold gradient-text">
                  ${stats?.totalDonationsUSD ? Math.round(Number(formatEther(stats.totalDonationsUSD))).toLocaleString() : "0"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="airdrop" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 glass">
              <TabsTrigger value="airdrop" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
                <Gift className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Airdrop</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
                <Settings className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="tokens" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
                <Coins className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tokens</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm">
                <Users className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Team</span>
              </TabsTrigger>
            </TabsList>

            {/* AIRDROP TAB */}
            <TabsContent value="airdrop">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create Airdrop */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Create Airdrop Round
                    </CardTitle>
                    <CardDescription>
                      Round #{preparedData?.round || (Number(stats?.currentRound || 0) + 1)} • Top 20 Growth + Top 20 Points
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Growth Reward (NST/user)</Label>
                        <Input
                          type="number"
                          value={growthAirdropAmount}
                          onChange={(e) => setGrowthAirdropAmount(e.target.value)}
                          placeholder="100"
                          className="glass"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Points Reward (NST/user)</Label>
                        <Input
                          type="number"
                          value={pointsAirdropAmount}
                          onChange={(e) => setPointsAirdropAmount(e.target.value)}
                          placeholder="100"
                          className="glass"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
                      <p className="text-sm font-medium">Preview:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <p>• Growth Top 20: {preparedData?.topGrowthUsers.length || 0} users</p>
                        <p>• Points Top 20: {preparedData?.topCumulativeUsers.length || 0} users</p>
                        <p>• Growth Total: {Number(growthAirdropAmount) * 20} NST</p>
                        <p>• Points Total: {Number(pointsAirdropAmount) * 20} NST</p>
                      </div>
                      <p className="text-sm font-medium text-primary">
                        Max Distribution: {(Number(growthAirdropAmount) + Number(pointsAirdropAmount)) * 20} NST
                      </p>
                    </div>

                    <GlowButton
                      className="w-full"
                      onClick={handleProcessAirdrop}
                      disabled={contract.isActionProcessing("createAirdrop") || !preparedData}
                    >
                      {contract.isActionProcessing("createAirdrop") ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Create Airdrop Round
                        </>
                      )}
                    </GlowButton>
                  </CardContent>
                </Card>

                {/* Rankings Preview */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Rankings Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Top 5 Growth</p>
                        <div className="space-y-1">
                          {preparedData?.topGrowthUsers.slice(0, 5).map((u, i) => (
                            <div key={u.address} className="flex justify-between text-xs">
                              <span className="font-mono">{i + 1}. {formatAddress(u.address)}</span>
                              <span className="text-primary">+{u.growthPercentage.toFixed(1)}%</span>
                            </div>
                          )) || <p className="text-xs text-muted-foreground">No data</p>}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Top 5 Points</p>
                        <div className="space-y-1">
                          {preparedData?.topCumulativeUsers.slice(0, 5).map((u, i) => (
                            <div key={u.address} className="flex justify-between text-xs">
                              <span className="font-mono">{i + 1}. {formatAddress(u.address)}</span>
                              <span className="text-primary">{Math.round(u.totalPoints).toLocaleString()}</span>
                            </div>
                          )) || <p className="text-xs text-muted-foreground">No data</p>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* History */}
                <Card className="glass lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-[#facc15]" />
                      Airdrop History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    {rankingRounds.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground text-sm">
                        No airdrop rounds created yet
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Round</TableHead>
                            <TableHead>Growth Winners</TableHead>
                            <TableHead>Growth Reward</TableHead>
                            <TableHead>Points Winners</TableHead>
                            <TableHead>Points Reward</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rankingRounds.map((round) => (
                            <React.Fragment key={round.id}>
                              <TableRow 
                                className="cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => setExpandedRound(expandedRound === round.round ? null : round.round)}
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {expandedRound === round.round ? (
                                      <ChevronDown className="w-4 h-4 text-primary" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    )}
                                    #{round.round}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs text-muted-foreground">
                                    {round.topGrowthUsers?.length || 0} users
                                  </div>
                                </TableCell>
                                <TableCell>{parseFloat(round.growthAirdropAmount).toLocaleString()} NST</TableCell>
                                <TableCell>
                                  <div className="text-xs text-muted-foreground">
                                    {round.topCumulativeUsers?.length || 0} users
                                  </div>
                                </TableCell>
                                <TableCell>{parseFloat(round.cumulativeAirdropAmount).toLocaleString()} NST</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={round.isActive ? "border-green-500 text-green-500" : "border-muted-foreground"}
                                  >
                                    {round.isActive ? "Active" : "Closed"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {new Date(round.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                  {round.isActive && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCloseRound(round.round)}
                                      disabled={contract.isActionProcessing("closeAirdrop")}
                                    >
                                      {contract.isActionProcessing("closeAirdrop") ? <Loader2 className="w-3 h-3 animate-spin" /> : "Close"}
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                              
                              {expandedRound === round.round && (
                                <TableRow key={`${round.id}-expanded`}>
                                  <TableCell colSpan={8} className="bg-secondary/20">
                                    <div className="py-4 px-2">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-primary" />
                                            Top Growth Users ({round.topGrowthUsers?.length || 0})
                                          </h4>
                                          <div className="space-y-1 max-h-64 overflow-y-auto">
                                            {round.topGrowthUsers && round.topGrowthUsers.length > 0 ? (
                                              round.topGrowthUsers.map((addr, idx) => (
                                                <div key={addr} className="flex items-center justify-between text-sm p-2 rounded bg-background/50">
                                                  <span className="text-muted-foreground">#{idx + 1}</span>
                                                  <a
                                                    href={`${explorerUrl}/address/${addr}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-mono text-xs hover:text-primary flex items-center gap-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    {formatAddress(addr)}
                                                    <ExternalLink className="w-3 h-3" />
                                                  </a>
                                                  <span className="text-primary font-medium">{parseFloat(round.growthAirdropAmount).toLocaleString()} NST</span>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-xs text-muted-foreground text-center py-4">No growth users</p>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <Star className="w-4 h-4 text-[#facc15]" />
                                            Top Points Users ({round.topCumulativeUsers?.length || 0})
                                          </h4>
                                          <div className="space-y-1 max-h-64 overflow-y-auto">
                                            {round.topCumulativeUsers && round.topCumulativeUsers.length > 0 ? (
                                              round.topCumulativeUsers.map((addr, idx) => (
                                                <div key={addr} className="flex items-center justify-between text-sm p-2 rounded bg-background/50">
                                                  <span className="text-muted-foreground">#{idx + 1}</span>
                                                  <a
                                                    href={`${explorerUrl}/address/${addr}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-mono text-xs hover:text-primary flex items-center gap-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    {formatAddress(addr)}
                                                    <ExternalLink className="w-3 h-3" />
                                                  </a>
                                                  <span className="text-primary font-medium">{parseFloat(round.cumulativeAirdropAmount).toLocaleString()} NST</span>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-xs text-muted-foreground text-center py-4">No points users</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      Treasury
                      {!contract.isOwner && <Badge variant="outline" className="ml-2 text-xs">Owner Only</Badge>}
                    </CardTitle>
                    <CardDescription>
                      Current: {stats?.treasury ? formatAddress(stats.treasury) : "Not set"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>New Treasury Address</Label>
                      <Input
                        value={newTreasury}
                        onChange={(e) => setNewTreasury(e.target.value)}
                        placeholder="0x..."
                        className="glass font-mono text-sm"
                        disabled={!contract.isOwner}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleSetTreasury} 
                      disabled={contract.isActionProcessing("setTreasury") || !newTreasury || !contract.isOwner}
                    >
                      {contract.isActionProcessing("setTreasury") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Update Treasury
                    </Button>
                    {!contract.isOwner && (
                      <p className="text-xs text-muted-foreground text-center">Only contract owner can update treasury</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-[#22d3ee]" />
                      NST Token
                      {!contract.isOwner && <Badge variant="outline" className="ml-2 text-xs">Owner Only</Badge>}
                    </CardTitle>
                    <CardDescription>
                      Current: {stats?.nstToken && stats.nstToken !== "0x0000000000000000000000000000000000000000"
                        ? formatAddress(stats.nstToken)
                        : "Not set"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>NST Token Address</Label>
                      <Input
                        value={newNstToken}
                        onChange={(e) => setNewNstToken(e.target.value)}
                        placeholder="0x..."
                        className="glass font-mono text-sm"
                        disabled={!contract.isOwner}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleSetNstToken} 
                      disabled={contract.isActionProcessing("setNSTToken") || !newNstToken || !contract.isOwner}
                    >
                      {contract.isActionProcessing("setNSTToken") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Set NST Token
                    </Button>
                    {!contract.isOwner && (
                      <p className="text-xs text-muted-foreground text-center">Only contract owner can set NST token</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-primary" />
                      NST Claims
                      {!contract.isOwner && <Badge variant="outline" className="ml-2 text-xs">Owner Only</Badge>}
                    </CardTitle>
                    <CardDescription>Enable/disable NST referral reward claims</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                      <div>
                        <p className="font-medium">Claim Status</p>
                        <p className="text-sm text-muted-foreground">
                          {stats?.claimEnabled ? "Users can claim NST rewards" : "Claims are disabled"}
                        </p>
                      </div>
                      <Switch
                        checked={stats?.claimEnabled ?? false}
                        onCheckedChange={handleToggleClaimEnabled}
                        disabled={contract.isActionProcessing("setClaimEnabled") || !contract.isOwner}
                      />
                    </div>
                    {!contract.isOwner && (
                      <p className="text-xs text-muted-foreground text-center">Only contract owner can toggle claims</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass border-destructive/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-5 h-5" />
                      Emergency Withdraw
                      {!contract.isOwner && <Badge variant="outline" className="ml-2 text-xs">Owner Only</Badge>}
                    </CardTitle>
                    <CardDescription>Withdraw NST tokens from contract (owner only)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Amount (NST)</Label>
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="1000"
                        className="glass"
                        disabled={!contract.isOwner}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleEmergencyWithdraw}
                      disabled={contract.isActionProcessing("emergencyWithdraw") || !withdrawAmount || !contract.isOwner}
                    >
                      {contract.isActionProcessing("emergencyWithdraw") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Emergency Withdraw
                    </Button>
                    {!contract.isOwner && (
                      <p className="text-xs text-muted-foreground text-center">Only contract owner can withdraw</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-primary" />
                      Snapshot Management
                    </CardTitle>
                    <CardDescription>Update lastSnapshotPoints for users (resets growth baseline)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Batch Update (addresses, comma or newline separated)</Label>
                        <textarea
                          value={snapshotAddresses}
                          onChange={(e) => setSnapshotAddresses(e.target.value)}
                          placeholder="0x123..., 0x456..."
                          className="w-full h-24 p-3 rounded-lg glass font-mono text-xs resize-none"
                        />
                        <Button
                          className="w-full"
                          onClick={handleBatchUpdateSnapshots}
                          disabled={contract.isActionProcessing("batchUpdateSnapshots") || !snapshotAddresses}
                        >
                          {contract.isActionProcessing("batchUpdateSnapshots") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Update on Contract
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Update All Users in Database</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Sets lastSnapshotPoints = points for all users (resets growth to 0%)
                        </p>
                        <Button
                          variant="outline"
                          className="w-full glass bg-transparent"
                          onClick={handleUpdateAllSnapshots}
                        >
                          Update All (Current Points)
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Reset All Snapshots to 0</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Sets lastSnapshotPoints = 0 for all users (allows 100% growth)
                        </p>
                        <Button
                          variant="outline"
                          className="w-full glass bg-transparent border-green-500/50 text-green-500 hover:bg-green-500/10"
                          onClick={handleResetAllSnapshots}
                        >
                          Reset All to 0
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TOKENS TAB */}
            <TabsContent value="tokens">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-green-500" />
                      Add Supported Token
                    </CardTitle>
                    <CardDescription>Add a new stablecoin for donations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Token Address</Label>
                      <Input
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        placeholder="0x..."
                        className="glass font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Decimals</Label>
                      <Input
                        type="number"
                        value={tokenDecimals}
                        onChange={(e) => setTokenDecimals(e.target.value)}
                        placeholder="18"
                        className="glass"
                      />
                    </div>
                    <Button className="w-full" onClick={handleAddToken} disabled={contract.isActionProcessing("addToken") || !tokenAddress}>
                      {contract.isActionProcessing("addToken") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Token
                    </Button>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ban className="w-5 h-5 text-red-500" />
                      Remove Supported Token
                    </CardTitle>
                    <CardDescription>Remove a stablecoin from supported tokens</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Token Address</Label>
                      <Input
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        placeholder="0x..."
                        className="glass font-mono text-sm"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleRemoveToken}
                      disabled={contract.isActionProcessing("removeToken") || !tokenAddress}
                    >
                      {contract.isActionProcessing("removeToken") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                      Remove Token
                    </Button>
                  </CardContent>
                </Card>

                <Card className="glass lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Quick Add Common Tokens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { name: "USDT (BSC)", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
                        { name: "USDC (BSC)", address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
                        { name: "BUSD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18 },
                        { name: "DAI (BSC)", address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", decimals: 18 },
                      ].map((token) => (
                        <Button
                          key={token.address}
                          variant="outline"
                          className="glass bg-transparent text-xs"
                          onClick={() => {
                            setTokenAddress(token.address)
                            setTokenDecimals(token.decimals.toString())
                          }}
                        >
                          {token.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TEAM TAB */}
            <TabsContent value="team">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="w-5 h-5 text-primary" />
                      Allocate Team Nodes
                    </CardTitle>
                    <CardDescription>Assign locked team nodes (2 year lock period)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Team Member Address</Label>
                      <Input
                        value={teamMemberAddress}
                        onChange={(e) => setTeamMemberAddress(e.target.value)}
                        placeholder="0x..."
                        className="glass font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Nodes</Label>
                      <Input
                        type="number"
                        value={teamNodeCount}
                        onChange={(e) => setTeamNodeCount(e.target.value)}
                        placeholder="1"
                        min="1"
                        className="glass"
                      />
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground">
                      <p>• Team nodes are locked for 2 years from contract deployment</p>
                      <p>• Remaining: {stats?.teamNodesRemaining?.toString() ?? 20} team nodes</p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleAllocateTeamNodes}
                      disabled={contract.isActionProcessing("allocateTeamNodes") || !teamMemberAddress || !teamNodeCount}
                    >
                      {contract.isActionProcessing("allocateTeamNodes") ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Box className="w-4 h-4 mr-2" />}
                      Allocate Team Nodes
                    </Button>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      Team Node Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-secondary/30 text-center">
                          <p className="text-2xl font-bold gradient-text">{stats?.teamNodesIssued?.toString() || "0"}</p>
                          <p className="text-xs text-muted-foreground">Allocated</p>
                        </div>
                        <div className="p-4 rounded-lg bg-secondary/30 text-center">
                          <p className="text-2xl font-bold gradient-text">{stats?.teamNodesRemaining?.toString() || "20"}</p>
                          <p className="text-xs text-muted-foreground">Remaining</p>
                        </div>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-primary to-accent"
                          style={{ width: `${((Number(stats?.teamNodesIssued || 0)) / 20) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Team nodes unlock 2 years after contract deployment
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
