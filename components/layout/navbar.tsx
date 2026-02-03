'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@/components/wallet/connect-button';
import { UserMenu } from '@/components/layout/user-menu';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="border-b border-border/30 bg-gradient-to-r from-background via-background to-accent/5 backdrop-blur-md supports-[backdrop-filter]:bg-background/95 sticky top-0 z-50 shadow-lg shadow-black/5">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold hover:text-primary transition-all duration-300 hover:scale-105">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Art RWA
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className={cn(
              "text-base font-medium hover:text-primary transition-all duration-300 relative group",
              isActive('/') && pathname === '/' ? "text-primary" : "text-foreground/80"
            )}
          >
            首页
            <span className={cn(
              "absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300",
              isActive('/') && pathname === '/' ? "w-full" : "w-0 group-hover:w-full"
            )} />
          </Link>
          <Link
            href="/marketplace"
            className={cn(
              "text-base font-medium hover:text-primary transition-all duration-300 relative group",
              isActive('/marketplace') ? "text-primary" : "text-foreground/80"
            )}
          >
            艺术品市场
            <span className={cn(
              "absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300",
              isActive('/marketplace') ? "w-full" : "w-0 group-hover:w-full"
            )} />
          </Link>
          <Link
            href="/artworks"
            className={cn(
              "text-base font-medium hover:text-primary transition-all duration-300 relative group",
              isActive('/artworks') || isActive('/artist') || isActive('/admin') ? "text-primary" : "text-foreground/80"
            )}
          >
            作品管理
            <span className={cn(
              "absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300",
              isActive('/artworks') || isActive('/artist') || isActive('/admin') ? "w-full" : "w-0 group-hover:w-full"
            )} />
          </Link>

          {/* User Menu - Only shown when authenticated */}
          <UserMenu />

          {/* Wallet Connect Button */}
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
