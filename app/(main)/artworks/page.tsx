'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { UserArtworksGuide } from '@/components/artworks/user-artworks-guide';
import { ArtistArtworksList } from '@/components/artworks/artist-artworks-list';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function ArtworksPage() {
  const { user, loading, hasRole } = useAuth();
  const { authenticated: privyAuthenticated, login } = usePrivy();

  // Loading state - initial load or syncing
  if (loading || (privyAuthenticated && !user)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          {/* Tabs skeleton */}
          <Skeleton className="h-10 w-64 mb-8" />
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
