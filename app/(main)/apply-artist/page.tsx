'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Palette, Loader2 } from 'lucide-react';

const ART_SPECIALIZATIONS = [
  '数字艺术',
  '绘画',
  '摄影',
  '雕塑',
  '3D艺术',
  '插画',
  '概念艺术',
  '抽象艺术',
  '街头艺术',
  '传统艺术',
];

export default function ApplyArtistPage() {
  const router = useRouter();
  const { user, loading: authLoading, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    artistName: '',
    displayName: '',
    bio: '',
    portfolioUrl: '',
    websiteUrl: '',
    twitter: '',
    instagram: '',
    discord: '',
  });

  const handleSpecializationToggle = (spec: string) => {
    setSelectedSpecializations(prev =>
      prev.includes(spec)
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('请先登录');
      return;
    }

    if (!formData.artistName.trim()) {
      setError('请填写艺术家名称');
      return;
    }

    if (selectedSpecializations.length === 0) {
      setError('请至少选择一个艺术专长');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const socialMedia: Record<string, string> = {};
      if (formData.twitter) socialMedia.twitter = formData.twitter;
      if (formData.instagram) socialMedia.instagram = formData.instagram;
      if (formData.discord) socialMedia.discord = formData.discord;

      const response = await fetch('/api/artists/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artistName: formData.artistName,
          displayName: formData.displayName || formData.artistName,
          bio: formData.bio,
          portfolioUrl: formData.portfolioUrl,
          websiteUrl: formData.websiteUrl,
          socialMedia,
          specialization: selectedSpecializations,
          privyUserId: user.privy_user_id, // 传递 Privy user ID
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '申请失败');
      }

      // 申请成功，跳转到作品管理页面
      router.push('/artworks');
    } catch (err) {
      console.error('Application error:', err);
      setError(err instanceof Error ? err.message : '申请失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <p className="text-muted-foreground mb-6">
            您需要登录才能申请成为艺术家
          </p>
          <Button onClick={() => router.push('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  if (hasRole('artist')) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Palette className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-4">您已经是艺术家</h1>
          <p className="text-muted-foreground mb-6">
            您已经拥有艺术家权限，可以开始发布作品了
          </p>
          <Button onClick={() => router.push('/artworks')}>
            前往我的作品
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">申请成为艺术家</h1>
          <p className="text-muted-foreground">
            填写以下信息，成为平台认证艺术家，开始发布和销售您的艺术作品
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 艺术家名称 */}
          <div className="space-y-2">
            <Label htmlFor="artistName">
              艺术家名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="artistName"
              value={formData.artistName}
              onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
              placeholder="您的艺术家名称"
              required
            />
          </div>

          {/* 显示名称 */}
          <div className="space-y-2">
            <Label htmlFor="displayName">显示名称（可选）</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="在平台上显示的名称"
            />
            <p className="text-sm text-muted-foreground">
              如果留空，将使用艺术家名称
            </p>
          </div>

          {/* 艺术家简介 */}
          <div className="space-y-2">
            <Label htmlFor="bio">艺术家简介</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="介绍您的艺术风格、创作理念和经历..."
              rows={6}
            />
          </div>

          {/* 艺术专长 */}
          <div className="space-y-2">
            <Label>
              艺术专长 <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {ART_SPECIALIZATIONS.map((spec) => (
                <Badge
                  key={spec}
                  variant={selectedSpecializations.includes(spec) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleSpecializationToggle(spec)}
                >
                  {spec}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              选择您擅长的艺术类别（可多选）
            </p>
          </div>

          {/* 作品集链接 */}
          <div className="space-y-2">
            <Label htmlFor="portfolioUrl">作品集链接</Label>
            <Input
              id="portfolioUrl"
              type="url"
              value={formData.portfolioUrl}
              onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* 个人网站 */}
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">个人网站</Label>
            <Input
              id="websiteUrl"
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* 社交媒体 */}
          <div className="space-y-4">
            <Label>社交媒体账号（可选）</Label>

            <div className="space-y-2">
              <Label htmlFor="twitter" className="text-sm font-normal">
                Twitter/X
              </Label>
              <Input
                id="twitter"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                placeholder="@your_handle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram" className="text-sm font-normal">
                Instagram
              </Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@your_handle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discord" className="text-sm font-normal">
                Discord
              </Label>
              <Input
                id="discord"
                value={formData.discord}
                onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                placeholder="username#1234"
              />
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交申请'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
