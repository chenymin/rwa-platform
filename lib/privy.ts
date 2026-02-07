import { bsc, bscTestnet } from 'viem/chains';

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'demo-app-id';
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '97';

export const privyConfig = {
  appId: privyAppId,
  config: {
    loginMethods: ['wallet', 'email'] as ('wallet' | 'email')[],
    appearance: {
      theme: 'light' as const,
      accentColor: '#F0B90B' as `#${string}`, // Binance yellow
      logo: '/logo.png',
    },
    embeddedWallets: {
      ethereum: {
        createOnLogin: 'users-without-wallets' as const, // 为邮箱登录用户自动创建嵌入式钱包
      },
    },
    defaultChain: chainId === '56' ? bsc : bscTestnet,
    supportedChains: chainId === '56' ? [bsc] : [bscTestnet],
  },
};
