import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Web3Provider } from "@/components/providers/web3-provider"
import { LanguageProvider } from "@/contexts/language-context"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "NST Finance",
  description:
    "The most transparent donation + node incentive model in Web3. Earn rewards through donations, node ownership, and referrals.",
  keywords: ["DeFi", "Blockchain", "Donation", "Nodes", "BSC", "Web3", "NST Token"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <LanguageProvider>
          <Web3Provider>{children}</Web3Provider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
