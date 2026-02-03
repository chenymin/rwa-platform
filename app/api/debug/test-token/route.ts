import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, refresh_token } = body;

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test 1: Try getUser with access_token
    console.log('Test 1: getUser(access_token)');
    const { data: userData1, error: error1 } = await supabase.auth.getUser(access_token);

    // Test 2: Try setSession
    console.log('Test 2: setSession()');
    const { data: sessionData, error: error2 } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    // Decode token to see claims
    let decodedToken = null;
    try {
      const parts = access_token.split('.');
      if (parts.length === 3) {
        decodedToken = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      }
    } catch (e) {
      console.error('Failed to decode:', e);
    }

    return NextResponse.json({
      test1_getUser: {
        success: !error1,
        error: error1?.message,
        user: userData1.user ? { id: userData1.user.id, email: userData1.user.email } : null,
      },
      test2_setSession: {
        success: !error2,
        error: error2?.message,
        user: sessionData.user ? { id: sessionData.user.id, email: sessionData.user.email } : null,
      },
      decodedToken,
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
