'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import { privyConfig } from '@/lib/privy';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { WalletSelectorProvider } from '@/lib/hooks/useWalletSelector';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  try {
    return (
      <PrivyProvider appId={privyConfig.appId} config={privyConfig.config}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <WalletSelectorProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </WalletSelectorProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </PrivyProvider>
    );
  } catch (error) {
    console.error('Provider initialization error:', error);
    return <>{children}</>;
  }
}
