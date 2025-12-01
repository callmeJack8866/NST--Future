"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { GlowButton } from "@/components/ui/glow-button"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { mockGlobalStats } from "@/lib/mock-data"
import { ArrowRight, Shield, Coins, Users, TrendingUp, Zap, Globe, Lock, ChevronRight, Heart } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Transparent & Secure",
    description:
      "All transactions are verified on-chain. Every donation, reward, and node distribution is publicly auditable.",
  },
  {
    icon: Coins,
    title: "Node-Based Rewards",
    description: "Own up to 5 nodes and earn NST tokens. Get automatic node upgrades when donations reach $2,000.",
  },
  {
    icon: Users,
    title: "Referral System",
    description: "Earn 500 NST for each node holder you refer. Get 100 NST per $1,000 in referral donations.",
  },
  {
    icon: TrendingUp,
    title: "Points & Airdrops",
    description:
      "Earn points for every donation. Node holders get 2x points. Compete in monthly rankings for NST airdrops.",
  },
]

const stats = [
  { label: "Total Donations", value: mockGlobalStats.totalDonations, prefix: "$" },
  { label: "Active Nodes", value: mockGlobalStats.totalNodes, suffix: "/100" },
  { label: "Total Users", value: mockGlobalStats.totalUsers },
  { label: "NST Distributed", value: mockGlobalStats.totalNSTDistributed },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background effects */}
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Live on BNB Smart Chain</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <span className="block">Decentralized</span>
            <span className="gradient-text">Donation Ecosystem</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            The most transparent donation + node incentive model in Web3. Earn rewards through donations, node
            ownership, and referrals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link href="/dashboard">
              <GlowButton size="lg" className="w-full sm:w-auto text-lg px-8">
                <Zap className="w-5 h-5 mr-2" />
                Launch App
              </GlowButton>
            </Link>
            <Link href="/donate">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 glass bg-transparent">
                <Heart className="w-5 h-5 mr-2" />
                Start Donating
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <ScrollReveal delay={0.3}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
              {stats.map((stat, i) => (
                <ScrollReveal 
                  key={i}
                  delay={0.4 + i * 0.1}
                  direction="up"
                >
                  <div className="glass rounded-xl p-4 md:p-6 hover-lift animate-float-slow cursor-pointer">
                    <p className="text-lg sm:text-xl md:text-3xl font-bold gradient-text">
                      <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/50 flex justify-center pt-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-linear-to-b from-background via-card/50 to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delay={0.1}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose <span className="gradient-text">NST Finance</span>?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built on transparency, powered by community. Every action is verifiable on the blockchain.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <ScrollReveal 
                key={i}
                delay={i * 0.15}
                direction="up"
              >
                <Card className="glass hover:glass-strong transition-all duration-300 group cursor-pointer hover-lift">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 animate-glow-pulse">
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delay={0.1}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It <span className="gradient-text">Works</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Simple steps to start earning in the NST ecosystem.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Connect Wallet",
                description: "Connect your Web3 wallet to get started. Supports MetaMask and WalletConnect.",
                icon: Zap,
              },
              {
                step: 2,
                title: "Donate or Buy Nodes",
                description: "Make donations (min $100) or purchase nodes ($2,000 each) to start earning.",
                icon: Coins,
              },
              {
                step: 3,
                title: "Earn Rewards",
                description: "Accumulate points, earn NST tokens, and compete for monthly airdrops.",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <ScrollReveal 
                key={i}
                delay={i * 0.2}
                direction="up"
              >
                <div className="relative text-center group">
                  <div className="glass rounded-2xl p-8 h-full hover:glass-strong transition-all duration-300 hover-lift">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 animate-bounce-subtle">
                      <item.icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm animate-scale-pulse">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                  {i < 2 && (
                    <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-muted-foreground/50 -translate-y-1/2 animate-float-x" />
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Multichain Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delay={0.1}>
            <div className="glass rounded-3xl p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <ScrollReveal direction="left" delay={0.2}>
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                      <Globe className="w-4 h-4" />
                      Multi-Chain Support
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                      Expanding Across <span className="gradient-text">Multiple Chains</span>
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Starting on BNB Smart Chain, NST Finance will expand to Ethereum, Arbitrum, Polygon, Avalanche, and
                      Solana. Same transparent ecosystem, multiple blockchain networks.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {["BSC", "Ethereum", "Arbitrum", "Polygon", "Avalanche", "Solana"].map((chain, i) => (
                        <span
                          key={chain}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            i === 0 ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"
                          }`}
                        >
                          {chain}
                        </span>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
                <ScrollReveal direction="right" delay={0.3}>
                  <div className="flex justify-center">
                    <div className="relative w-64 h-64">
                      <div className="absolute inset-0 rounded-full bg-linear-to-br from-primary/30 to-accent/30 animate-pulse" />
                      <div
                        className="absolute inset-4 rounded-full bg-linear-to-br from-primary/20 to-accent/20 animate-pulse"
                        style={{ animationDelay: "0.5s" }}
                      />
                      <div
                        className="absolute inset-8 rounded-full bg-linear-to-br from-primary/10 to-accent/10 animate-pulse"
                        style={{ animationDelay: "1s" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-16 h-16 text-primary" />
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <ScrollReveal direction="up" delay={0.1}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Join the <span className="gradient-text">Revolution</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Start your journey in the most transparent donation ecosystem. Connect your wallet and begin earning today.
            </p>
            <Link href="/dashboard">
              <GlowButton size="lg" className="text-lg px-8">
                <Zap className="w-5 h-5 mr-2" />
                Get Started Now
              </GlowButton>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  )
}
