# Supabase Edge Function 部署指南

## 概述

本项目使用 Supabase Edge Function 来处理 Privy 认证，而不是使用 Next.js API Routes。这样做的好处：

✅ **更低延迟**：Edge Function 运行在离数据库更近的位置
✅ **更好的安全性**：直接使用 Supabase Service Role Key
✅ **自动扩展**：Supabase 自动处理负载均衡
✅ **全球分布**：自动部署到全球 CDN 节点

---

## 架构流程

```
用户浏览器
   ↓ (Privy 登录)
Privy SDK (获取 access token)
   ↓
调用 Edge Function
   ↓
验证 Privy Token
   ↓
创建/更新 Supabase users 表
   ↓
生成 session token
   ↓
返回给前端
```

---

## 前置条件

### 1. 安装 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (使用 Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 或使用 npm
npm install -g supabase
```

### 2. 登录 Supabase

```bash
supabase login
```

会打开浏览器让你授权，授权后自动登录。

### 3. 链接到你的项目

```bash
supabase link --project-ref your-project-ref
```

**获取 project-ref**：
- 访问 https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/general
- 复制 "Reference ID"

---

## 本地开发

### 1. 启动本地 Supabase

```bash
# 在项目根目录
supabase start
```

这会启动本地的：
- PostgreSQL 数据库
- Edge Runtime (Deno)
- Studio UI (http://localhost:54323)

### 2. 运行 Edge Function

```bash
# 在一个新终端
supabase functions serve auth-privy --env-file supabase/.env.local

# 或者运行所有 functions
supabase functions serve --env-file supabase/.env.local
```

### 3. 创建本地环境变量

创建 `supabase/.env.local`：

```env
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret
```

**注意**：`SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 会自动提供。

### 4. 测试 Edge Function

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/auth-privy' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"privyToken":"test-token","user":{"id":"did:privy:test","wallet":{"address":"0x123"}}}'
```

---

## 部署到生产环境

### 方法 1: 使用 Supabase CLI（推荐）

#### 1. 配置环境变量

在 Supabase Dashboard 中设置 secrets：

```bash
# 方法 A: 使用 CLI
supabase secrets set PRIVY_APP_ID=your-privy-app-id
supabase secrets set PRIVY_APP_SECRET=your-privy-app-secret

# 方法 B: 在 Dashboard 中设置
# https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions
```

#### 2. 部署 Edge Function

```bash
# 部署单个 function
supabase functions deploy auth-privy

# 或部署所有 functions
supabase functions deploy
```

#### 3. 验证部署

```bash
# 查看部署的 functions
supabase functions list

# 查看日志
supabase functions logs auth-privy
```

### 方法 2: 通过 GitHub Actions 自动部署

创建 `.github/workflows/deploy-edge-functions.yml`：

```yaml
name: Deploy Edge Functions

on:
  push:
    branches: [main]
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy Edge Functions
        run: supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

需要在 GitHub Settings → Secrets 中添加：
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`

---

## 配置前端调用

Edge Function 部署后，URL 格式为：

```
https://your-project-ref.supabase.co/functions/v1/auth-privy
```

前端调用示例（已在 `lib/hooks/useAuth.ts` 中实现）：

```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-privy`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      privyToken,
      user: { id, wallet, email },
    }),
  }
);
```

---

## 监控和调试

### 查看日志

```bash
# 实时查看日志
supabase functions logs auth-privy --follow

# 查看最近 100 条日志
supabase functions logs auth-privy --limit 100
```

### 在 Dashboard 中查看

访问：https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions/auth-privy/logs

### 常见错误排查

#### 1. CORS 错误

**症状**：前端报 CORS 错误
**解决**：检查 Edge Function 中的 `corsHeaders` 配置

#### 2. 401 Unauthorized

**症状**：调用返回 401
**原因**：
- PRIVY_APP_SECRET 配置错误
- Privy token 过期
- Token 格式不正确

**解决**：
```bash
# 检查 secrets
supabase secrets list

# 更新 secret
supabase secrets set PRIVY_APP_SECRET=correct-secret
```

#### 3. 500 Internal Server Error

**症状**：Edge Function 崩溃
**解决**：
```bash
# 查看详细日志
supabase functions logs auth-privy --limit 50

# 检查数据库连接
supabase db inspect
```

---

## 性能优化

### 1. 使用 Edge Caching

```typescript
// 在 Edge Function 中添加缓存头
return new Response(JSON.stringify(data), {
  headers: {
    ...corsHeaders,
    'Cache-Control': 'public, max-age=60', // 缓存 60 秒
  },
});
```

### 2. 连接池优化

Supabase 自动管理数据库连接池，但可以优化查询：

```typescript
// 使用 select() 只获取需要的字段
.select('privy_user_id, wallet_address, email, role')

// 使用索引
// 确保 privy_user_id 有索引（迁移脚本中已包含）
```

### 3. 并行处理

```typescript
// 如果有多个独立操作，使用 Promise.all
const [user, metadata] = await Promise.all([
  supabase.from('users').select('*').single(),
  fetchExternalData(),
]);
```

---

## 安全最佳实践

### 1. 验证输入

```typescript
// 在 Edge Function 中验证所有输入
if (!privyToken || typeof privyToken !== 'string') {
  return new Response('Invalid input', { status: 400 });
}
```

### 2. 限流

在 Supabase Dashboard 中配置：
- 访问 Settings → Functions → Rate Limiting
- 建议：100 requests/minute per IP

### 3. 使用 Service Role Key 的注意事项

⚠️ **重要**：Service Role Key 绕过 RLS，只在 Edge Function 中使用！

```typescript
// ✅ 好的做法：在 Edge Function 中使用
const supabase = createClient(url, SERVICE_ROLE_KEY);

// ❌ 坏的做法：永远不要在前端暴露
// const supabase = createClient(url, SERVICE_ROLE_KEY); // 前端代码
```

---

## 成本估算

Supabase Edge Functions 定价（截至 2026年）：

- **免费套餐**：500K 请求/月
- **Pro 套餐**：2M 请求/月（包含）
- **超出部分**：$2 per 1M requests

**估算**：
- 1000 日活用户
- 每天登录 2 次
- 每月请求：1000 × 2 × 30 = 60K ✅ 在免费额度内

---

## 回滚策略

如果新版本有问题，快速回滚：

```bash
# 查看历史版本
supabase functions history auth-privy

# 回滚到特定版本
supabase functions rollback auth-privy --version <version-id>
```

---

## 下一步

- [ ] 部署 Edge Function 到测试环境
- [ ] 配置环境变量
- [ ] 测试完整认证流程
- [ ] 设置监控和告警
- [ ] 部署到生产环境

---

## 参考资源

- [Supabase Edge Functions 官方文档](https://supabase.com/docs/guides/functions)
- [Deno 官方文档](https://deno.land/manual)
- [Privy API 文档](https://docs.privy.io)

---

## 需要帮助？

遇到问题请查看：
1. Edge Function 日志：`supabase functions logs auth-privy`
2. Supabase Dashboard → Functions → Logs
3. 本项目的 `docs/AUTH_INTEGRATION.md`
