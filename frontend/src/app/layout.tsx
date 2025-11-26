import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Provider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NST Finance - Transparent Donation & Node Ecosystem",
  description: "Decentralized donation platform with node-based rewards, referral system, and gamified points on BNB Smart Chain",
  keywords: ["DeFi", "Donation", "Nodes", "BSC", "Web3", "Referral", "Rewards"],
  authors: [{ name: "NST Finance" }],
  openGraph: {
    title: "NST Finance",
    description: "Transparent donation and node-based reward ecosystem",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}