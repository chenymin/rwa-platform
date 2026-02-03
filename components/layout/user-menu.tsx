'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  User,
  Heart,
  ShoppingCart,
  Wallet,
  Settings,
  Palette,
  ImagePlus,
  BarChart3,
  DollarSign,
  ChevronDown,
} from 'lucide-react';

export function UserMenu() {
  const { user, authenticated, loading, hasRole } = useAuth();

  // 未登录或加载中
  if (!authenticated || loading || !user) {
    return null;
  }

  const isArtist = hasRole('artist');
  const isUser = hasRole('user');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          个人中心
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {isArtist ? '艺术家中心' : '个人中心'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* 艺术家菜单 - 包含所有功能 */}
        {isArtist ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/artist/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                艺术家主页
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/artworks" className="flex items-center gap-2 cursor-pointer">
                <Palette className="h-4 w-4" />
                我的作品
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/artist/submit" className="flex items-center gap-2 cursor-pointer text-primary font-medium">
                <ImagePlus className="h-4 w-4" />
                发布新作品
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/artist/analytics" className="flex items-center gap-2 cursor-pointer">
                <BarChart3 className="h-4 w-4" />
                数据统计
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/artist/earnings" className="flex items-center gap-2 cursor-pointer">
                <DollarSign className="h-4 w-4" />
                收益管理
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/favorites" className="flex items-center gap-2 cursor-pointer">
                <Heart className="h-4 w-4" />
                我的收藏
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/orders" className="flex items-center gap-2 cursor-pointer">
                <ShoppingCart className="h-4 w-4" />
                我的订单
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/wallet" className="flex items-center gap-2 cursor-pointer">
                <Wallet className="h-4 w-4" />
                钱包管理
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                账户设置
              </Link>
            </DropdownMenuItem>
          </>
        ) : isUser ? (
          /* 普通用户菜单 */
          <>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                我的主页
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/favorites" className="flex items-center gap-2 cursor-pointer">
                <Heart className="h-4 w-4" />
                我的收藏
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/orders" className="flex items-center gap-2 cursor-pointer">
                <ShoppingCart className="h-4 w-4" />
                我的订单
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/wallet" className="flex items-center gap-2 cursor-pointer">
                <Wallet className="h-4 w-4" />
                钱包管理
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                账户设置
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/apply-artist" className="flex items-center gap-2 cursor-pointer text-primary font-medium">
                <Palette className="h-4 w-4" />
                申请成为艺术家
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
