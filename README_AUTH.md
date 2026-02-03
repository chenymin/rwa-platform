# Art RWA Platform - 认证系统文档

## 🎯 核心功能

使用 Privy 登录，生成 Supabase token，前端可以用这个 token 访问 Supabase 数据。

**等价于**: `supabase.auth.signInWithIdToken({ provider: 'privy', token })`

---

## 🚀 快速开始

### 1. 前端登录

```typescript
import { usePrivy } from '@privy-io/react-auth';
import { createClient } from '@supabase/supabase-js';

const { login, getAccessToken } = usePrivy();

// 用户点击登录
await login();

// 获取 Privy token
const privyToken = await getAccessToken();

// 调用 Edge Function 获取 Supabase session
const response = await fetch('/functions/v1/auth-privy', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ privyToken }),
});

const { session } = await response.json();

// 设置 Supabase session
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
await supabase.auth.setSession({
  access_token: session.access_token,
  refresh_token: session.refresh_token,
});
```

### 2. 访问数据

```typescript
// Token 自动使用，RLS 自动应用
const { data } = await supabase
  .from('artworks')
  .select('*');

console.log(data); // 只返回当前用户有权访问的数据
```

---

## 📚 文档导航

### 核心文档

1. **[认证流程对比](./docs/FLOW_COMPARISON.md)** ⭐⭐⭐ 必读
   - 你期望的流程 vs 实际实现
   - 为什么不能直接调用 `signInWithIdToken`
   - 详细的等价性说明

2. **[signInWithIdToken 等价说明](./docs/SIGNINWITHIDTOKEN_EQUIVALENCE.md)** ⭐
   - 为什么我们的实现等价于 `signInWithIdToken`
   - 功能对比
   - Token 格式对比

3. **[前端 Token 使用指南](./docs/FRONTEND_TOKEN_USAGE.md)** ⭐
   - 完整的前端代码示例
   - 如何访问 Supabase 数据
   - RLS 策略工作原理

### 架构文档

4. **[V3 Final 总结](./docs/V3_FINAL_SUMMARY.md)**
   - V3 核心改进
   - 代码实现
   - 部署步骤

4. **[V3 架构详解](./docs/AUTH_IMPLEMENTATION_V3.md)**
   - 认证流程
   - 数据库架构
   - RLS 策略

5. **[为什么不直接用 signInWithIdToken](./docs/WHY_NOT_SIGNINWITHIDTOKEN.md)**
   - signInWithIdToken 的限制
   - 我们的解决方案
   - 如何配置自定义 OIDC provider（可选）

### 部署指南

6. **[部署检查清单](./DEPLOYMENT_CHECKLIST.md)**
   - 完整的部署步骤
   - 测试验证
   - 常见问题

7. **[快速开始](./docs/QUICKSTART.md)**
   - 5 步快速部署
   - 环境变量配置

8. **[V3 升级指南](./docs/V3_UPGRADE_GUIDE.md)**
   - 从 V2 升级到 V3
   - 核心变化
   - 迁移步骤

### 状态文档

9. **[完成状态](./docs/COMPLETION_STATUS.md)**
   - 已完成的工作
   - 待处理任务
   - 版本对比

---

## 🔑 关键特性

### ✅ 与 signInWithIdToken 完全等价

| 功能 | signInWithIdToken | 我们的实现 |
|------|------------------|------------|
| 生成 Supabase JWT | ✅ | ✅ |
| 返回 access_token | ✅ | ✅ |
| 返回 refresh_token | ✅ | ✅ |
| 支持 RLS 策略 | ✅ | ✅ |
| 访问 Supabase 数据 | ✅ | ✅ |
| Token 格式 | 标准 | 标准 ✅ |
| 前端使用 | `setSession()` | `setSession()` ✅ |

### ✅ 额外优势

- 🔐 **更安全**: Token 验证在服务端进行
- 🎨 **更灵活**: 支持自定义业务逻辑
- 🗃️ **双表设计**: Auth 表 + 业务表
- 🔧 **可扩展**: 支持任何认证提供商

---

## 📊 架构概览

```
┌─────────────────┐
│  Privy 登录      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  获取 Privy      │
│  Access Token   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  调用 Edge Function              │
│  /functions/v1/auth-privy       │
│  Body: { privyToken }           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Edge Function 验证并生成 Token │
│  ├─ 验证 Privy token            │
│  ├─ 创建 Supabase Auth 用户     │
│  ├─ 在业务表创建记录            │
│  └─ 生成 Supabase JWT           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  返回 Session                   │
│  {                              │
│    access_token,  ←── Supabase JWT
│    refresh_token,                │
│    user                          │
│  }                              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  前端设置 Session               │
│  supabase.auth.setSession()    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  访问 Supabase 数据             │
│  supabase.from('table').select()│
│  RLS 自动应用 ✅                │
└─────────────────────────────────┘
```

---

## 🗃️ 数据库结构

### Supabase Auth (`auth.users`)
- **作用**: 存储认证信息
- **主键**: `id` (UUID)
- **重要字段**: `email`, `user_metadata`

### 自定义表 (`public.users`)
- **作用**: 存储业务信息
- **主键**: `privy_user_id` (VARCHAR)
- **关联**: `auth_user_id` → `auth.users.id`
- **字段**: `wallet_address`, `email`, `role`, etc.

### 关联关系
```sql
auth.users (id: UUID)
    ↓ (1:1)
public.users (auth_user_id: UUID, privy_user_id: VARCHAR)
    ↓ (1:N)
artworks (submitted_by: VARCHAR → privy_user_id)
```

---

## 🔐 RLS 策略示例

```sql
-- 用户表：只能读取自己的数据
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- 作品表：只能读取自己的作品
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

**工作原理**:
1. 前端发送请求时带上 `access_token`
2. Supabase 解析 JWT，提取 `sub` (用户 UUID)
3. `auth.uid()` 返回这个 UUID
4. RLS 策略过滤数据：只返回当前用户的数据

---

## 🔧 环境变量

### 前端 (`.env`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://nfjkrddcteplefvmcvgp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_PRIVY_APP_ID=cmko6jj3200dljv0cv4doct1p
```

### Edge Function (Supabase Secrets)
```bash
supabase secrets set SUPABASE_URL=https://nfjkrddcteplefvmcvgp.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set PRIVY_APP_ID=cmko6jj3200dljv0cv4doct1p
```

**注意**: V3 Final 只需要 3 个环境变量！

---

## 🚀 部署

### 1. 数据库迁移
```bash
supabase db push
```

### 2. 配置环境变量
```bash
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set PRIVY_APP_ID=...
```

### 3. 部署 Edge Function
```bash
supabase functions deploy auth-privy
```

### 4. 测试
```bash
# 查看日志
supabase functions logs auth-privy --follow

# 前端登录测试
npm run dev
# 访问 http://localhost:3003
# 点击登录
```

详细步骤请查看 [部署检查清单](./DEPLOYMENT_CHECKLIST.md)

---

## ❓ 常见问题

### Q1: 为什么不直接用 signInWithIdToken？

**A**: Privy 不是 Supabase 原生支持的 provider。我们的实现提供了完全等价的功能。

详见: [WHY_NOT_SIGNINWITHIDTOKEN.md](./docs/WHY_NOT_SIGNINWITHIDTOKEN.md)

### Q2: Token 可以访问 Supabase 数据吗？

**A**: 可以！返回的 token 是标准 Supabase JWT，可以访问所有 Supabase 服务。

详见: [FRONTEND_TOKEN_USAGE.md](./docs/FRONTEND_TOKEN_USAGE.md)

### Q3: RLS 策略如何工作？

**A**: Token 中的 `sub` (用户 UUID) 会被 `auth.uid()` 使用，RLS 策略自动应用。

示例:
```typescript
// 前端代码
const { data } = await supabase.from('artworks').select('*');

// SQL 实际执行
SELECT * FROM artworks
WHERE EXISTS (
  SELECT 1 FROM users
  WHERE users.privy_user_id = artworks.submitted_by
  AND users.auth_user_id = auth.uid()  -- 从 JWT 获取
);
```

### Q4: Token 会过期吗？

**A**: 会，1 小时后过期。但可以使用 `refresh_token` 刷新。

```typescript
// 自动刷新（推荐）
const supabase = createClient(URL, KEY, {
  auth: { autoRefreshToken: true },
});

// 手动刷新
await supabase.auth.refreshSession();
```

---

## 📖 代码示例

### 完整的登录和访问数据示例

```typescript
'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createClient } from '@supabase/supabase-js';

export function MyComponent() {
  const { authenticated, getAccessToken } = usePrivy();
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (!authenticated) return;

      // 1. 获取 Privy token
      const privyToken = await getAccessToken();

      // 2. 调用 Edge Function
      const response = await fetch('/functions/v1/auth-privy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ privyToken }),
      });

      const { session } = await response.json();

      // 3. 设置 Supabase session
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      // 4. 访问数据（RLS 自动应用）
      const { data: artworks } = await supabase
        .from('artworks')
        .select('*');

      setData(artworks || []);
    }

    loadData();
  }, [authenticated, getAccessToken]);

  return (
    <div>
      {data.map((artwork) => (
        <div key={artwork.id}>{artwork.title}</div>
      ))}
    </div>
  );
}
```

---

## ✅ 总结

### 你的需求
> 使用 signInWithIdToken 来生成 token，返回给前端，前端根据这个 token，可以访问 Supabase 的数据

### 实现状态
✅ **完全实现**

- ✅ 生成标准 Supabase JWT token
- ✅ 返回给前端 (`access_token`, `refresh_token`, `user`)
- ✅ 前端可以用 token 访问 Supabase 数据
- ✅ RLS 策略自动应用
- ✅ 支持所有 Supabase 服务

### 与 signInWithIdToken 对比
- 功能: **完全相同** ✅
- Token 格式: **完全相同** ✅
- 前端使用: **完全相同** ✅
- RLS 支持: **完全相同** ✅

**唯一区别**: 调用方式（前端直接调用 vs 通过 Edge Function）

---

## 🎉 开始使用

1. 阅读 [signInWithIdToken 等价说明](./docs/SIGNINWITHIDTOKEN_EQUIVALENCE.md)
2. 查看 [前端使用指南](./docs/FRONTEND_TOKEN_USAGE.md)
3. 按照 [部署检查清单](./DEPLOYMENT_CHECKLIST.md) 部署
4. 开始构建你的应用！

有问题查看 Edge Function 日志：
```bash
supabase functions logs auth-privy --follow
```
