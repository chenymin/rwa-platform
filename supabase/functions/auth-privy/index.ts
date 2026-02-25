// supabase/functions/auth-privy/index.ts - NEW VERSION
// ✅ 修复：创建真正的 Supabase auth 用户，JWT sub 使用 auth UUID
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

const PRIVY_APP_ID = Deno.env.get('PRIVY_APP_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_JWT_SECRET = Deno.env.get('SUPA_JWT_SECRET')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PrivyUser {
  id: string
  wallet?: { address: string; chain_type?: string }
  email?: { address: string }
  linkedAccounts?: Array<{ type: string; address?: string }>
  createdAt?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { privyToken } = await req.json()

    if (!privyToken) {
      return new Response(
        JSON.stringify({ error: 'Privy token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔐 Verifying Privy token...')

    // Verify Privy token
    const privyResponse = await fetch('https://auth.privy.io/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${privyToken}`,
        'privy-app-id': PRIVY_APP_ID,
      },
    })

    if (!privyResponse.ok) {
      const errorText = await privyResponse.text()
      console.error('❌ Privy verification failed:', errorText)
      return new Response(
        JSON.stringify({ error: 'Invalid Privy token', details: errorText }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const privyApiResponse = await privyResponse.json()
    console.log('✅ Privy API response received', privyApiResponse)

    // Handle nested user object
    const privyUser: PrivyUser = privyApiResponse.user || privyApiResponse
    console.log('✅ Privy user verified:', privyUser.id)

    const privyUserId = privyUser.id
    const email = privyUser.email?.address

    // 获取钱包地址：优先嵌入式钱包，其次关联的外部钱包
    let walletAddress = privyUser.wallet?.address
    if (!walletAddress && privyUser.linkedAccounts) {
      const linkedWallet = privyUser.linkedAccounts.find(
        (account) => account.type === 'wallet' && account.address
      )
      if (linkedWallet) {
        walletAddress = linkedWallet.address
      }
    }
    console.log('📱 Wallet address:', walletAddress || 'none')

    // Use privy ID suffix as placeholder email if no real email
    // Privy ID format: "did:privy:cmlawpi3z024zl80c9g5onlj0" -> extract "cmlawpi3z024zl80c9g5onlj0"
    const privyIdSuffix = privyUserId.split(':').pop() || privyUserId
    const userEmail = email || `${privyIdSuffix}@privy.local`

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if user exists in users table
    console.log('🔍 Checking if user exists in users table...')
    const { data: existingUser } = await supabase
      .from('users')
      .select('privy_user_id, auth_user_id, created_at')
      .eq('privy_user_id', privyUserId)
      .single()

    const timestamp = new Date().toISOString()
    let authUserId: string
    let user

    if (!existingUser) {
      // ✅ NEW: Create Supabase auth user first
      console.log('👤 Creating new Supabase auth user...')
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userEmail!,
        email_confirm: true,
        user_metadata: {
          wallet_address: walletAddress,
          privy_id: privyUserId,
          email: email,
        },
        app_metadata: {
          provider: 'privy',
          privy_id: privyUserId,
        },
      })

      if (authError || !authUser.user) {
        console.error('❌ Failed to create auth user:', authError)
        return new Response(
          JSON.stringify({
            error: 'Failed to create auth user',
            details: authError?.message,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      authUserId = authUser.user.id
      console.log('✅ Auth user created with UUID:', authUserId)

      // Create user record in users table
      console.log('👤 Creating user record in users table...')
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          privy_user_id: privyUserId,
          auth_user_id: authUserId, // ✅ NEW: Link to auth user
          wallet_address: walletAddress,
          email: email,
          created_at: timestamp,
          updated_at: timestamp,
          last_login: timestamp,
        })
        .select()
        .single()

      if (userError) {
        console.error('❌ Failed to create user record:', userError)
        return new Response(
          JSON.stringify({
            error: 'Failed to create user record',
            details: userError.message,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      user = userData
      console.log('✅ New user created:', privyUserId)
    } else {
      // Existing user
      authUserId = existingUser.auth_user_id

      // ✅ NEW: If user exists but has no auth_user_id (old data), create auth user
      if (!authUserId) {
        console.log('🔄 Creating missing auth user for existing user...')
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: userEmail!,
          email_confirm: true,
          user_metadata: {
            wallet_address: walletAddress,
            privy_id: privyUserId,
            email: email,
          },
          app_metadata: {
            provider: 'privy',
            privy_id: privyUserId,
          },
        })

        if (authError || !authUser.user) {
          console.error('❌ Failed to create auth user:', authError)
          return new Response(
            JSON.stringify({
              error: 'Failed to create auth user',
              details: authError?.message,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        authUserId = authUser.user.id
        console.log('✅ Auth user created with UUID:', authUserId)
      }

      // Update existing user
      console.log('🔄 Updating existing user...')
      const { data: userData, error: userError } = await supabase
        .from('users')
        .update({
          auth_user_id: authUserId, // ✅ NEW: Ensure auth_user_id is set
          wallet_address: walletAddress,
          email: email,
          last_login: timestamp,
          updated_at: timestamp,
        })
        .eq('privy_user_id', privyUserId)
        .select()
        .single()

      if (userError) {
        console.error('❌ Failed to update user:', userError)
        return new Response(
          JSON.stringify({
            error: 'Failed to update user',
            details: userError.message,
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      user = userData
      console.log('✅ Existing user updated:', privyUserId)
    }

    // ✅ CRITICAL FIX: Generate JWT with auth user UUID as sub (not Privy DID)
    const now = Math.floor(Date.now() / 1000)
    const exp = now + 60 * 60 * 24 // 24 hours

    const payload = {
      aud: 'authenticated',
      exp: exp,
      iat: now,
      iss: 'supabase',
      sub: authUserId, // ✅ FIXED: Use Supabase auth UUID instead of Privy DID
      role: 'authenticated',
      email: userEmail!,
      app_metadata: {
        provider: 'privy',
        privy_id: privyUserId,
      },
      user_metadata: {
        wallet_address: walletAddress,
        privy_id: privyUserId,
        email: email,
      },
    }

    console.log('🔑 Generating JWT with auth user UUID as sub:', authUserId)
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .sign(new TextEncoder().encode(SUPABASE_JWT_SECRET))

    console.log('✅ Authentication successful')

    return new Response(
      JSON.stringify({
        access_token: jwt,
        token_type: 'bearer',
        expires_in: 86400,
        expires_at: exp,
        refresh_token: jwt, // ✅ Use same token as refresh for simplicity
        user: {
          id: authUserId, // ✅ FIXED: Return auth user UUID
          aud: 'authenticated',
          role: 'authenticated',
          email: userEmail!,
          app_metadata: payload.app_metadata,
          user_metadata: payload.user_metadata,
          created_at: user?.created_at || timestamp,
          updated_at: user?.updated_at || timestamp,
        },
        // ✅ OPTIMIZATION: Include business user data to avoid extra query
        userData: {
          privy_user_id: user?.privy_user_id || privyUserId,
          wallet_address: user?.wallet_address || walletAddress,
          email: user?.email || email,
          roles: user?.roles || ['user'],
          is_verified: user?.is_verified || false,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('💥 Error in auth-privy function:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
