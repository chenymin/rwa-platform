'use client';

import { useReadContract, useBalance } from 'wagmi';
import { useActiveWallet, ConnectedWallet } from '@privy-io/react-auth';
import { formatUnits } from 'viem';
import { ART_TOKEN_CONTRACT, ART_TOKEN_ABI, ERC20_ABI, CHAIN_ID } from '@/lib/contracts';

/**
 * 获取当前活跃的钱包地址
 * useActiveWallet 返回用户当前使用的钱包（登录时选择的钱包）
 */
export function useWalletAddress() {
  const { wallet } = useActiveWallet();

  // 检查是否是 Ethereum 钱包（有 getEthereumProvider 方法）
  const isEthereumWallet = wallet && 'getEthereumProvider' in wallet;
  const ethWallet = isEthereumWallet ? (wallet as ConnectedWallet) : undefined;
  const address = ethWallet?.address as `0x${string}` | undefined;
  const isConnected = !!ethWallet;

  return { address, isConnected, wallet: ethWallet };
}

/**
 * 获取 USDT 合约地址和相关数据
 */
export function useUsdtContract(userAddress?: `0x${string}`) {
  // 读取 USDT 合约地址
  const { data: usdtAddress } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'USDT',
    chainId: CHAIN_ID,
  });

  // 读取 USDT decimals
  const { data: decimals } = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: CHAIN_ID,
    query: {
      enabled: !!usdtAddress,
    },
  });

  // 读取用户 USDT 余额
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: !!usdtAddress && !!userAddress,
    },
  });

  // 读取用户对 ART_TOKEN_CONTRACT 的授权额度
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, ART_TOKEN_CONTRACT] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: !!usdtAddress && !!userAddress,
    },
  });

  // USDT decimals 默认为 6
  const usdtDecimals = decimals ?? 6;

  return {
    usdtAddress,
    decimals: usdtDecimals,
    balance,
    allowance,
    refetchBalance,
    refetchAllowance,
    // 格式化的余额
    formattedBalance: balance !== undefined
      ? parseFloat(formatUnits(balance, usdtDecimals)).toFixed(2)
      : undefined,
  };
}

/**
 * 获取艺术品代币合约数据
 */
export function useArtToken(userAddress?: `0x${string}`) {
  // 读取代币符号
  const { data: symbol } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'symbol',
    chainId: CHAIN_ID,
  });

  // 读取代币名称
  const { data: name } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'name',
    chainId: CHAIN_ID,
  });

  // 读取代币价格 (每个代币需要多少 USDT)
  const { data: priceUSDT } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'priceUSDT',
    chainId: CHAIN_ID,
  });

  // 读取销售状态
  const { data: saleActive } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'saleActive',
    chainId: CHAIN_ID,
  });

  // 读取已售出数量
  const { data: sold } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'sold',
    chainId: CHAIN_ID,
  });

  // 读取销售上限
  const { data: saleCap } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'SALE_CAP',
    chainId: CHAIN_ID,
  });

  // 读取总供应量
  const { data: totalSupply } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'totalSupply',
    chainId: CHAIN_ID,
  });

  // 读取用户代币余额
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: ART_TOKEN_CONTRACT,
    abi: ART_TOKEN_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    contractAddress: ART_TOKEN_CONTRACT,
    symbol,
    name,
    priceUSDT,
    saleActive,
    sold,
    saleCap,
    totalSupply,
    balance,
    refetchBalance,
    // 格式化的余额 (18 decimals)
    formattedBalance: balance !== undefined
      ? parseFloat(formatUnits(balance, 18)).toFixed(4)
      : undefined,
  };
}

/**
 * 获取钱包所有余额 (BNB + USDT)
 */
export function useWalletBalances() {
  const { address, isConnected } = useWalletAddress();

  // 读取 BNB 余额
  const { data: bnbBalance } = useBalance({
    address: address,
    chainId: CHAIN_ID,
    query: {
      enabled: !!address,
    },
  });

  // 读取 USDT 数据
  const usdt = useUsdtContract(address);

  // 读取 ART 代币数据
  const artToken = useArtToken(address);

  return {
    address,
    isConnected,
    bnb: {
      balance: bnbBalance?.value,
      symbol: bnbBalance?.symbol ?? 'BNB',
      decimals: bnbBalance?.decimals ?? 18,
      formatted: bnbBalance
        ? parseFloat(formatUnits(bnbBalance.value, bnbBalance.decimals)).toFixed(4)
        : undefined,
    },
    usdt: {
      address: usdt.usdtAddress,
      balance: usdt.balance,
      decimals: usdt.decimals,
      formatted: usdt.formattedBalance,
      allowance: usdt.allowance,
      refetchBalance: usdt.refetchBalance,
      refetchAllowance: usdt.refetchAllowance,
    },
    artToken: {
      address: artToken.contractAddress,
      balance: artToken.balance,
      symbol: artToken.symbol,
      name: artToken.name,
      formatted: artToken.formattedBalance,
      priceUSDT: artToken.priceUSDT,
      saleActive: artToken.saleActive,
      sold: artToken.sold,
      saleCap: artToken.saleCap,
      totalSupply: artToken.totalSupply,
      refetchBalance: artToken.refetchBalance,
    },
  };
}
