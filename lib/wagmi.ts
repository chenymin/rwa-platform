import { createConfig, http } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';

const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97');
const chain = chainId === 56 ? bsc : bscTestnet;

export const config = createConfig({
  chains: [bsc, bscTestnet],
  transports: {
    56: http(process.env.NEXT_PUBLIC_BSC_MAINNET_RPC!),
    97: http(process.env.NEXT_PUBLIC_BSC_RPC_URL!),
  },
});
