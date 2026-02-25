'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ConnectButton } from '@/components/wallet/connect-button';
import { UserMenu } from '@/components/layout/user-menu';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 路由变化时关闭菜单
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navLinks = [
    { href: '/', label: '首页', active: isActive('/') && pathname === '/' },
    { href: '/marketplace', label: '艺术品市场', active: isActive('/marketplace') },
    { href: '/artworks', label: '作品管理', active: isActive('/artworks') || isActive('/artist') || isActive('/admin') },
  ];

  return (
    <nav className="border-b border-border/30 bg-gradient-to-r from-background via-background to-accent/5 backdrop-blur-md supports-[backdrop-filter]:bg-background/95 sticky top-0 z-50 shadow-lg shadow-black/5">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl md:text-2xl font-bold hover:text-primary transition-all duration-300 hover:scale-105">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Art RWA
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-base font-medium hover:text-primary transition-all duration-300 relative group",
                link.active ? "text-primary" : "text-foreground/80"
              )}
            >
              {link.label}
              <span className={cn(
                "absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300",
                link.active ? "w-full" : "w-0 group-hover:w-full"
              )} />
            </Link>
          ))}

          {/* User Menu & Wallet Connect Button - only render after mount */}
          {mounted && (
            <>
              <UserMenu />
              <ConnectButton />
            </>
          )}
        </div>

        {/* Mobile: Wallet + Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {mounted && <ConnectButton />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="菜单"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-border/30",
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="container mx-auto px-4 py-4 space-y-1 bg-background/95 backdrop-blur-md">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block py-3 px-4 rounded-lg text-base font-medium transition-colors",
                link.active
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile User Menu */}
          {mounted && (
            <div className="pt-3 border-t border-border/30 mt-3">
              <UserMenu />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
