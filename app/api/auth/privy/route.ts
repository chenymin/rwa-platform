import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用 service role key 来创建/更新用户
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privyToken, user } = body;

    if (!privyToken || !user) {
      return NextResponse.json(
        { error: 'Missing required fields: privyToken and user' },
        { status: 400 }
      );
    }

    // Step 2: 提取用户信息
    const privyUserId = user.id; // Privy user ID
    const walletAddress = user.wallet?.address || null;
    const email = user.email?.address || null;

    // Step 3: 在 Supabase 中创建或更新用户
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('privy_user_id', privyUserId)
      .single();

    let userData;

    if (existingUser) {
      // 更新现有用户
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          wallet_address: walletAddress,
          email: email,
          last_login: new Date().toISOString(),
        })
        .eq('privy_user_id', privyUserId)
        .select()
        .single();

      if (error) throw error;
      userData = data;
    } else {
      // 创建新用户
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          privy_user_id: privyUserId,
          wallet_address: walletAddress,
          email: email,
          role: 'user',
          last_login: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      userData = data;
    }

    // Step 4: 生成自定义的 session token
    // 这里我们简化处理，直接返回用户信息和一个标记
    // 在生产环境中，你应该生成一个 JWT 或使用 Supabase Auth 的 signInWithIdToken
    const sessionToken = Buffer.from(
      JSON.stringify({
        privyUserId,
        timestamp: Date.now(),
      })
    ).toString('base64');

    return NextResponse.json({
      success: true,
      user: userData,
      sessionToken,
      message: 'Authentication successful',
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      {
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
