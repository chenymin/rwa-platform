'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ArtistProfileDebugPage() {
  const { user, authenticated, isArtist } = useAuth();
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkArtistProfile() {
      if (!authenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        console.log('Checking artist profile for privy_user_id:', user.privy_user_id);

        const { data, error } = await supabase
          .from('artists')
          .select('*')
          .eq('privy_user_id', user.privy_user_id)
          .single();

        if (error) {
          console.error('Artist profile error:', error);
          setError(error.message);
        } else {
          console.log('Artist profile found:', data);
          setArtistProfile(data);
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    checkArtistProfile();
  }, [authenticated, user]);

  async function createTestArtistProfile() {
    if (!user) return;

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('artists')
        .insert({
          privy_user_id: user.privy_user_id,
          artist_name: '测试艺术家',
          artist_bio: '这是一个测试艺术家资料',
          verified_artist: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Create artist error:', error);
        alert('创建失败: ' + error.message);
      } else {
        console.log('Artist created:', data);
        setArtistProfile(data);
        setError(null);
        alert('创建成功！');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('创建失败: ' + err);
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">艺术家资料调试</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>用户状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-semibold">Authenticated:</span>
              <span className={authenticated ? 'text-green-600' : 'text-red-600'}>
                {authenticated ? '是' : '否'}
              </span>

              <span className="font-semibold">Is Artist Role:</span>
              <span className={isArtist ? 'text-green-600' : 'text-red-600'}>
                {isArtist ? '是' : '否'}
              </span>

              <span className="font-semibold">Privy User ID:</span>
              <span className="text-sm break-all">{user?.privy_user_id || 'null'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>艺术家资料查询结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p>加载中...</p>
            ) : error ? (
              <div className="space-y-4">
                <p className="text-red-600">错误: {error}</p>
                {error.includes('PGRST116') && (
                  <div className="space-y-2">
                    <p className="text-yellow-600">
                      未找到艺术家资料记录。用户有 artist 角色但没有对应的 artists 表记录。
                    </p>
                    <Button onClick={createTestArtistProfile}>
                      创建测试艺术家资料
                    </Button>
                  </div>
                )}
              </div>
            ) : artistProfile ? (
              <div className="space-y-2">
                <p className="text-green-600">✅ 找到艺术家资料</p>
                <pre className="text-xs overflow-auto bg-gray-100 p-4 rounded">
                  {JSON.stringify(artistProfile, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-yellow-600">未找到艺术家资料</p>
                {isArtist && (
                  <Button onClick={createTestArtistProfile}>
                    创建测试艺术家资料
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
