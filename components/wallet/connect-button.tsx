'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useBalance, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
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

// 艺术品代币合约地址
const ART_TOKEN_CONTRACT = '0x49bd8fb9ff76a933aaf7f630537bbacdccc0329c' as const;

// ABI for reading USDT address
const ART_TOKEN_ABI = [
  {
    inputs: [],
    name: 'USDT',
    outputs: [{ internalType: 'contract IERC20', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC20 ABI for reading balance
const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function ConnectButton() {
  const { ready, login, logout: privyLogout, authenticated: privyAuthenticated } = usePrivy();
  const { wallets } = useWallets();
  const { user, authenticated, loading: authLoading, error: authError } = useAuth();
  const supabase = createClient();

  // 获取钱包地址 - 在所有 hooks 之前计算
  const wallet = wallets[0];
  const address = wallet?.address as `0x${string}` | undefined;

  // 读取 BNB 余额 - 必须在所有条件返回之前调用
  const { data: balance } = useBalance({
    address: address,
    query: {
      enabled: !!address,
    },
  });

  // 读取 USDT 合约地址
  const { data: usdtAddress } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'USDT',
  });

  // 读取 USDT 余额
  const { data: usdtBalance } = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!usdtAddress && !!address,
    },
  });

  // 读取 USDT decimals
  const { data: usdtDecimals } = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!usdtAddress,
    },
  });

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

  // USDT decimals 默认为 6
  const usdtDec = usdtDecimals ?? 6;

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
              {balance ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}` : '加载中...'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">USDT 余额</div>
            <div className="font-semibold">
              {usdtBalance !== undefined ? `${parseFloat(formatUnits(usdtBalance, usdtDec)).toFixed(2)} USDT` : '加载中...'}
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
