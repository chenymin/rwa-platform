'use client';

import { useWallets } from '@privy-io/react-auth';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, ExternalLink, Wallet } from 'lucide-react';
import Link from 'next/link';

// 艺术品代币合约地址
const ART_TOKEN_CONTRACT = '0x49bd8fb9ff76a933aaf7f630537bbacdccc0329c' as const;

// 获取链配置
const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97');
const explorerUrl = chainId === 56 ? 'https://bscscan.com' : 'https://testnet.bscscan.com';

// 艺术品代币合约 ABI
const ART_TOKEN_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'priceUSDT',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function EarningsPage() {
  const { wallets } = useWallets();
  const wallet = wallets[0];
  const address = wallet?.address as `0x${string}` | undefined;
  const isConnected = !!wallet;

  // 读取代币余额
  const { data: tokenBalance, isLoading: balanceLoading } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // 读取代币符号
  const { data: tokenSymbol } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'symbol',
  });

  // 读取代币名称
  const { data: tokenName } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'name',
  });

  // 读取代币价格
  const { data: priceUSDT } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'priceUSDT',
  });

  // 读取总供应量
  const { data: totalSupply } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'totalSupply',
  });

  // 计算持有价值 (USDT)
  const holdingValue = tokenBalance && priceUSDT
    ? (tokenBalance * priceUSDT) / BigInt(10 ** 18)
    : BigInt(0);

  // USDT decimals (MockUSDT 是 6)
  const usdtDecimals = 6;

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">请先连接钱包</h2>
            <p className="text-muted-foreground text-center">
              连接钱包后即可查看您持有的艺术品代币
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">我的持仓</h1>
        <p className="text-muted-foreground">
          查看您持有的艺术品代币
        </p>
      </div>

      {/* 代币卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  {tokenName || '艺术品代币'}
                </CardTitle>
                <CardDescription>
                  {tokenSymbol || 'ART'}
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono">
                {tokenSymbol || 'ART'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {balanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* 持有数量 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">持有数量</p>
                  <p className="text-3xl font-bold">
                    {tokenBalance ? parseFloat(formatUnits(tokenBalance, 18)).toFixed(4) : '0'}
                    <span className="text-lg font-normal text-muted-foreground ml-2">
                      {tokenSymbol || 'ART'}
                    </span>
                  </p>
                </div>

                {/* 估值 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">估值</p>
                  <p className="text-xl font-semibold text-green-600">
                    ≈ {holdingValue ? parseFloat(formatUnits(holdingValue, usdtDecimals)).toFixed(2) : '0'} USDT
                  </p>
                </div>

                {/* 代币价格 */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">单价</span>
                    <span>{priceUSDT ? formatUnits(priceUSDT, usdtDecimals) : '-'} USDT</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">总供应量</span>
                    <span>{totalSupply ? parseFloat(formatUnits(totalSupply, 18)).toLocaleString() : '-'}</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-4">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href="/marketplace">
                      购买更多
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <a
                      href={`${explorerUrl}/token/${ART_TOKEN_CONTRACT}?a=${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      区块浏览器
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 合约信息 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">合约信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">合约地址</span>
              <a
                href={`${explorerUrl}/address/${ART_TOKEN_CONTRACT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary hover:underline flex items-center gap-1"
              >
                {ART_TOKEN_CONTRACT.slice(0, 10)}...{ART_TOKEN_CONTRACT.slice(-8)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">网络</span>
              <span>{chainId === 56 ? 'BNB Smart Chain' : 'BNB Smart Chain Testnet'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
