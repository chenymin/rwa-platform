# Privy + Supabase 认证集成文档

## 概述

本项目使用 **Privy** 作为身份提供方（用户登录），**Supabase** 作为数据存储和后端 API。

### 认证流程

```
1. 用户通过 Privy 登录（钱包/邮箱/社交账号）
   ↓
2. 前端获取 Privy access token 和用户信息
   ↓
3. 前端调用 /api/auth/privy，传递 token 和用户信息
   ↓
4. 后端验证 Privy token（调用 Privy API）
   ↓
5. 后端在 Supabase 创建/更新用户记录
   ↓
6. 后端生成自定义 session token
   ↓
7. 前端保存 session token 用于后续 API 调用
   ↓
8. 前端通过 session token 访问 Supabase 数据
```

---

## 数据库架构

### users 表

```sql
CREATE TABLE users (
  privy_user_id VARCHAR(255) PRIMARY KEY,  -- Privy 用户 ID
  wallet_address VARCHAR(42) UNIQUE,       -- 钱包地址（可选）
  email VARCHAR(255),                      -- 邮箱（可选）
  role VARCHAR(20) DEFAULT 'user',         -- 用户角色
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

### artworks 表

```sql
ALTER TABLE artworks
  ADD CONSTRAINT fk_submitted_by
    FOREIGN KEY (submitted_by)
    REFERENCES users(privy_user_id);
```

---

## 后端实现

### 1. API 端点：`/api/auth/privy`

**请求**：
```typescript
POST /api/auth/privy
Content-Type: application/json

{
  "privyToken": "eyJhbGc...",  // Privy access token
  "user": {                     // Privy 用户对象
    "id": "did:privy:...",
    "wallet": { "address": "0x..." },
    "email": { "address": "user@example.com" }
  }
}
```

**响应**：
```typescript
{
  "success": true,
  "user": {
    "privy_user_id": "did:privy:...",
    "wallet_address": "0x...",
    "email": "user@example.com",
    "role": "user"
  },
  "sessionToken": "base64_encoded_token"
}
```

### 2. Privy Token 验证（TODO）

目前代码中 token 验证部分被注释了，需要根据 Privy 官方文档完善：

```typescript
// lib/privy-server.ts
import { PrivyClient } from '@privy-io/node';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function verifyPrivyToken(accessToken: string) {
  try {
    const claims = await privy.verifyAuthToken(accessToken);
    return { success: true, claims };
  } catch (error) {
    return { success: false, error };
  }
}
```

---

## 前端实现

### 1. 创建认证 Hook

```typescript
// lib/hooks/useAuth.ts
'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
  const { user, authenticated, getAccessToken } = usePrivy();
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function syncAuth() {
      if (!authenticated || !user) {
        setSupabaseUser(null);
        setLoading(false);
        return;
      }

      try {
        // 获取 Privy access token
        const privyToken = await getAccessToken();

        // 调用认证端点
        const response = await fetch('/api/auth/privy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            privyToken,
            user: {
              id: user.id,
              wallet: user.wallet,
              email: user.email,
            },
          }),
        });

        const data = await response.json();

        if (data.success) {
          // 保存 session token 到 localStorage
          localStorage.setItem('supabase_session', data.sessionToken);
          setSupabaseUser(data.user);
        }
      } catch (error) {
        console.error('Auth sync error:', error);
      } finally {
        setLoading(false);
      }
    }

    syncAuth();
  }, [authenticated, user, getAccessToken]);

  return {
    user: supabaseUser,
    privyUser: user,
    authenticated,
    loading,
  };
}
```

### 2. 更新 ConnectButton

```typescript
// components/wallet/connect-button.tsx
'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';

export function ConnectButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { user, loading } = useAuth();

  if (!ready || loading) {
    return <Button disabled size="sm">加载中...</Button>;
  }

  if (!authenticated) {
    return (
      <Button onClick={login} size="sm">
        登录
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {user?.wallet_address ?
            `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}` :
            user?.email || '已登录'
          }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={logout}>
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 3. 使用 Session Token 访问 Supabase

```typescript
// lib/supabase/client-with-auth.ts
import { createClient } from '@supabase/supabase-js';

export function createAuthenticatedClient() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 添加自定义 header 携带 session token
  const sessionToken = localStorage.getItem('supabase_session');

  if (sessionToken) {
    // 方法 1: 使用自定义 header（需要在 RLS 策略中检查）
    // supabase.headers['X-Session-Token'] = sessionToken;

    // 方法 2: 解码并设置为 Supabase 配置
    const decoded = JSON.parse(atob(sessionToken));
    // 使用 decoded.privyUserId 设置 RLS 策略
  }

  return supabase;
}
```

---

## Row Level Security (RLS) 策略

### 更新 RLS 以使用 Privy User ID

```sql
-- 设置当前用户 ID（在 API 调用时）
SET app.current_user_id = 'did:privy:xxx';

-- Users 表策略
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (privy_user_id = current_setting('app.current_user_id', true));

-- Artworks 表策略
CREATE POLICY "Users can submit artworks"
  ON artworks FOR INSERT
  WITH CHECK (submitted_by = current_setting('app.current_user_id', true));
```

---

## 环境变量

```env
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=cmko6jj3200dljv0cv4doct1p
PRIVY_APP_SECRET=your_secret_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # 用于后端创建用户
```

---

## 部署步骤

### 1. 运行数据库迁移

```bash
# 连接到 Supabase 并运行迁移
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/migrations/002_update_users_for_privy.sql
```

### 2. 更新管理员用户

登录后，获取你的 Privy User ID，然后更新数据库：

```sql
UPDATE users
SET role = 'admin', is_verified = true
WHERE privy_user_id = 'your_privy_user_id_here';
```

### 3. 测试流程

1. 打开应用，点击"登录"
2. 使用 Privy 登录（钱包/邮箱）
3. 检查浏览器 Console 是否有错误
4. 检查 localStorage 中是否保存了 `supabase_session`
5. 尝试提交艺术品，验证认证是否生效

---

## 安全注意事项

⚠️ **当前实现是简化版本，生产环境需要加强：**

1. **Token 验证**：必须调用 Privy API 验证 token 的真实性
2. **Session 管理**：使用 JWT 或 Supabase Auth 的 signInWithIdToken
3. **Token 过期**：实现 token 刷新机制
4. **HTTPS**：生产环境必须使用 HTTPS
5. **Rate Limiting**：添加 API 限流防止滥用

---

## 常见问题

### Q1: 为什么不直接使用 Supabase Auth？

A: 因为 Privy 提供了更好的 Web3 钱包体验和多种登录方式，而 Supabase 主要用作数据存储。

### Q2: Session Token 如何刷新？

A: 当 Privy token 过期时，前端会自动刷新，然后重新调用 `/api/auth/privy`。

### Q3: 如何判断用户是否是管理员？

A: 在后端 API 中查询 `users` 表的 `role` 字段。

---

## 下一步

- [ ] 实现完整的 Privy token 验证
- [ ] 添加 JWT 作为 session token
- [ ] 实现 token 刷新机制
- [ ] 添加 API 限流
- [ ] 完善错误处理和日志记录
