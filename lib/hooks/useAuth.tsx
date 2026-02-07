'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createClient } from '@/lib/supabase/client';

interface SupabaseUser {
  privy_user_id: string;
  wallet_address: string | null;
  email: string | null;
  roles: string[];
  is_verified: boolean;
}

interface SupabaseSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: any;
}

interface AuthContextType {
  user: SupabaseUser | null;
  privyUser: any;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
  isArtist: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Internal hook that does the actual auth logic
function useAuthState() {
  const { user, authenticated, getAccessToken, ready } = usePrivy();
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // 用于防止并发认证请求
  const isAuthenticatingRef = React.useRef(false);
  // 用于跟踪已认证的 Privy 用户 ID，防止重复认证
  const authenticatedUserIdRef = React.useRef<string | null>(null);
  // 用于追踪 useEffect 调用次数（调试用）
  const syncAuthCallCountRef = React.useRef(0);

  // 确保只在客户端执行
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function syncAuth() {
      // 增加调用计数
      syncAuthCallCountRef.current += 1;
      const callNumber = syncAuthCallCountRef.current;

      // 获取调用栈，帮助定位重复调用
      const stack = new Error().stack;
      console.log(`🔄 [useAuth] syncAuth triggered (#${callNumber})`, {
        mounted,
        ready,
        authenticated,
        userId: user?.id,
        timestamp: new Date().toISOString(),
        dependencies: { authenticated, userId: user?.id, ready, mounted },
        stack: stack?.split('\n').slice(0, 5).join('\n') // 显示前5行调用栈
      });

      // 等待客户端挂载完成
      if (!mounted || !ready) {
        console.log('⏸️ [useAuth] Not ready yet');
        return;
      }

      if (!authenticated || !user) {
        console.log('🚪 [useAuth] User logged out, clearing state');
        setSupabaseUser(null);
        setLoading(false);
        localStorage.removeItem('supabase_session');
        localStorage.removeItem('supabase_user');
        authenticatedUserIdRef.current = null;
        return;
      }

      // 如果已经为这个用户完成了认证，不要重复调用
      if (authenticatedUserIdRef.current === user.id && supabaseUser) {
        console.log('✅ [useAuth] Already authenticated for this user, skipping');
        setLoading(false);
        return;
      }

      // 如果正在认证中，防止并发调用
      if (isAuthenticatingRef.current) {
        console.log(`⏳ [useAuth] Authentication already in progress, skipping call #${callNumber}`);
        return;
      }

      // 🔥 NEW: 如果在短时间内（1秒）重复调用相同用户，跳过
      const now = Date.now();
      const lastAuthKey = `lastAuth_${user.id}`;
      const lastAuthTime = (window as any)[lastAuthKey] || 0;

      if (now - lastAuthTime < 1000) {
        console.log(`⚡ [useAuth] Skipping call #${callNumber} - too soon after last auth (${now - lastAuthTime}ms ago)`);
        return;
      }

      (window as any)[lastAuthKey] = now;

      try {
        isAuthenticatingRef.current = true;
        setLoading(true);
        setError(null);

        console.log('🔐 [useAuth] Starting authentication for user:', user.id);

        // 获取 Privy access token
        const privyToken = await getAccessToken();

        if (!privyToken) {
          throw new Error('无法获取 Privy token');
        }

        console.log('📡 [useAuth] Calling Edge Function with Privy token...');

        // 调用 Supabase Edge Function
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/auth-privy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            privyToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Edge Function error:', errorData);
          throw new Error(errorData.error || '认证失败');
        }

        const data = await response.json();
        console.log('📦 [useAuth] Edge Function response received');

        // 检查是否有 access_token（直接返回 session 对象）
        if (data.access_token && data.user) {
          // API 直接返回 Supabase session 对象
          const session = {
            access_token: data.access_token,
            token_type: data.token_type,
            expires_in: data.expires_in,
            expires_at: data.expires_at,
            refresh_token: data.refresh_token || '',
            user: data.user,
          };

          localStorage.setItem('supabase_session', JSON.stringify(session));

          // ✅ Use singleton client to avoid multiple /auth/v1/user requests
          const supabase = createClient();

          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });

          // ✅ OPTIMIZATION: Use userData from Edge Function response (no extra query!)
          const userData: SupabaseUser = data.userData || {
            privy_user_id: user.id,
            wallet_address: null,
            email: null,
            roles: ['user'],
            is_verified: false,
          };

          console.log('✅ [useAuth] Using userData from Edge Function (no extra query)');

          localStorage.setItem('supabase_user', JSON.stringify(userData));
          setSupabaseUser(userData);
          authenticatedUserIdRef.current = user.id;
          console.log('✅ [useAuth] Authentication successful, user set:', userData.privy_user_id);
        } else {
          throw new Error(data.error || '认证失败');
        }
      } catch (err) {
        console.error('❌ [useAuth] Auth sync error:', err);
        setError(err instanceof Error ? err.message : '认证失败');
        setSupabaseUser(null);
        localStorage.removeItem('supabase_session');
        localStorage.removeItem('supabase_user');
        authenticatedUserIdRef.current = null;
      } finally {
        isAuthenticatingRef.current = false;
        setLoading(false);
        console.log('🏁 [useAuth] Auth process finished');
      }
    }

    syncAuth();
  }, [authenticated, user?.id, ready, mounted]); // 移除 getAccessToken，它的引用可能不稳定

  // 从 localStorage 恢复 session（页面刷新时）
  // ⚠️ 注意：这个 useEffect 只在用户未登录时恢复缓存的 session
  // 如果用户已经通过 Privy 登录，由上面的 syncAuth 处理
  useEffect(() => {
    async function restoreSession() {
      console.log('💾 [useAuth] restoreSession triggered', {
        mounted,
        authenticated,
        ready,
        timestamp: new Date().toISOString()
      });

      if (!mounted) {
        console.log('⏸️ [useAuth] restoreSession - Not mounted yet');
        return;
      }

      // ✅ FIXED: 只在 Privy 未认证时才尝试恢复
      // 如果 Privy 已认证，让 syncAuth 处理
      if (!authenticated && ready) {
        console.log('💾 [useAuth] Attempting to restore cached session...');
        const cachedSession = localStorage.getItem('supabase_session');
        const cachedUser = localStorage.getItem('supabase_user');

        if (cachedSession && cachedUser) {
          try {
            const session: SupabaseSession = JSON.parse(cachedSession);
            const user: SupabaseUser = JSON.parse(cachedUser);

            // 检查 token 是否过期
            if (session.expires_at * 1000 > Date.now()) {
              // Token 仍然有效，恢复 Supabase session
              // ✅ Use singleton client
              const supabase = createClient();

              await supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              });

              setSupabaseUser(user);
              console.log('Session restored from localStorage');
            } else {
              // Token 过期，清理
              console.log('Session expired, clearing cache');
              localStorage.removeItem('supabase_session');
              localStorage.removeItem('supabase_user');
            }
          } catch (err) {
            console.error('Failed to restore session:', err);
            localStorage.removeItem('supabase_session');
            localStorage.removeItem('supabase_user');
          }
        }
        setLoading(false);
      }
    }

    restoreSession();
  }, [authenticated, ready, mounted]);

  // Helper function to check if user has a specific role
  const hasRole = (role: string): boolean => {
    return supabaseUser?.roles?.includes(role) ?? false;
  };

  // 在未挂载时返回加载状态，确保 SSR 和客户端首次渲染一致
  if (!mounted) {
    return {
      user: null,
      privyUser: null,
      authenticated: false,
      loading: true,
      error: null,
      isAdmin: false,
      hasRole: () => false,
      isArtist: false,
      isUser: false,
    };
  }

  return {
    user: supabaseUser,
    privyUser: user,
    authenticated,
    loading,
    error,
    isAdmin: hasRole('admin'),
    hasRole,
    isArtist: hasRole('artist'),
    isUser: hasRole('user'),
  };
}

// Provider component that wraps the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Public hook that components should use
export function useAuth() {
  const context = useContext(AuthContext);

  // If this hook is called during server-side rendering (build/prerender),
  // return a safe fallback instead of throwing. This prevents build-time
  // prerender failures where client-only hooks are invoked on the server.
  if (typeof window === 'undefined') {
    return {
      user: null,
      privyUser: null,
      authenticated: false,
      loading: true,
      error: null,
      isAdmin: false,
      hasRole: () => false,
      isArtist: false,
      isUser: false,
    } as AuthContextType;
  }

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
