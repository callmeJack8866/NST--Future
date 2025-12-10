"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useAccount, useReadContract } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { cn } from "@/lib/utils"
import { NST_FINANCE_ABI } from "@/lib/contracts/nst-abi"
import { getContracts } from "@/lib/contracts/config"
import {
  LayoutDashboard,
  Heart,
  Box,
  Trophy,
  Users,
  Menu,
  X,
  Shield,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, shortLabel: "Dashboard" },
  { href: "/donate", labelKey: "nav.donate", icon: Heart, shortLabel: "Donate" },
  { href: "/nodes", labelKey: "nav.nodes", icon: Box, shortLabel: "Nodes" },
  { href: "/leaderboard", labelKey: "nav.leaderboard", icon: Trophy, shortLabel: "Leaderboard" },
  { href: "/referral", labelKey: "nav.referral", icon: Users, shortLabel: "Referral" },
]

export function Navbar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { address, chainId, isConnected } = useAccount()
  
  const contracts = getContracts(chainId ?? 97)
  
  // Read contract owner
  const { data: contractOwner } = useReadContract({
    address: contracts.NST_FINANCE as `0x${string}`,
    abi: NST_FINANCE_ABI,
    functionName: "owner",
  })
  
  // Check if user is contract owner
  const isOwner = useMemo(() => {
    if (!isConnected || !address || !contractOwner) return false
    return address.toLowerCase() === (contractOwner as string).toLowerCase()
  }, [isConnected, address, contractOwner])

  // Only show chain badge after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const getChainBadge = () => {
    if (!mounted) return null
    if (chainId === 97) return "Testnet"
    if (chainId === 56) return "Mainnet"
    return null
  }

  const chainBadge = getChainBadge()

  // Build nav items including admin if user is contract owner
  const allNavItems = useMemo(() => {
    if (isOwner) {
      return [
        ...navItems,
        { href: "/admin", labelKey: "nav.admin", icon: Shield, shortLabel: "Admin" },
      ]
    }
    return navItems
  }, [isOwner])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
                <span className="text-sm lg:text-xl font-bold text-primary-foreground">N</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="text-xs sm:text-sm lg:text-lg font-bold gradient-text leading-tight whitespace-nowrap">
                  {t("nav.logo")}
                </span>
                {chainBadge && (
                  <span className={cn(
                    "text-[8px] sm:text-[9px] lg:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap",
                    chainId === 97 ? "bg-yellow-500/20 text-yellow-500" : "bg-green-500/20 text-green-500"
                  )}>
                    {chainBadge}
                  </span>
                )}
              </div>
            </Link>

            {/* Desktop Navigation - Icons only on md, full on lg+ */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center gap-0.5 lg:gap-1">
                {allNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  const isAdminLink = item.href === "/admin"
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                        isAdminLink && !isActive && "text-amber-500 hover:text-amber-400"
                      )}
                      title={item.labelKey === "nav.admin" ? "Admin" : t(item.labelKey)}
                    >
                      <Icon className={cn(
                        "w-4 h-4 shrink-0",
                        isAdminLink && "text-amber-500"
                      )} />
                      <span className="hidden lg:inline whitespace-nowrap">
                        {item.labelKey === "nav.admin" ? "Admin" : item.shortLabel}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right Side: Wallet + Menu */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Language Switcher - Hidden on small screens */}
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              {/* RainbowKit Connect Button */}
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted: walletMounted,
                }) => {
                  const ready = walletMounted && authenticationStatus !== 'loading'
                  const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                      authenticationStatus === 'authenticated')

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        'style': {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <Button 
                              onClick={openConnectModal}
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground glow-green text-xs px-3 h-8"
                            >
                              <span className="hidden sm:inline">Connect Wallet</span>
                              <span className="sm:hidden">Connect</span>
                            </Button>
                          )
                        }

                        if (chain.unsupported) {
                          return (
                            <Button 
                              onClick={openChainModal}
                              variant="destructive"
                              size="sm"
                              className="text-xs px-3 h-8"
                            >
                              Wrong network
                            </Button>
                          )
                        }

                        return (
                          <div className="flex items-center gap-1.5">
                            {/* Chain Button - Icon only on mobile */}
                            <Button
                              onClick={openChainModal}
                              variant="outline"
                              size="sm"
                              className="glass bg-transparent text-xs px-2 h-8 flex items-center gap-1"
                            >
                              {chain.hasIcon && (
                                <div
                                  className="shrink-0"
                                  style={{
                                    background: chain.iconBackground,
                                    width: 16,
                                    height: 16,
                                    borderRadius: 999,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? 'Chain icon'}
                                      src={chain.iconUrl}
                                      style={{ width: 16, height: 16 }}
                                    />
                                  )}
                                </div>
                              )}
                              <span className="hidden lg:inline whitespace-nowrap">{chain.name}</span>
                            </Button>

                            {/* Account Button */}
                            <Button
                              onClick={openAccountModal}
                              variant="outline"
                              size="sm"
                              className="glass bg-transparent text-xs px-2 h-8 flex items-center gap-1.5"
                            >
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                              <span className="font-mono">
                                {account.displayName}
                              </span>
                            </Button>
                          </div>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          
          {/* Menu Panel */}
          <div 
            className="absolute top-14 left-0 right-0 bg-background border-b border-border shadow-xl animate-in slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              {/* Nav Links */}
              <div className="flex flex-col gap-1">
                {allNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  const isAdminLink = item.href === "/admin"
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                        isAdminLink && !isActive && "text-amber-500 hover:text-amber-400"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5 shrink-0",
                        isAdminLink && "text-amber-500"
                      )} />
                      {item.labelKey === "nav.admin" ? "Admin" : t(item.labelKey)}
                    </Link>
                  )
                })}
              </div>

              {/* Language Switcher in Mobile Menu */}
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Language</span>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
