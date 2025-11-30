import Link from "next/link"
import { Twitter, Send, Github, FileText, MessageCircle, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-lg sm:text-xl font-bold text-primary-foreground">N</span>
              </div>
              <span className="text-lg sm:text-xl font-bold gradient-text">NST Finance</span>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-md leading-relaxed">
              The most transparent donation + node incentive model in Web3. Building a decentralized, verifiable
              ecosystem for contributors and node operators.
            </p>
            <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-6">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Platform</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/donate" className="hover:text-primary transition-colors">
                  Donate
                </Link>
              </li>
              <li>
                <Link href="/nodes" className="hover:text-primary transition-colors">
                  Nodes
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-primary transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/referral" className="hover:text-primary transition-colors">
                  Referral
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Resources</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Whitepaper
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Smart Contract
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Audit Report
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">© 2025 NST Finance. All rights reserved.</p>
          <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
