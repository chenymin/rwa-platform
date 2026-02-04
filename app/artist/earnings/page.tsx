'use client';

import { formatUnits } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, ExternalLink, Wallet } from 'lucide-react';
import Link from 'next/link';
import { ART_TOKEN_CONTRACT, CHAIN_ID, EXPLORER_URL } from '@/lib/contracts';
import { useWalletBalances } from '@/lib/hooks/useTokenData';

export default function EarningsPage() {
  const { address, isConnected, usdt, artToken } = useWalletBalances();

  // 计算持有价值 (USDT)
  const holdingValue = artToken.balance && artToken.priceUSDT
    ? (artToken.balance * artToken.priceUSDT) / BigInt(10 ** 18)
    : BigInt(0);

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
                  {artToken.name || '艺术品代币'}
                </CardTitle>
                <CardDescription>
                  {artToken.symbol || 'ART'}
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono">
                {artToken.symbol || 'ART'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {!artToken.formatted ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* 持有数量 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">持有数量</p>
                  <p className="text-3xl font-bold">
                    {artToken.formatted}
                    <span className="text-lg font-normal text-muted-foreground ml-2">
                      {artToken.symbol || 'ART'}
                    </span>
                  </p>
                </div>

                {/* 估值 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">估值</p>
                  <p className="text-xl font-semibold text-green-600">
                    ≈ {holdingValue ? parseFloat(formatUnits(holdingValue, usdt.decimals)).toFixed(2) : '0'} USDT
                  </p>
                </div>

                {/* 代币价格 */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">单价</span>
                    <span>{artToken.priceUSDT ? formatUnits(artToken.priceUSDT, usdt.decimals) : '-'} USDT</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-muted-foreground">总供应量</span>
                    <span>{artToken.totalSupply ? parseFloat(formatUnits(artToken.totalSupply, 18)).toLocaleString() : '-'}</span>
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
                      href={`${EXPLORER_URL}/token/${ART_TOKEN_CONTRACT}?a=${address}`}
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
                href={`${EXPLORER_URL}/address/${ART_TOKEN_CONTRACT}`}
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
              <span>{CHAIN_ID === 56 ? 'BNB Smart Chain' : 'BNB Smart Chain Testnet'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
