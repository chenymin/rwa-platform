import { createConfig, http } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';

const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97');
const chain = chainId === 56 ? bsc : bscTestnet;

// Provide fallback RPC URLs if env vars are not set
const bscMainnetRpc = process.env.NEXT_PUBLIC_BSC_MAINNET_RPC || 'https://bsc-dataseed1.binance.org';
const bscTestnetRpc = process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';

export const config = createConfig({
  chains: [bsc, bscTestnet],
  transports: {
    56: http(bscMainnetRpc),
    97: http(bscTestnetRpc),
  },
});
