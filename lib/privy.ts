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
    defaultChain: chainId === '56' ? bsc : bscTestnet,
    supportedChains: chainId === '56' ? [bsc] : [bscTestnet],
  },
};
