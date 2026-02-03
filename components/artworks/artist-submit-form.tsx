'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, Edit } from 'lucide-react';

interface ArtistProfile {
  id: string;
  artist_name: string;
  artist_bio: string | null;
  verified_artist: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  token_name?: string;
  token_symbol?: string;
  total_supply?: string;
  image?: string;
  certificate?: string;
  general?: string;
}

export function ArtistSubmitForm() {
  const router = useRouter();
  const { user, authenticated, loading: authLoading, isArtist } = useAuth();
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form field states for character counting
  const [titleLength, setTitleLength] = useState(0);
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [tokenNameLength, setTokenNameLength] = useState(0);

  useEffect(() => {
    async function fetchArtistProfile() {
      if (!authenticated || !user || authLoading) {
        return;
      }

      if (!isArtist) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Restore session from localStorage
        const cachedSession = localStorage.getItem('supabase_session');
        if (cachedSession) {
          const session = JSON.parse(cachedSession);
          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
        }

        const { data, error } = await supabase
          .from('artists')
          .select('id, artist_name, artist_bio, verified_artist')
          .eq('privy_user_id', user.privy_user_id)
          .single();

        if (error) {
          console.error('Error fetching artist profile:', error);
          setErrors({ general: '无法加载艺术家信息' });
        } else {
          setArtistProfile(data);
        }
      } catch (error) {
        console.error('Error:', error);
        setErrors({ general: '加载艺术家信息时出错' });
      } finally {
        setLoading(false);
      }
    }

    fetchArtistProfile();
  }, [authenticated, user, authLoading, isArtist]);

  // Validate form field
  function validateField(name: string, value: string | File | null): string | undefined {
    switch (name) {
      case 'title':
        if (typeof value === 'string') {
          if (value.length < 3) return '标题至少需要3个字符';
          if (value.length > 200) return '标题最多200个字符';
        }
        break;
      case 'description':
        if (typeof value === 'string') {
          if (value.length < 10) return '描述至少需要10个字符';
          if (value.length > 2000) return '描述最多2000个字符';
        }
        break;
      case 'token_name':
        if (typeof value === 'string') {
          if (value.length < 3) return '代币名称至少需要3个字符';
          if (value.length > 100) return '代币名称最多100个字符';
        }
        break;
      case 'token_symbol':
        if (typeof value === 'string') {
          if (value.length < 2) return '代币符号至少需要2个字符';
          if (value.length > 10) return '代币符号最多10个字符';
          if (!/^[A-Z0-9]+$/.test(value)) return '代币符号只能包含大写字母和数字';
        }
        break;
      case 'total_supply':
        if (typeof value === 'string') {
          const num = parseInt(value);
          if (isNaN(num)) return '请输入有效数字';
          if (num < 100) return '总供应量至少为100';
          if (num > 10000000) return '总供应量最多为10,000,000';
        }
        break;
      case 'image':
        if (value instanceof File) {
          const maxSize = 10 * 1024 * 1024; // 10MB
          const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
          if (value.size > maxSize) return '图片大小不能超过10MB';
          if (!allowedTypes.includes(value.type)) return '只支持 JPG, PNG, WebP 格式';
        }
        break;
      case 'certificate':
        if (value instanceof File) {
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (value.size > maxSize) return '证书文件不能超过5MB';
          if (value.type !== 'application/pdf') return '只支持 PDF 格式';
        }
        break;
    }
    return undefined;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const newErrors: FormErrors = {};

    // Validate all fields
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tokenName = formData.get('token_name') as string;
    const tokenSymbol = formData.get('token_symbol') as string;
    const totalSupply = formData.get('total_supply') as string;
    const image = formData.get('image') as File;
    const certificate = formData.get('certificate') as File;

    newErrors.title = validateField('title', title);
    newErrors.description = validateField('description', description);
    newErrors.token_name = validateField('token_name', tokenName);
    newErrors.token_symbol = validateField('token_symbol', tokenSymbol);
    newErrors.total_supply = validateField('total_supply', totalSupply);

    if (image && image.size > 0) {
      newErrors.image = validateField('image', image);
    } else {
      newErrors.image = '请选择作品图片';
    }

    if (certificate && certificate.size > 0) {
      newErrors.certificate = validateField('certificate', certificate);
    }

    // Filter out undefined errors
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([_, v]) => v !== undefined)
    ) as FormErrors;

    if (Object.keys(filteredErrors).length > 0) {
      setErrors(filteredErrors);
      setSubmitting(false);
      return;
    }

    try {
      // Get session from localStorage
      const cachedSession = localStorage.getItem('supabase_session');
      if (!cachedSession) {
        setErrors({ general: '会话已过期，请重新登录' });
        setSubmitting(false);
        return;
      }

      const session = JSON.parse(cachedSession);

      const response = await fetch('/api/artworks', {
        method: 'POST',
        headers: {
          'x-supabase-session': JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({ general: result.error || '提交失败，请重试' });
        setSubmitting(false);
        return;
      }

      // Success - redirect to artworks page
      router.push('/artworks');
    } catch (error) {
      console.error('Error:', error);
      setErrors({ general: '提交失败，请重试' });
      setSubmitting(false);
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Not authenticated
  if (!authenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>需要登录</CardTitle>
          <CardDescription>
            请先连接钱包以发布作品
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Not an artist
  if (!isArtist || !artistProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>需要艺术家身份</CardTitle>
          <CardDescription>
            您需要先申请成为艺术家才能发布作品
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/apply-artist">
            <Button>申请成为艺术家</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Artist Profile Section - Read Only */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>艺术家信息</CardTitle>
              <CardDescription>您的艺术家资料</CardDescription>
            </div>
            <Link href="/artist/profile/edit">
              <Button type="button" variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                编辑资料
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-base font-semibold">{artistProfile.artist_name}</Label>
              {artistProfile.verified_artist && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  已认证
                </Badge>
              )}
            </div>
            {artistProfile.artist_bio && (
              <p className="text-sm text-muted-foreground">{artistProfile.artist_bio}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Artwork Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>作品信息</CardTitle>
          <CardDescription>填写您的艺术品详细信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.general && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{errors.general}</p>
            </div>
          )}

          <div>
            <Label htmlFor="title">作品标题 *</Label>
            <Input
              id="title"
              name="title"
              required
              maxLength={200}
              onChange={(e) => setTitleLength(e.target.value.length)}
              className={errors.title ? 'border-destructive' : ''}
            />
            <div className="flex justify-between mt-1">
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              <p className="text-xs text-muted-foreground ml-auto">{titleLength}/200</p>
            </div>
          </div>

          <div>
            <Label htmlFor="description">作品描述 *</Label>
            <Textarea
              id="description"
              name="description"
              required
              rows={4}
              maxLength={2000}
              onChange={(e) => setDescriptionLength(e.target.value.length)}
              className={errors.description ? 'border-destructive' : ''}
            />
            <div className="flex justify-between mt-1">
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
              <p className="text-xs text-muted-foreground ml-auto">{descriptionLength}/2000</p>
            </div>
          </div>

          <div>
            <Label htmlFor="image">作品图片 *</Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className={errors.image ? 'border-destructive' : ''}
            />
            <div className="flex justify-between mt-1">
              {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
              <p className="text-xs text-muted-foreground ml-auto">最大 10MB, 支持 JPG, PNG, WebP</p>
            </div>
          </div>

          <div>
            <Label htmlFor="certificate">证书/来源证明（可选）</Label>
            <Input
              id="certificate"
              name="certificate"
              type="file"
              accept="application/pdf"
              className={errors.certificate ? 'border-destructive' : ''}
            />
            <div className="flex justify-between mt-1">
              {errors.certificate && <p className="text-xs text-destructive">{errors.certificate}</p>}
              <p className="text-xs text-muted-foreground ml-auto">最大 5MB, PDF 格式</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Parameters Section */}
      <Card>
        <CardHeader>
          <CardTitle>代币参数</CardTitle>
          <CardDescription>设置您的艺术品代币化参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="token_name">代币名称 *</Label>
            <Input
              id="token_name"
              name="token_name"
              required
              maxLength={100}
              placeholder="例如: 星空之夜份额"
              onChange={(e) => setTokenNameLength(e.target.value.length)}
              className={errors.token_name ? 'border-destructive' : ''}
            />
            <div className="flex justify-between mt-1">
              {errors.token_name && <p className="text-xs text-destructive">{errors.token_name}</p>}
              <p className="text-xs text-muted-foreground ml-auto">{tokenNameLength}/100</p>
            </div>
          </div>

          <div>
            <Label htmlFor="token_symbol">代币符号 *</Label>
            <Input
              id="token_symbol"
              name="token_symbol"
              required
              maxLength={10}
              placeholder="例如: STAR"
              className={errors.token_symbol ? 'border-destructive' : ''}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
            {errors.token_symbol && <p className="text-xs text-destructive mt-1">{errors.token_symbol}</p>}
            <p className="text-xs text-muted-foreground mt-1">2-10个字符，仅大写字母和数字</p>
          </div>

          <div>
            <Label htmlFor="total_supply">总供应量 *</Label>
            <Input
              id="total_supply"
              name="total_supply"
              type="number"
              required
              min="100"
              max="10000000"
              placeholder="10000"
              className={errors.total_supply ? 'border-destructive' : ''}
            />
            {errors.total_supply && <p className="text-xs text-destructive mt-1">{errors.total_supply}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              您将获得 80% 的代币，平台保留 20%（最小值: 100，最大值: 10,000,000）
            </p>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            提交中...
          </>
        ) : (
          '提交审核'
        )}
      </Button>
    </form>
  );
}
