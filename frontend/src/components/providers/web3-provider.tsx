"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { WagmiProvider, createConfig, http, useAccount, useConnect, useDisconnect, useBalance } from "wagmi"
import { bsc, bscTestnet } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { 
  RainbowKitProvider, 
  connectorsForWallets,
  darkTheme,
  lightTheme
} from "@rainbow-me/rainbowkit"
import {
  metaMaskWallet,
  trustWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
  okxWallet,
} from "@rainbow-me/rainbowkit/wallets"
import "@rainbow-me/rainbowkit/styles.css"
import { useTheme } from "next-themes"

// WalletConnect Project ID - Replace with your own from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id"

// Configure wallet connectors
const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        metaMaskWallet,
        trustWallet,
        okxWallet,
        walletConnectWallet,
      ],
    },
    {
      groupName: "More",
      wallets: [
        coinbaseWallet,
        rainbowWallet,
      ],
    },
  ],
  {
    appName: "NST Finance",
    projectId,
  }
)

// Wagmi config
const config = createConfig({
  chains: [bsc, bscTestnet],
  connectors,
  transports: {
    [bsc.id]: http("https://bsc-dataseed.binance.org/"),
    [bscTestnet.id]: http("https://data-seed-prebsc-1-s1.binance.org:8545/"),
  },
})

// Query client
const queryClient = new QueryClient()

// Context for additional Web3 functionality
interface Web3ContextType {
  referrer: string | null
  setReferrer: (ref: string | null) => void
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

function Web3ContextProvider({ children }: { children: ReactNode }) {
  const [referrer, setReferrer] = useState<string | null>(null)

  useEffect(() => {
    // Check for referrer in URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get("ref")
      if (ref && ref.startsWith("0x") && ref.length === 42) {
        setReferrer(ref)
        localStorage.setItem("nst_referrer", ref)
      } else {
        const savedRef = localStorage.getItem("nst_referrer")
        if (savedRef) setReferrer(savedRef)
      }
    }
  }, [])

  return (
    <Web3Context.Provider value={{ referrer, setReferrer }}>
      {children}
    </Web3Context.Provider>
  )
}

// RainbowKit themed wrapper
function RainbowKitWrapper({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  
  return (
    <RainbowKitProvider
      theme={resolvedTheme === "dark" ? darkTheme({
        accentColor: "#3b82f6",
        accentColorForeground: "white",
        borderRadius: "medium",
      }) : lightTheme({
        accentColor: "#3b82f6",
        accentColorForeground: "white",
        borderRadius: "medium",
      })}
      modalSize="compact"
    >
      {children}
    </RainbowKitProvider>
  )
}

// Main Web3 Provider
export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitWrapper>
          <Web3ContextProvider>
            {children}
          </Web3ContextProvider>
        </RainbowKitWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Hook to access Web3 context (referrer)
export function useWeb3Context() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3Context must be used within a Web3Provider")
  }
  return context
}

// Combined hook for easy access to common web3 values
export function useWeb3() {
  const { address, isConnected, connector, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { referrer, setReferrer } = useWeb3Context()
  const { data: balanceData } = useBalance({
    address: address,
  })

  return {
    address: address ?? null,
    isConnected,
    chainId,
    balance: balanceData?.formatted ?? "0",
    balanceSymbol: balanceData?.symbol ?? "BNB",
    connector,
    connect: () => {
      // This will trigger RainbowKit modal via ConnectButton
      // For programmatic connection, use the connectors directly
      if (connectors[0]) {
        connect({ connector: connectors[0] })
      }
    },
    disconnect,
    referrer,
    setReferrer,
  }
}

// Export wagmi config for use in hooks
export { config }
