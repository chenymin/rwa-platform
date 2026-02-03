'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, ImagePlus, Coins, TrendingUp, Shield, Sparkles } from 'lucide-react';

export function UserArtworksGuide() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Palette className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">成为艺术家，发布你的作品</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          加入我们的创作者社区，将你的艺术作品转化为数字资产，获得应有的收益和认可
        </p>
        <Button asChild size="lg" className="gap-2">
          <Link href="/apply-artist">
            <Sparkles className="h-5 w-5" />
            立即申请成为艺术家
          </Link>
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <ImagePlus className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>发布艺术作品</CardTitle>
            </div>
            <CardDescription>
              上传你的原创艺术作品，包括数字绘画、摄影、3D作品等多种形式
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>铸造 NFT 代币</CardTitle>
            </div>
            <CardDescription>
              将你的作品转化为区块链上的 NFT，确保版权和稀缺性
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>获得收益</CardTitle>
            </div>
            <CardDescription>
              通过作品销售获得收益，平台仅收取少量手续费，大部分收益归你所有
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>版权保护</CardTitle>
            </div>
            <CardDescription>
              基于区块链的版权追溯系统，保护你的创作权益和知识产权
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>如何开始？</CardTitle>
          <CardDescription>只需简单几步，即可开启你的创作之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">提交申请</h3>
                <p className="text-sm text-muted-foreground">
                  填写艺术家信息，上传你的作品集和认证材料
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">等待审核</h3>
                <p className="text-sm text-muted-foreground">
                  我们的团队会在 1-3 个工作日内审核你的申请
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">开始创作</h3>
                <p className="text-sm text-muted-foreground">
                  审核通过后，你就可以发布作品、铸造 NFT 并开始销售
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t text-center">
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/apply-artist">
                开始申请
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats or Social Proof (Optional) */}
      <div className="mt-12 grid grid-cols-3 gap-6 text-center">
        <div>
          <div className="text-3xl font-bold text-primary mb-2">500+</div>
          <div className="text-sm text-muted-foreground">认证艺术家</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-primary mb-2">2,000+</div>
          <div className="text-sm text-muted-foreground">发布作品</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-primary mb-2">¥500万+</div>
          <div className="text-sm text-muted-foreground">累计交易额</div>
        </div>
      </div>
    </div>
  );
}
