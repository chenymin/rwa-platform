'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/lib/hooks/useAuth';
import { UserArtworksGuide } from '@/components/artworks/user-artworks-guide';
import { ArtistArtworksList } from '@/components/artworks/artist-artworks-list';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function ArtworksPage() {
  const { user, authenticated: supabaseAuthenticated, loading, hasRole } = useAuth();
  const { authenticated: privyAuthenticated, login } = usePrivy();

  // Loading state - initial load or syncing
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // User logged in with Privy but Supabase user not synced yet
  if (privyAuthenticated && !user) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground mb-2">正在同步账户信息...</p>
          <p className="text-xs text-muted-foreground">首次登录可能需要几秒钟</p>
        </div>
      </div>
    );
  }

  // Not authenticated with Privy - show login prompt
  if (!privyAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">请先登录</h1>
          <p className="text-muted-foreground mb-8">
            登录后即可查看和管理作品
          </p>
          <Button onClick={login} size="lg">
            立即登录
          </Button>
        </div>
      </div>
    );
  }

  // User is authenticated and synced - render based on role
  if (user) {
    const isArtist = hasRole('artist');
    const isUser = hasRole('user');

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Show artist list if user has artist role */}
        {isArtist && <ArtistArtworksList />}
        {/* Show user guide only if user doesn't have artist role */}
        {!isArtist && isUser && <UserArtworksGuide />}
      </div>
    );
  }

  // Fallback - should not reach here
  return null;
}
