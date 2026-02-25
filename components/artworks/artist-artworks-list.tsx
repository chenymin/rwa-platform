'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImagePlus, Eye, Edit, MoreVertical, Clock, CheckCircle, XCircle } from 'lucide-react';
import { CardGridSkeleton } from '@/components/skeletons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Artwork {
  id: string;
  title: string;
  description: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  token_symbol: string;
  total_supply: number;
  created_at: string;
}

export function ArtistArtworksList() {
  const { user } = useAuth();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function fetchArtworks() {
      if (!user) {
        setLoading(false);
        return;
      }

      console.log('🔍 [ArtistArtworksList] Fetching artworks...', new Date().toISOString());

      try {
        setLoading(true);
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // ✅ OPTIMIZATION: Session is already set by useAuth hook
        // No need to setSession again here - it causes unnecessary /auth/v1/user request

        const { data, error } = await supabase
          .from('artworks')
          .select('*')
          .eq('submitted_by', user.privy_user_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to fetch artworks:', error);
          setArtworks([]);
        } else {
          setArtworks(data || []);
        }
      } catch (err) {
        console.error('Error fetching artworks:', err);
        setArtworks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchArtworks();
  }, [user]);

  const getStatusBadge = (status: Artwork['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            待审核
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            已发布
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            已拒绝
          </Badge>
        );
    }
  };

  const filteredArtworks = artworks.filter((artwork) => {
    if (activeTab === 'all') return true;
    return artwork.status === activeTab;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-32 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        {/* Cards skeleton */}
        <CardGridSkeleton count={6} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">我的作品</h1>
          <p className="text-muted-foreground">
            管理你的艺术作品和 NFT 代币
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/artist/submit">
            <ImagePlus className="h-5 w-5" />
            发布新作品
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="all">
            全部 ({artworks.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            待审核 ({artworks.filter(a => a.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            已发布 ({artworks.filter(a => a.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            已拒绝 ({artworks.filter(a => a.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredArtworks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ImagePlus className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === 'all' ? '还没有作品' : `没有${activeTab === 'pending' ? '待审核' : activeTab === 'approved' ? '已发布' : '已拒绝'}的作品`}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  开始发布你的第一件艺术作品吧
                </p>
                <Button asChild className="gap-2">
                  <Link href="/artist/submit">
                    <ImagePlus className="h-4 w-4" />
                    发布新作品
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArtworks.map((artwork) => (
                <Card key={artwork.id} className="overflow-hidden">
                  <CardHeader className="p-0">
                    <div className="relative aspect-square bg-muted">
                      <Image
                        src={artwork.image_url || '/placeholder-artwork.png'}
                        alt={artwork.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(artwork.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {artwork.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {artwork.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">代币符号</span>
                      <span className="font-mono font-semibold">{artwork.token_symbol}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">总供应量</span>
                      <span className="font-semibold">{artwork.total_supply.toLocaleString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 gap-1">
                      <Link href={`/artworks/${artwork.id}`}>
                        <Eye className="h-4 w-4" />
                        查看
                      </Link>
                    </Button>
                    {artwork.status !== 'approved' && (
                      <Button asChild variant="outline" size="sm" className="flex-1 gap-1">
                        <Link href={`/artist/artworks/${artwork.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          编辑
                        </Link>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/artworks/${artwork.id}`}>查看详情</Link>
                        </DropdownMenuItem>
                        {artwork.status !== 'approved' && (
                          <DropdownMenuItem asChild>
                            <Link href={`/artist/artworks/${artwork.id}/edit`}>编辑作品</Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive">
                          删除作品
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
