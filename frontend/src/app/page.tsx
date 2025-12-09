"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { GlowButton } from "@/components/ui/glow-button"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { useLanguage } from "@/contexts/language-context"
import { useGlobalStatsApi } from "@/hooks/useApi"
import { GLOBAL_NODE_SUPPLY } from "@/lib/constants"
import { ArrowRight, Shield, Coins, Users, TrendingUp, Zap, Globe, Lock, ChevronRight, Heart } from "lucide-react"

export default function HomePage() {
  const { t } = useLanguage()
  
  // Fetch real stats from backend
  const { globalStats, isLoading: isLoadingStats } = useGlobalStatsApi()

  const features = [
    {
      icon: Shield,
      titleKey: "features.transparent.title",
      descriptionKey: "features.transparent.description",
    },
    {
      icon: Coins,
      titleKey: "features.nodes.title",
      descriptionKey: "features.nodes.description",
    },
    {
      icon: Users,
      titleKey: "features.referral.title",
      descriptionKey: "features.referral.description",
    },
    {
      icon: TrendingUp,
      titleKey: "features.points.title",
      descriptionKey: "features.points.description",
    },
  ]

  const stats = [
    { labelKey: "stats.totalDonations", value: Math.round(globalStats?.totalDonationsUSD ?? 0), prefix: "$" },
    { labelKey: "stats.activeNodes", value: globalStats?.totalNodesIssued ?? 0, suffix: `/${GLOBAL_NODE_SUPPLY}` },
    { labelKey: "stats.totalUsers", value: globalStats?.totalUsers ?? 0 },
    { labelKey: "stats.nstDistributed", value: Math.round(globalStats?.totalPointsDistributed ?? 0) },
  ]

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
            <span className="text-sm text-muted-foreground">{t("hero.badge")}</span>
          </div>

          {/* Hero Title - Compact and user-friendly */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 leading-snug">
            <span className="block mb-1">{t("hero.title1")}</span>
            <span className="gradient-text block text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-snug font-semibold">{t("hero.title2")}</span>
          </h1>

          {/* Subtitle - Clean and readable */}
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 leading-relaxed px-4">
            {t("hero.subtitle")}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 px-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <GlowButton size="default" className="w-full sm:w-auto text-sm sm:text-base px-5 sm:px-6 whitespace-nowrap">
                <Zap className="w-4 h-4 mr-2" />
                {t("hero.launchApp")}
              </GlowButton>
            </Link>
            <Link href="/donate" className="w-full sm:w-auto">
              <Button size="default" variant="outline" className="w-full sm:w-auto text-sm sm:text-base px-5 sm:px-6 glass bg-transparent whitespace-nowrap">
                <Heart className="w-4 h-4 mr-2" />
                {t("hero.startDonating")}
              </Button>
            </Link>
          </div>

          {/* Quick Stats - Compact design */}
          <ScrollReveal delay={0.3}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-12 px-2">
              {stats.map((stat, i) => (
                <ScrollReveal 
                  key={i}
                  delay={0.4 + i * 0.1}
                  direction="up"
                >
                  <div className="glass rounded-xl p-3 sm:p-4 hover-lift cursor-pointer">
                    <p className="text-base sm:text-lg md:text-2xl font-bold gradient-text">
                      <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight">{t(stat.labelKey)}</p>
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

      {/* Features Section - UPDATE: Better card padding for Chinese */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-linear-to-b from-background via-card/50 to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delay={0.1}>
            <div className="text-center mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
                {t("features.title")} <span className="gradient-text">NST Finance</span>?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t("features.subtitle")}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {features.map((feature, i) => (
              <ScrollReveal 
                key={i}
                delay={i * 0.15}
                direction="up"
                className="h-full"
              >
                <Card className="glass hover:glass-strong transition-all duration-300 group cursor-pointer hover-lift h-full">
                  <CardContent className="p-5 sm:p-6 md:p-8 h-full flex flex-col">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <div className="p-2.5 sm:p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 animate-glow-pulse shrink-0">
                        <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 leading-tight">{t(feature.titleKey)}</h3>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">{t(feature.descriptionKey)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - UPDATE: Better mobile text */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delay={0.1}>
            <div className="text-center mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
                {t("howItWorks.title")} <span className="gradient-text">{t("howItWorks.titleHighlight")}</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t("howItWorks.subtitle")}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: 1,
                titleKey: "howItWorks.step1.title",
                descriptionKey: "howItWorks.step1.description",
                icon: Zap,
              },
              {
                step: 2,
                titleKey: "howItWorks.step2.title",
                descriptionKey: "howItWorks.step2.description",
                icon: Coins,
              },
              {
                step: 3,
                titleKey: "howItWorks.step3.title",
                descriptionKey: "howItWorks.step3.description",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <ScrollReveal 
                key={i}
                delay={i * 0.2}
                direction="up"
                className="h-full"
              >
                <div className="relative text-center group h-full">
                  <div className="glass rounded-2xl p-6 sm:p-8 h-full hover:glass-strong transition-all duration-300 hover-lift flex flex-col">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 animate-bounce-subtle">
                      <item.icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm animate-scale-pulse">
                      {item.step}
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 leading-tight px-2">{t(item.titleKey)}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line px-2 flex-1">{t(item.descriptionKey)}</p>
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

      {/* Multichain Section - UPDATE: Better text wrapping */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delay={0.1}>
            <div className="glass rounded-3xl p-6 sm:p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
                <ScrollReveal direction="left" delay={0.2}>
                  <div className="px-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm mb-4">
                      <Globe className="w-4 h-4" />
                      {t("multichain.badge")}
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
                      {t("multichain.title")} <span className="gradient-text block sm:inline">{t("multichain.titleHighlight")}</span>
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
                      {t("multichain.description")}
                    </p>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {["BSC", "Ethereum", "Arbitrum", "Polygon", "Avalanche", "Solana"].map((chain, i) => (
                        <span
                          key={chain}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${
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

      {/* CTA Section - UPDATE: Better mobile text */}
      <section className="py-20">
        <ScrollReveal direction="up" delay={0.1}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight px-4">
              {t("cta.title")} <span className="gradient-text block sm:inline">{t("cta.titleHighlight")}</span>?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed px-4">
              {t("cta.subtitle")}
            </p>
            <Link href="/dashboard">
              <GlowButton size="lg" className="text-base sm:text-lg px-6 sm:px-8 whitespace-nowrap">
                <Zap className="w-5 h-5 mr-2" />
                {t("cta.button")}
              </GlowButton>
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  )
}
