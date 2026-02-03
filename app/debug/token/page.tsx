'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TokenDebugPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [decodedToken, setDecodedToken] = useState<any>(null);

  useEffect(() => {
    const cachedSession = localStorage.getItem('supabase_session');
    if (cachedSession) {
      const session = JSON.parse(cachedSession);
      setSessionData(session);

      // Decode JWT token
      if (session.access_token) {
        try {
          const parts = session.access_token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            setDecodedToken(payload);
          }
        } catch (e) {
          console.error('Failed to decode token:', e);
        }
      }
    }
  }, []);

  async function testTokenOnServer() {
    const cachedSession = localStorage.getItem('supabase_session');
    if (!cachedSession) {
      alert('No session found');
      return;
    }

    const session = JSON.parse(cachedSession);

    const response = await fetch('/api/debug/test-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
    });

    const result = await response.json();
    console.log('Server test result:', result);
    alert(JSON.stringify(result, null, 2));
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Token 调试</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Session 数据</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionData ? (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold mb-2">Token 类型:</p>
                  <p className="text-sm">{sessionData.token_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Access Token (前100字符):</p>
                  <p className="text-xs font-mono break-all bg-gray-100 p-2 rounded">
                    {sessionData.access_token?.substring(0, 100)}...
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Refresh Token (前100字符):</p>
                  <p className="text-xs font-mono break-all bg-gray-100 p-2 rounded">
                    {sessionData.refresh_token?.substring(0, 100)}...
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">过期时间:</p>
                  <p className="text-sm">
                    {sessionData.expires_at
                      ? new Date(sessionData.expires_at * 1000).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">未找到 session 数据</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>解码后的 JWT Payload</CardTitle>
          </CardHeader>
          <CardContent>
            {decodedToken ? (
              <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">
                {JSON.stringify(decodedToken, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">无法解码 token</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>服务端测试</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testTokenOnServer}>
              在服务端测试 Token
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              点击此按钮将 token 发送到服务端进行验证，结果会显示在弹窗中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>完整 Session 对象</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded max-h-96">
              {sessionData ? JSON.stringify(sessionData, null, 2) : '未找到数据'}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
