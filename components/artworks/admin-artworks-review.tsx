'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Hash,
  Coins
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Artwork {
  id: string;
  title: string;
  description: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  token_symbol: string;
  token_name: string;
  total_supply: number;
  artist_name: string;
  artist_id: string;
  submitted_by: string;
  created_at: string;
}

export function AdminArtworksReview() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    artwork: Artwork | null;
    action: 'approve' | 'reject' | null;
  }>({
    open: false,
    artwork: null,
    action: null,
  });
  const [reviewNote, setReviewNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // TODO: Fetch artworks from Supabase
    // Simulating API call
    setTimeout(() => {
      setArtworks([]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleReview = async () => {
    if (!reviewDialog.artwork || !reviewDialog.action) return;

    setProcessing(true);
    try {
      // TODO: Call Supabase to update artwork status
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: reviewDialog.action === 'approve' ? '作品已通过' : '作品已拒绝',
        description: `《${reviewDialog.artwork.title}》已${reviewDialog.action === 'approve' ? '通过审核' : '被拒绝'}`,
      });

      // Close dialog and reset
      setReviewDialog({ open: false, artwork: null, action: null });
      setReviewNote('');

      // TODO: Refresh artworks list
    } catch (error) {
      toast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openReviewDialog = (artwork: Artwork, action: 'approve' | 'reject') => {
    setReviewDialog({ open: true, artwork, action });
    setReviewNote('');
  };

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
            已通过
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

  const pendingCount = artworks.filter(a => a.status === 'pending').length;
  const approvedCount = artworks.filter(a => a.status === 'approved').length;
  const rejectedCount = artworks.filter(a => a.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">作品审核中心</h1>
        <p className="text-muted-foreground">
          审核艺术家提交的作品，确保平台内容质量
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">待审核</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">已通过</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rejectedCount}</p>
                <p className="text-sm text-muted-foreground">已拒绝</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            待审核 ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved">
            已通过 ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            已拒绝 ({rejectedCount})
          </TabsTrigger>
          <TabsTrigger value="all">
            全部 ({artworks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredArtworks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <CheckCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  暂无{activeTab === 'pending' ? '待审核' : activeTab === 'approved' ? '已通过' : activeTab === 'rejected' ? '已拒绝' : ''}作品
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'pending' && '所有作品都已审核完毕'}
                  {activeTab !== 'pending' && '当前没有符合条件的作品'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredArtworks.map((artwork) => (
                <Card key={artwork.id}>
                  <div className="flex gap-6 p-6">
                    {/* Artwork Image */}
                    <div className="relative w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={artwork.image_url || '/placeholder-artwork.png'}
                        alt={artwork.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(artwork.status)}
                      </div>
                    </div>

                    {/* Artwork Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{artwork.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {artwork.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">艺术家:</span>
                          <span className="font-medium">{artwork.artist_name || '未知'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">提交时间:</span>
                          <span className="font-medium">
                            {new Date(artwork.created_at).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">代币符号:</span>
                          <span className="font-mono font-medium">{artwork.token_symbol}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">总供应量:</span>
                          <span className="font-medium">{artwork.total_supply.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="gap-1">
                          <Link href={`/artworks/${artwork.id}`}>
                            <Eye className="h-4 w-4" />
                            查看详情
                          </Link>
                        </Button>
                        {artwork.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1 bg-green-600 hover:bg-green-700"
                              onClick={() => openReviewDialog(artwork, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                              通过
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-1"
                              onClick={() => openReviewDialog(artwork, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                              拒绝
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => !processing && setReviewDialog({ ...reviewDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === 'approve' ? '通过作品审核' : '拒绝作品'}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog.action === 'approve'
                ? '确认通过此作品的审核？作品将会在平台上发布。'
                : '确认拒绝此作品？请填写拒绝原因。'}
            </DialogDescription>
          </DialogHeader>

          {reviewDialog.artwork && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-1">{reviewDialog.artwork.title}</p>
                <p className="text-sm text-muted-foreground">
                  作者: {reviewDialog.artwork.artist_name || '未知'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-note">
                  {reviewDialog.action === 'approve' ? '备注（可选）' : '拒绝原因 *'}
                </Label>
                <Textarea
                  id="review-note"
                  placeholder={
                    reviewDialog.action === 'approve'
                      ? '添加审核备注...'
                      : '请说明拒绝原因，帮助艺术家改进作品...'
                  }
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialog({ open: false, artwork: null, action: null })}
              disabled={processing}
            >
              取消
            </Button>
            <Button
              variant={reviewDialog.action === 'approve' ? 'default' : 'destructive'}
              onClick={handleReview}
              disabled={processing || (reviewDialog.action === 'reject' && !reviewNote.trim())}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {reviewDialog.action === 'approve' ? '确认通过' : '确认拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
