'use client';

import Link from 'next/link';
import { Twitter, Send, Github, FileText, Sparkles } from 'lucide-react';
import { CONSTANTS } from '@/constants';

const navigation = {
  product: [
    { name: 'Donate', href: '/donate' },
    { name: 'Nodes', href: '/nodes' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Leaderboard', href: '/leaderboard' },
  ],
  resources: [
    { name: 'Documentation', href: CONSTANTS.DOCS_URL },
    { name: 'Whitepaper', href: '/docs/whitepaper.pdf' },
    { name: 'Smart Contract', href: `${CONSTANTS.BLOCK_EXPLORER_URL}/address/${process.env.NEXT_PUBLIC_NST_FINANCE_ADDRESS}` },
  ],
  social: [
    { name: 'Twitter', href: CONSTANTS.TWITTER_URL, icon: Twitter },
    { name: 'Telegram', href: CONSTANTS.TELEGRAM_URL, icon: Send },
    { name: 'GitHub', href: CONSTANTS.GITHUB_URL, icon: Github },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">NST Finance</span>
            </Link>
            <p className="text-sm text-foreground/60 max-w-xs">
              Transparent donation and node-based reward ecosystem on {CONSTANTS.CHAIN_NAME}.
            </p>
            <div className="flex gap-4">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/60 hover:text-primary-500 transition-colors"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div>
              <h3 className="text-sm font-semibold leading-6">Product</h3>
              <ul role="list" className="mt-6 space-y-4">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-foreground/60 hover:text-primary-500 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-6">Resources</h3>
              <ul role="list" className="mt-6 space-y-4">
                {navigation.resources.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-foreground/60 hover:text-primary-500 transition-colors"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-foreground/60">
            &copy; {new Date().getFullYear()} NST Finance. All rights reserved.
          </p>
          <p className="text-xs text-foreground/60">
            Powered by {CONSTANTS.CHAIN_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}