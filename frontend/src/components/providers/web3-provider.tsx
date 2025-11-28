"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface Web3ContextType {
  address: string | null
  isConnected: boolean
  chainId: number | null
  balance: string
  connect: () => Promise<void>
  disconnect: () => void
  referrer: string | null
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState("0")
  const [referrer, setReferrer] = useState<string | null>(null)

  useEffect(() => {
    // Check for referrer in URL
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")
    if (ref && ref.startsWith("0x")) {
      setReferrer(ref)
      localStorage.setItem("nst_referrer", ref)
    } else {
      const savedRef = localStorage.getItem("nst_referrer")
      if (savedRef) setReferrer(savedRef)
    }

    // Check if already connected
    const checkConnection = async () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            setAddress(accounts[0])
            setIsConnected(true)
            const chain = await (window as any).ethereum.request({ method: "eth_chainId" })
            setChainId(Number.parseInt(chain, 16))
          }
        } catch (error) {
          console.error("Error checking connection:", error)
        }
      }
    }
    checkConnection()
  }, [])

  const connect = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        })
        setAddress(accounts[0])
        setIsConnected(true)
        const chain = await (window as any).ethereum.request({ method: "eth_chainId" })
        setChainId(Number.parseInt(chain, 16))

        // Simulate balance
        setBalance("1250.50")
      } catch (error) {
        console.error("Error connecting:", error)
      }
    } else {
      // Demo mode - simulate connection
      const demoAddress =
        "0x" +
        Array(40)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join("")
      setAddress(demoAddress)
      setIsConnected(true)
      setChainId(56) // BSC
      setBalance("1250.50")
    }
  }

  const disconnect = () => {
    setAddress(null)
    setIsConnected(false)
    setChainId(null)
    setBalance("0")
  }

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected,
        chainId,
        balance,
        connect,
        disconnect,
        referrer,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}
