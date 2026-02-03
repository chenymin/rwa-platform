'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { usePrivy } from '@privy-io/react-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthDebugPage() {
  const auth = useAuth();
  const privy = usePrivy();

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">认证状态调试</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Privy 认证状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-semibold">Authenticated:</span>
              <span className={privy.authenticated ? 'text-green-600' : 'text-red-600'}>
                {privy.authenticated ? '是' : '否'}
              </span>

              <span className="font-semibold">Ready:</span>
              <span className={privy.ready ? 'text-green-600' : 'text-red-600'}>
                {privy.ready ? '是' : '否'}
              </span>

              <span className="font-semibold">User ID:</span>
              <span className="text-sm break-all">{privy.user?.id || 'null'}</span>

              <span className="font-semibold">Wallet:</span>
              <span className="text-sm break-all">{privy.user?.wallet?.address || 'null'}</span>

              <span className="font-semibold">Email:</span>
              <span className="text-sm break-all">{privy.user?.email?.address || 'null'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supabase 认证状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-semibold">Authenticated:</span>
              <span className={auth.authenticated ? 'text-green-600' : 'text-red-600'}>
                {auth.authenticated ? '是' : '否'}
              </span>

              <span className="font-semibold">Loading:</span>
              <span className={auth.loading ? 'text-yellow-600' : 'text-green-600'}>
                {auth.loading ? '是' : '否'}
              </span>

              <span className="font-semibold">Error:</span>
              <span className={auth.error ? 'text-red-600' : 'text-green-600'}>
                {auth.error || '无'}
              </span>

              <span className="font-semibold">User Privy ID:</span>
              <span className="text-sm break-all">{auth.user?.privy_user_id || 'null'}</span>

              <span className="font-semibold">Wallet:</span>
              <span className="text-sm break-all">{auth.user?.wallet_address || 'null'}</span>

              <span className="font-semibold">Email:</span>
              <span className="text-sm break-all">{auth.user?.email || 'null'}</span>

              <span className="font-semibold">Roles:</span>
              <span className="text-sm">{auth.user?.roles?.join(', ') || 'null'}</span>

              <span className="font-semibold">Is Artist:</span>
              <span className={auth.isArtist ? 'text-green-600' : 'text-red-600'}>
                {auth.isArtist ? '是' : '否'}
              </span>

              <span className="font-semibold">Is User:</span>
              <span className={auth.isUser ? 'text-green-600' : 'text-red-600'}>
                {auth.isUser ? '是' : '否'}
              </span>

              <span className="font-semibold">Is Admin:</span>
              <span className={auth.isAdmin ? 'text-green-600' : 'text-red-600'}>
                {auth.isAdmin ? '是' : '否'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>完整用户数据</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">
              {JSON.stringify(auth.user, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
