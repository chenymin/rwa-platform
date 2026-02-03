import { bsc, bscTestnet } from 'viem/chains';

export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  config: {
    loginMethods: ['wallet', 'email'],
    appearance: {
      theme: 'light' as const,
      accentColor: '#F0B90B', // Binance yellow
      logo: '/logo.png',
    },
    defaultChain: process.env.NEXT_PUBLIC_CHAIN_ID === '56' ? bsc : bscTestnet,
    supportedChains: process.env.NEXT_PUBLIC_CHAIN_ID === '56' ? [bsc] : [bscTestnet],
  },
};
