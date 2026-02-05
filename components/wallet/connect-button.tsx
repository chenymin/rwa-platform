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
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { useWalletBalances } from '@/lib/hooks/useTokenData';

export function ConnectButton() {
  const { ready, login, logout: privyLogout, authenticated: privyAuthenticated } = usePrivy();
  const { user, authenticated, loading: authLoading, error: authError } = useAuth();
  const supabase = createClient();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 使用统一的钱包余额 hook - only after client mount to avoid SSR errors
  let address: string | undefined = undefined;
  let isConnected = false;
  let bnb: any = { formatted: undefined, symbol: '' };
  let usdt: any = { formatted: undefined };

  if (mounted) {
    try {
      const result = useWalletBalances();
      address = result.address;
      isConnected = result.isConnected;
      bnb = result.bnb;
      usdt = result.usdt;
    } catch (err) {
      console.warn('Failed to fetch wallet balances:', err);
    }
  }

  // Handle logout from both Privy and Supabase
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await privyLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 条件渲染
  if (!ready || authLoading) {
    return (
      <Button disabled size="sm">
        {authLoading ? '认证中...' : '加载中...'}
      </Button>
    );
  }

  // 处理认证失败的情况：Privy 已登录但 Edge Function 认证失败
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

  // 只有当 Edge Function 认证成功并且有用户数据时才显示为已连接
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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>我的账户</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs font-mono">
          {address}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 space-y-2">
          <div>
            <div className="text-xs text-muted-foreground">BNB 余额</div>
            <div className="font-semibold">
              {bnb.formatted ? `${bnb.formatted} ${bnb.symbol}` : '加载中...'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">USDT 余额</div>
            <div className="font-semibold">
              {usdt.formatted ? `${usdt.formatted} USDT` : '加载中...'}
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
