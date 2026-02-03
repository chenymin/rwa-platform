import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 获取请求数据（先读取，因为只能读一次）
    const body = await request.json();
    const {
      artistName,
      displayName,
      bio,
      portfolioUrl,
      websiteUrl,
      socialMedia,
      specialization,
      privyUserId, // 从前端传递的 Privy user ID
    } = body;

    // 验证用户已登录 - 尝试从 Supabase Auth session 获取
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    let user = null;

    if (session && !sessionError) {
      // 如果有 Supabase session，使用 auth_user_id 查询
      const userId = session.user.id;
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('privy_user_id, roles, wallet_address, email')
        .eq('auth_user_id', userId)
        .single();

      if (!userError && userData) {
        user = userData;
      }
    }

    // 如果没有找到用户，尝试使用 Privy user ID
    if (!user && privyUserId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('privy_user_id, roles, wallet_address, email')
        .eq('privy_user_id', privyUserId)
        .single();

      if (!userError && userData) {
        user = userData;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: '用户验证失败，请先登录' },
        { status: 401 }
      );
    }

    // 检查用户是否已经是艺术家
    if (user.roles && user.roles.includes('artist')) {
      return NextResponse.json(
        { error: '您已经是艺术家' },
        { status: 400 }
      );
    }

    // 验证必填字段
    if (!artistName || !specialization || specialization.length === 0) {
      return NextResponse.json(
        { error: '请填写艺术家名称和专长' },
        { status: 400 }
      );
    }

    // 开始事务：更新用户角色 + 创建艺术家档案
    // 1. 添加 artist 角色到 roles 数组
    const currentRoles = user.roles || ['user'];
    const newRoles = [...new Set([...currentRoles, 'artist'])]; // 使用 Set 去重

    const { error: updateUserError } = await supabase
      .from('users')
      .update({ roles: newRoles })
      .eq('privy_user_id', user.privy_user_id);

    if (updateUserError) {
      console.error('Failed to update user role:', updateUserError);
      return NextResponse.json(
        { error: '更新用户角色失败' },
        { status: 500 }
      );
    }

    // 2. 创建艺术家档案
    const { data: artist, error: createArtistError } = await supabase
      .from('artists')
      .insert({
        privy_user_id: user.privy_user_id,
        artist_name: artistName,
        display_name: displayName || artistName,
        artist_bio: bio || null,
        portfolio_url: portfolioUrl || null,
        website_url: websiteUrl || null,
        social_media: socialMedia || {},
        specialization: specialization,
        verified_artist: false, // 默认未认证
      })
      .select()
      .single();

    if (createArtistError) {
      console.error('Failed to create artist profile:', createArtistError);

      // 如果创建艺术家档案失败，回滚用户角色（从 roles 数组中移除 artist）
      const rolledBackRoles = currentRoles.filter((r: string) => r !== 'artist');
      await supabase
        .from('users')
        .update({ roles: rolledBackRoles })
        .eq('privy_user_id', user.privy_user_id);

      return NextResponse.json(
        { error: '创建艺术家档案失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '申请成功！欢迎成为艺术家',
      artist,
    });
  } catch (error) {
    console.error('Artist application error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
