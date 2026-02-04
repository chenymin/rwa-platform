'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Filter, TrendingUp, Loader2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { MintDialog } from '@/components/artworks/mint-dialog';

interface Artwork {
  id: string;
  title: string;
  description: string;
  token_name: string;
  token_symbol: string;
  total_supply: number;
  contract_address: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
}

// 动画基础样式（提取到组件外部避免重复创建）
const baseAnimationStyle = {
  animationName: 'fadeInUp',
  animationDuration: '0.6s',
  animationTimingFunction: 'ease-out',
  animationFillMode: 'forwards',
  opacity: 0,
} as const;

// 生成带延迟的动画样式
function getAnimationStyle(index: number) {
  return {
    ...baseAnimationStyle,
    animationDelay: `${index * 0.05}s`,
  };
}

export default function MarketplacePage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    fetchArtworks();
  }, []);

  async function fetchArtworks() {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch artworks:', error);
        return;
      }

      setArtworks(data || []);
    } catch (err) {
      console.error('Error fetching artworks:', err);
    } finally {
      setLoading(false);
    }
  }

  // 使用 useMemo 缓存过滤结果
  const filteredArtworks = useMemo(() => {
    return artworks.filter((artwork) => {
      const matchesSearch =
        artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artwork.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artwork.token_name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [artworks, searchQuery]);

  // 使用 useCallback 缓存事件处理器
  const handleTradeClick = useCallback((e: React.MouseEvent, artwork: Artwork) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedArtwork(artwork);
    setMintDialogOpen(true);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleMintDialogChange = useCallback((open: boolean) => {
    setMintDialogOpen(open);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background">
      {/* Hero Header */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 text-sm px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              艺术品交易市场
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              探索
              <span className="block mt-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                艺术世界
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              发现并投资世界级艺术品，每件作品都经过严格审核
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 border-y border-border/50 bg-card/30 backdrop-blur-sm sticky top-20 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索艺术品..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 h-12 bg-background/80 backdrop-blur-sm"
              />
            </div>

            <div className="flex gap-2 items-center">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => handleCategoryChange('all')}
                size="sm"
              >
                全部
              </Button>
              <Button
                variant={selectedCategory === 'trending' ? 'default' : 'outline'}
                onClick={() => handleCategoryChange('trending')}
                size="sm"
              >
                热门
              </Button>
              <Button
                variant={selectedCategory === 'new' ? 'default' : 'outline'}
                onClick={() => handleCategoryChange('new')}
                size="sm"
              >
                最新
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                筛选
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Artworks Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : filteredArtworks.length === 0 ? (
            <div className="text-center py-32">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-2xl font-bold mb-2">暂无艺术品</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? '未找到匹配的艺术品，请尝试其他关键词'
                  : '市场上还没有已批准的艺术品'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-muted-foreground">
                  找到 <span className="font-semibold text-foreground">{filteredArtworks.length}</span> 件艺术品
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredArtworks.map((artwork, index) => (
                  <Link
                    key={artwork.id}
                    href={`/marketplace/${artwork.id}`}
                    className="group"
                    style={getAnimationStyle(index)}
                  >
                    <Card className="overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 border-2 hover:border-primary/30 bg-card/80 backdrop-blur-sm h-full flex flex-col">
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        {artwork.image_url ? (
                          <Image
                            src={artwork.image_url}
                            alt={artwork.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-6xl">
                            🎨
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-primary/90 backdrop-blur-sm">
                            {artwork.token_symbol}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                          {artwork.title}
                        </h3>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                          {artwork.description || '暂无描述'}
                        </p>

                        <div className="space-y-2 pt-4 border-t border-border/50">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">总供应量</span>
                            <span className="font-semibold">
                              {artwork.total_supply.toLocaleString()}
                            </span>
                          </div>

                          {artwork.contract_address && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">合约地址</span>
                              <span className="font-mono text-xs">
                                {artwork.contract_address.slice(0, 6)}...
                                {artwork.contract_address.slice(-4)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" className="flex-1" size="sm">
                            查看详情
                          </Button>
                          <Button
                            className="flex-1 gap-1"
                            size="sm"
                            onClick={(e) => handleTradeClick(e, artwork)}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            交易
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Mint Dialog */}
      <MintDialog
        open={mintDialogOpen}
        onOpenChange={handleMintDialogChange}
        artworkTitle={selectedArtwork?.title}
      />
    </div>
  );
}
