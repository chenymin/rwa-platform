'use client';

import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useWalletBalances } from '@/lib/hooks/useTokenData';
import { useWalletSelector } from '@/lib/hooks/useWalletSelector';

// Inner component that uses wallet hooks - only rendered after mount
function ConnectButtonInner() {
  const { ready, login, logout: privyLogout, authenticated: privyAuthenticated } = usePrivy();
  const { user, authenticated, loading: authLoading, error: authError } = useAuth();
  const supabase = createClient();

  // 钱包选择器
  const { wallets, selectedAddress, selectWallet, getWalletLabel } = useWalletSelector();

  // 钱包余额
  const { address, bnb, usdt } = useWalletBalances();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await privyLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!ready || authLoading) {
    return (
      <Button disabled size="sm">
        {authLoading ? '认证中...' : '加载中...'}
      </Button>
    );
  }

  if (privyAuthenticated && !user && authError) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          onClick={async () => {
            await supabase.auth.signOut();
            await privyLogout();
          }}
          variant="destructive"
          size="sm"
        >
          认证失败，重新登录
        </Button>
        <div className="text-xs text-red-600 max-w-[200px]">
          {authError}
        </div>
      </div>
    );
  }

  if (!authenticated || !user) {
    return (
      <Button onClick={login} size="sm">
        登录
      </Button>
    );
  }

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '已连接';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          {displayAddress}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>我的账户</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* 钱包切换 */}
        {wallets.length > 1 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">切换钱包</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={selectedAddress || ''} onValueChange={selectWallet}>
              {wallets.map((wallet) => (
                <DropdownMenuRadioItem
                  key={wallet.address}
                  value={wallet.address}
                  className="text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{getWalletLabel(wallet)}</span>
                    <span className="font-mono text-muted-foreground">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </span>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* 当前钱包地址 */}
        <div className="px-2 py-1.5">
          <div className="text-xs text-muted-foreground">当前钱包</div>
          <div className="text-xs font-mono break-all">{address}</div>
        </div>
        <DropdownMenuSeparator />

        {/* 余额信息 */}
        <div className="px-2 py-1.5 space-y-2">
          <div>
            <div className="text-xs text-muted-foreground">BNB 余额</div>
            <div className="font-semibold">
              {bnb?.formatted ? `${bnb.formatted} ${bnb.symbol}` : '加载中...'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">USDT 余额</div>
            <div className="font-semibold">
              {usdt?.formatted ? `${usdt.formatted} USDT` : '加载中...'}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Outer component that handles mount state
export function ConnectButton() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render nothing during SSR
    return null;
  }

  return <ConnectButtonInner />;
}
