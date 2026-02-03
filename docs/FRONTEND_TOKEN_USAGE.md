# 前端使用 Supabase Token 访问数据

## 🎯 核心概念

Edge Function 返回的 token 是**标准的 Supabase JWT token**，与 `signInWithIdToken` 返回的格式完全相同。

前端可以用这个 token：
- ✅ 访问 Supabase 数据库（自动应用 RLS 策略）
- ✅ 访问 Supabase Storage
- ✅ 调用其他 Supabase Edge Functions
- ✅ 使用 Supabase Realtime

---

## 🔄 完整认证流程

### 1. 登录并获取 Supabase Session

```typescript
// lib/hooks/useAuth.ts

import { usePrivy } from '@privy-io/react-auth';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export function useAuth() {
  const { user, authenticated, getAccessToken } = usePrivy();
  const [supabaseUser, setSupabaseUser] = useState(null);

  useEffect(() => {
    async function syncAuth() {
      if (!authenticated || !user) {
        return;
      }

      // 1. 获取 Privy token
      const privyToken = await getAccessToken();

      // 2. 调用 Edge Function（模拟 signInWithIdToken）
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-privy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ privyToken }),
      });

      const data = await response.json();

      if (data.success && data.session) {
        // 3. 设置 Supabase session（与 signInWithIdToken 后操作相同）
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 这里的 session 格式与 signInWithIdToken 返回的完全相同
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        setSupabaseUser(data.user);

        // 4. 保存到 localStorage（可选，用于页面刷新）
        localStorage.setItem('supabase_session', JSON.stringify(data.session));
      }
    }

    syncAuth();
  }, [authenticated, user, getAccessToken]);

  return { user: supabaseUser, authenticated };
}
```

### 2. 使用 Token 访问 Supabase 数据

#### 方式 A: 使用 Supabase Client（推荐）

```typescript
// 任何组件中
import { createClient } from '@supabase/supabase-js';

function MyComponent() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function fetchMyData() {
    // Token 会自动从 session 中使用
    // RLS 策略自动应用，只返回当前用户的数据
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('submitted_by', userId);

    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    console.log('My artworks:', data);
  }

  return <button onClick={fetchMyData}>Load My Artworks</button>;
}
```

#### 方式 B: 直接使用 Token（REST API）

```typescript
async function fetchDataWithToken() {
  // 从 localStorage 获取 session
  const sessionStr = localStorage.getItem('supabase_session');
  if (!sessionStr) {
    console.error('No session found');
    return;
  }

  const session = JSON.parse(sessionStr);

  // 使用 access_token 访问 Supabase REST API
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/artworks?select=*`,
    {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  console.log('Artworks:', data);
}
```

---

## 📊 Token 格式说明

### Edge Function 返回的 Session

```json
{
  "success": true,
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "expires_at": 1706789012,
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "aud": "authenticated",
      "role": "authenticated",
      "email": "user@example.com",
      "user_metadata": {
        "privy_user_id": "did:privy:clabcd123",
        "wallet_address": "0x1234567890123456789012345678901234567890",
        "email": "user@example.com"
      },
      "created_at": "2024-01-28T10:30:00Z",
      "updated_at": "2024-01-28T10:30:00Z"
    }
  },
  "user": {
    "privy_user_id": "did:privy:clabcd123",
    "auth_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "wallet_address": "0x1234567890123456789012345678901234567890",
    "email": "user@example.com",
    "role": "user",
    "is_verified": false
  }
}
```

### Access Token 内容（JWT）

解码后的 `access_token` 包含：

```json
{
  "aud": "authenticated",
  "exp": 1706789012,
  "iat": 1706785412,
  "iss": "supabase",
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "phone": "",
  "app_metadata": {
    "provider": "privy",
    "providers": ["privy"]
  },
  "user_metadata": {
    "privy_user_id": "did:privy:clabcd123",
    "wallet_address": "0x1234567890123456789012345678901234567890",
    "email": "user@example.com"
  },
  "role": "authenticated"
}
```

**重要字段**：
- `sub`: Supabase Auth 用户 UUID（用于 RLS 策略中的 `auth.uid()`）
- `role`: 用户角色（`authenticated`）
- `user_metadata`: 自定义用户信息（Privy ID、钱包地址等）

---

## 🔐 RLS 策略如何工作

### 数据库策略示例

```sql
-- users 表：用户只能读取自己的数据
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- artworks 表：用户只能看到自己提交的作品
CREATE POLICY "Users can read own artworks" ON artworks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.privy_user_id = artworks.submitted_by
      AND users.auth_user_id = auth.uid()
    )
  );
```

### Token 如何应用策略

```typescript
// 前端代码
const { data } = await supabase
  .from('users')
  .select('*');

// Supabase 自动：
// 1. 从请求中提取 access_token
// 2. 解码 JWT，获取 sub (用户 UUID)
// 3. 执行查询时，auth.uid() 返回这个 UUID
// 4. RLS 策略过滤结果：WHERE auth.uid() = auth_user_id
// 5. 只返回当前用户的数据
```

---

## 🔄 Token 刷新

### 自动刷新（推荐）

```typescript
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,  // 启用自动刷新
      persistSession: true,     // 持久化 session
    },
  }
);

// Supabase 会在 token 过期前自动刷新
```

### 手动刷新

```typescript
async function refreshToken() {
  const sessionStr = localStorage.getItem('supabase_session');
  if (!sessionStr) return;

  const session = JSON.parse(sessionStr);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: session.refresh_token,
  });

  if (data.session) {
    // 更新 session
    localStorage.setItem('supabase_session', JSON.stringify(data.session));
  }
}
```

---

## 📝 完整示例：获取和展示用户数据

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/lib/hooks/useAuth';

interface Artwork {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price: number;
  status: string;
}

export function MyArtworks() {
  const { user, authenticated } = useAuth();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArtworks() {
      if (!authenticated || !user) {
        setLoading(false);
        return;
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Token 自动从 session 使用，RLS 自动应用
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('submitted_by', user.privy_user_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading artworks:', error);
      } else {
        setArtworks(data || []);
      }

      setLoading(false);
    }

    loadArtworks();
  }, [authenticated, user]);

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!authenticated) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <h2>我的作品</h2>
      {artworks.length === 0 ? (
        <p>还没有提交作品</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {artworks.map((artwork) => (
            <div key={artwork.id} className="border p-4">
              <img src={artwork.image_url} alt={artwork.title} />
              <h3>{artwork.title}</h3>
              <p>{artwork.description}</p>
              <p>价格: ${artwork.price}</p>
              <p>状态: {artwork.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## ✅ 总结

### 前端使用流程

1. **获取 Token**:
   ```typescript
   const response = await fetch('/functions/v1/auth-privy', {
     body: JSON.stringify({ privyToken }),
   });
   const { session } = await response.json();
   ```

2. **设置 Session**:
   ```typescript
   await supabase.auth.setSession({
     access_token: session.access_token,
     refresh_token: session.refresh_token,
   });
   ```

3. **访问数据**:
   ```typescript
   const { data } = await supabase
     .from('artworks')
     .select('*');
   // RLS 自动应用，只返回当前用户有权访问的数据
   ```

### Token 特性

- ✅ 标准 Supabase JWT（与 `signInWithIdToken` 格式相同）
- ✅ 自动支持 RLS 策略
- ✅ 可用于所有 Supabase 服务
- ✅ 支持 token 刷新
- ✅ 1小时有效期，可刷新延长

### 与 signInWithIdToken 对比

| 特性 | signInWithIdToken | 我们的方案 |
|------|------------------|------------|
| Token 格式 | Supabase JWT | Supabase JWT ✅ |
| 前端使用 | `setSession()` | `setSession()` ✅ |
| RLS 支持 | ✅ | ✅ |
| 访问数据 | Supabase Client | Supabase Client ✅ |
| Token 刷新 | ✅ | ✅ |

**结论**: 完全等价，前端使用方式完全相同！
