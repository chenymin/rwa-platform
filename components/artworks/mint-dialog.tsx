'use client';

import { useState, useCallback } from 'react';
import { parseUnits, formatUnits, encodeFunctionData } from 'viem';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ART_TOKEN_CONTRACT, ART_TOKEN_ABI, ERC20_ABI, EXPLORER_URL, CHAIN_ID } from '@/lib/contracts';
import { useWalletAddress, useArtToken, useUsdtContract } from '@/lib/hooks/useTokenData';

interface MintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artworkTitle?: string;
}

export function MintDialog({ open, onOpenChange, artworkTitle }: MintDialogProps) {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'approve' | 'mint' | 'success'>('input');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { address, isConnected, wallet } = useWalletAddress();
  const artToken = useArtToken(address);
  const usdt = useUsdtContract(address);

  const usdtDec = usdt.decimals;
  const amountBigInt = amount ? parseUnits(amount, usdtDec) : BigInt(0);

  // 计算可获得的代币数量: (amountUSDT * 1e18) / priceUSDT
  const tokensToReceive = artToken.priceUSDT && amountBigInt > 0
    ? (amountBigInt * BigInt(10 ** 18)) / artToken.priceUSDT
    : BigInt(0);

  // 检查是否需要 approve
  const needsApproval = usdt.allowance !== undefined && amountBigInt > usdt.allowance;

  // 获取 provider 并确保网络正确
  const getProvider = useCallback(async () => {
    if (!wallet) throw new Error('钱包未连接');

    // 使用 Privy 的 switchChain 方法切换网络（适用于所有钱包类型）
    try {
      await wallet.switchChain(CHAIN_ID);
    } catch (err) {
      console.warn('Network switch failed:', err);
      // 某些情况下 switchChain 可能失败，但交易仍可能成功
    }

    const provider = await wallet.getEthereumProvider();
    const accounts = await provider.request({ method: 'eth_accounts' }) as string[];

    return { provider, walletAddress: accounts[0] };
  }, [wallet]);

  // 发送交易
  const sendTransaction = useCallback(async (
    to: `0x${string}`,
    data: `0x${string}`
  ): Promise<`0x${string}`> => {
    const { provider, walletAddress } = await getProvider();

    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{ from: walletAddress, to, data }],
    });

    return hash as `0x${string}`;
  }, [getProvider]);

  // 等待交易确认
  const waitForTransaction = useCallback(async (hash: `0x${string}`) => {
    const { provider } = await getProvider();
    const maxAttempts = 60;
    const interval = 3000;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [hash],
        }) as { status: string } | null;

        if (receipt) {
          if (receipt.status === '0x0') {
            throw new Error('交易执行失败，请检查余额或授权额度');
          }
          return receipt;
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('交易执行失败')) {
          throw err;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`交易确认超时，请在区块浏览器查看: ${hash}`);
  }, [getProvider]);

  // 处理 approve
  const handleApprove = async () => {
    if (!usdt.usdtAddress || !address) return;

    try {
      setError(null);
      setIsProcessing(true);
      setStep('approve');

      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [ART_TOKEN_CONTRACT, amountBigInt],
      });

      const hash = await sendTransaction(usdt.usdtAddress, data);
      setTxHash(hash);

      await waitForTransaction(hash);
      await usdt.refetchAllowance();
      await handleMintInternal();
    } catch (err: unknown) {
      console.error('Approve error:', err);
      setError(err instanceof Error ? err.message : '授权失败');
      setStep('input');
    } finally {
      setIsProcessing(false);
    }
  };

  // 内部 mint 函数
  const handleMintInternal = async () => {
    try {
      setStep('mint');

      const data = encodeFunctionData({
        abi: ART_TOKEN_ABI,
        functionName: 'mint',
        args: [amountBigInt],
      });

      const hash = await sendTransaction(ART_TOKEN_CONTRACT, data);
      setTxHash(hash);

      await waitForTransaction(hash);

      await Promise.all([
        usdt.refetchBalance(),
        artToken.refetchBalance()
      ]);
      setStep('success');
    } catch (err: unknown) {
      console.error('Mint error:', err);
      setError(err instanceof Error ? err.message : '购买失败');
      setStep('input');
    }
  };

  // 处理直接 mint (不需要 approve)
  const handleMint = async () => {
    if (!address) return;

    try {
      setError(null);
      setIsProcessing(true);
      await handleMintInternal();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setStep('input');
    setTxHash(null);
    setError(null);
    setIsProcessing(false);
    onOpenChange(false);
  };

  const formatBalance = (balance: bigint | undefined, dec: number) => {
    if (balance === undefined) return '0';
    return parseFloat(formatUnits(balance, dec)).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>购买艺术品代币</DialogTitle>
          <DialogDescription>
            {artworkTitle && <span className="font-medium">{artworkTitle}</span>}
            <br />
            使用 USDT 购买 {artToken.symbol || 'ART'} 代币
          </DialogDescription>
        </DialogHeader>

        {!isConnected ? (
          <div className="py-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-muted-foreground">请先连接钱包</p>
          </div>
        ) : artToken.saleActive === undefined ? (
          <div className="py-6 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : artToken.saleActive === false ? (
          <div className="py-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-muted-foreground">销售尚未开始</p>
          </div>
        ) : step === 'success' ? (
          <div className="py-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="font-semibold mb-2">购买成功!</p>
            <p className="text-sm text-muted-foreground">
              你已成功购买 {formatUnits(tokensToReceive, 18)} {artToken.symbol || 'ART'} 代币
            </p>
            {txHash && (
              <a
                href={`${EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                查看交易详情
              </a>
            )}
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {/* 销售信息 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">代币价格</p>
                <p className="font-semibold">
                  {artToken.priceUSDT ? formatUnits(artToken.priceUSDT, usdtDec) : '-'} USDT
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground">已售出</p>
                <p className="font-semibold">
                  {artToken.sold ? formatUnits(artToken.sold, 18) : '0'} / {artToken.saleCap ? formatUnits(artToken.saleCap, 18) : '-'}
                </p>
              </div>
            </div>

            {/* USDT 余额 */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">你的 USDT 余额</span>
              <span className="font-medium">{formatBalance(usdt.balance, usdtDec)} USDT</span>
            </div>

            {/* 输入金额 */}
            <div className="space-y-2">
              <Label htmlFor="amount">购买金额 (USDT)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="输入 USDT 数量"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={step !== 'input'}
                min="0"
                step="0.01"
              />
            </div>

            {/* 预计获得代币 */}
            {amount && parseFloat(amount) > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-muted-foreground">预计获得</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {parseFloat(formatUnits(tokensToReceive, 18)).toFixed(4)} {artToken.symbol || 'ART'}
                </p>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'success' ? (
            <Button onClick={handleClose}>完成</Button>
          ) : !isConnected || artToken.saleActive !== true ? (
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
          ) : step === 'input' ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              {needsApproval ? (
                <Button
                  onClick={handleApprove}
                  disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
                >
                  授权 USDT
                </Button>
              ) : (
                <Button
                  onClick={handleMint}
                  disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
                >
                  购买
                </Button>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {step === 'approve' ? '授权中...' : '购买中...'}
              </Button>
              {txHash && (
                <a
                  href={`${EXPLORER_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-center text-primary hover:underline"
                >
                  {step === 'approve' ? '查看授权交易' : '查看购买交易'}
                </a>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
