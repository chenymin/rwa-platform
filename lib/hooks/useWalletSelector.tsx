'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallets, usePrivy, ConnectedWallet } from '@privy-io/react-auth';

const SELECTED_WALLET_KEY = 'selected_wallet_address';

interface WalletSelectorContextType {
  // 所有可用的钱包
  wallets: ConnectedWallet[];
  // 当前选中的钱包
  selectedWallet: ConnectedWallet | undefined;
  // 选中的钱包地址
  selectedAddress: `0x${string}` | undefined;
  // 是否已连接
  isConnected: boolean;
  // 切换钱包
  selectWallet: (address: string) => void;
  // 钱包类型标签
  getWalletLabel: (wallet: ConnectedWallet) => string;
}

const WalletSelectorContext = createContext<WalletSelectorContextType | null>(null);

export function WalletSelectorProvider({ children }: { children: React.ReactNode }) {
  const { authenticated } = usePrivy();
  const { wallets: allWallets } = useWallets();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  // 只获取 Ethereum 钱包
  const wallets = authenticated
    ? allWallets.filter((w) => 'getEthereumProvider' in w) as ConnectedWallet[]
    : [];

  // 从 sessionStorage 恢复选择（只有在已认证时）
  useEffect(() => {
    if (authenticated) {
      const saved = sessionStorage.getItem(SELECTED_WALLET_KEY);
      if (saved) {
        setSelectedAddress(saved);
      }
    }
  }, [authenticated]);

  // 当用户退出登录或钱包列表变化时，清除选择
  useEffect(() => {
    if (!authenticated || wallets.length === 0) {
      setSelectedAddress(null);
      sessionStorage.removeItem(SELECTED_WALLET_KEY);
      return;
    }

    // 如果没有选择或选择的钱包不在列表中，自动选择第一个
    const currentSelection = wallets.find(
      (w) => w.address.toLowerCase() === selectedAddress?.toLowerCase()
    );

    if (!currentSelection) {
      // 优先选择嵌入式钱包，否则选择第一个
      const defaultWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
      if (defaultWallet) {
        setSelectedAddress(defaultWallet.address);
        sessionStorage.setItem(SELECTED_WALLET_KEY, defaultWallet.address);
      }
    }
  }, [authenticated, wallets, selectedAddress]);

  // 切换钱包
  const selectWallet = useCallback((address: string) => {
    setSelectedAddress(address);
    sessionStorage.setItem(SELECTED_WALLET_KEY, address);
  }, []);

  // 获取钱包标签
  const getWalletLabel = useCallback((wallet: ConnectedWallet) => {
    if (wallet.walletClientType === 'privy') {
      return '内置钱包';
    }
    // 获取钱包名称
    const meta = (wallet as any).meta;
    if (meta?.name) {
      return meta.name;
    }
    if (wallet.walletClientType) {
      return wallet.walletClientType.charAt(0).toUpperCase() + wallet.walletClientType.slice(1);
    }
    return '外部钱包';
  }, []);

  // 当前选中的钱包
  const selectedWallet = wallets.find(
    (w) => w.address.toLowerCase() === selectedAddress?.toLowerCase()
  );

  return (
    <WalletSelectorContext.Provider
      value={{
        wallets,
        selectedWallet,
        selectedAddress: selectedWallet?.address as `0x${string}` | undefined,
        isConnected: !!selectedWallet,
        selectWallet,
        getWalletLabel,
      }}
    >
      {children}
    </WalletSelectorContext.Provider>
  );
}

export function useWalletSelector() {
  const context = useContext(WalletSelectorContext);

  if (typeof window === 'undefined') {
    return {
      wallets: [],
      selectedWallet: undefined,
      selectedAddress: undefined,
      isConnected: false,
      selectWallet: () => {},
      getWalletLabel: () => '',
    } as WalletSelectorContextType;
  }

  if (!context) {
    throw new Error('useWalletSelector must be used within WalletSelectorProvider');
  }

  return context;
}
