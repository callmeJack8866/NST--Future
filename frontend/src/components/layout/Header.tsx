'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { Menu, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';

const navigation = [
  { name: 'Home', href: ROUTES.HOME },
  { name: 'Donate', href: ROUTES.DONATE },
  { name: 'Nodes', href: ROUTES.NODES },
  { name: 'Dashboard', href: ROUTES.DASHBOARD },
  { name: 'Leaderboard', href: ROUTES.LEADERBOARD },
  { name: 'Referral', href: ROUTES.REFERRAL },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">NST Finance</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary-500',
                pathname === item.href
                  ? 'text-primary-500'
                  : 'text-foreground/60'
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Connect Button */}
        <div className="hidden lg:flex">
          <ConnectButton />
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block rounded-md px-3 py-2 text-base font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary-500/10 text-primary-500'
                    : 'text-foreground/60 hover:bg-primary-500/5 hover:text-primary-500'
                )}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}