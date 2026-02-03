# Art RWA Platform - 快速开始指南

## 🎯 目标

将 Privy 认证集成到 Supabase Edge Function 中，实现安全、高性能的用户认证。

---

## ✅ 已完成的工作

### 1. 前端界面
- ✅ Landing Page（Hero + Features + How it Works）
- ✅ 中文导航栏
- ✅ 登录按钮下拉菜单
- ✅ Gallery、About 页面

### 2. 认证架构
- ✅ Supabase Edge Function (`supabase/functions/auth-privy/`)
- ✅ 数据库迁移脚本 (`supabase/migrations/002_update_users_for_privy.sql`)
- ✅ 前端认证 Hook (`lib/hooks/useAuth.ts`)
- ✅ 配置文件 (`supabase/config.toml`)

---

## 🚀 快速部署（5 步）

### 第 1 步：安装 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# 或使用 npm
npm install -g supabase

# 验证安装
supabase --version
```

### 第 2 步：登录并链接项目

```bash
# 登录
supabase login

# 链接到你的项目
supabase link --project-ref nfjkrddcteplefvmcvgp
```

### 第 3 步：运行数据库迁移

```bash
# 方法 A: 使用 CLI（推荐）
supabase db push

# 方法 B: 在 Supabase Dashboard 中手动执行
# https://supabase.com/dashboard/project/nfjkrddcteplefvmcvgp/sql/new
# 复制并执行 supabase/migrations/002_update_users_for_privy.sql
```

### 第 4 步：配置环境变量

```bash
# 在 Supabase 中设置 secrets (V3 只需要3个变量)
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set PRIVY_APP_ID=cmko6jj3200dljv0cv4doct1p

# 验证配置
supabase secrets list
```

**获取环境变量**：
1. **SUPABASE_URL**: Supabase Dashboard → Settings → API → Project URL
2. **SUPABASE_SERVICE_ROLE_KEY**: Supabase Dashboard → Settings → API → service_role key
3. **PRIVY_APP_ID**: Privy Dashboard → Settings → App ID

**V3 不再需要**：
- ❌ `PRIVY_APP_SECRET` - 只验证 token，不需要 secret
- ❌ `SUPABASE_JWT_SECRET` - 使用 Auth API，不手动签名

### 第 5 步：部署 Edge Function

```bash
# 部署
supabase functions deploy auth-privy

# 验证部署
supabase functions list

# 查看日志
supabase functions logs auth-privy
```

---

## 🧪 测试

### 1. 本地测试

```bash
# 启动本地 Supabase
supabase start

# 运行 Edge Function
supabase functions serve auth-privy --env-file supabase/.env.local

# 在另一个终端测试
curl -X POST 'http://localhost:54321/functions/v1/auth-privy' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"privyToken":"test","user":{"id":"did:privy:test"}}'
```

### 2. 前端测试

```bash
# 启动 Next.js 开发服务器（如果未运行）
npm run dev

# 访问 http://localhost:3003
# 点击"登录"按钮
# 使用 Privy 登录
# 检查浏览器 Console 和 Network 标签
```

### 3. 验证数据

登录成功后，在 Supabase Dashboard 中查看：

```sql
-- 查看 users 表
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- 查找你的用户
SELECT * FROM users WHERE privy_user_id LIKE '%your-id%';
```

---

## 🔧 设置管理员

登录后，将你的账户设为管理员：

```sql
-- 在 Supabase SQL Editor 中执行
UPDATE users
SET role = 'admin', is_verified = true
WHERE privy_user_id = 'your-privy-user-id';

-- 验证
SELECT privy_user_id, role, is_verified FROM users WHERE role = 'admin';
```

**获取你的 privy_user_id**：
- 登录后查看浏览器 Console
- 或查看 localStorage 中的 `supabase_user`

---

## 📊 监控和调试

### 查看 Edge Function 日志

```bash
# 实时日志
supabase functions logs auth-privy --follow

# 最近 50 条
supabase functions logs auth-privy --limit 50
```

### 在 Dashboard 中查看

https://supabase.com/dashboard/project/nfjkrddcteplefvmcvgp/functions/auth-privy/logs

### 常见问题

#### Q1: Edge Function 返回 401

**原因**：PRIVY_APP_SECRET 配置错误或 token 无效

**解决**：
```bash
# 检查 secrets
supabase secrets list

# 更新
supabase secrets set PRIVY_APP_SECRET=correct-secret

# 重新部署
supabase functions deploy auth-privy
```

#### Q2: 前端报 CORS 错误

**原因**：Edge Function CORS 配置问题

**解决**：检查 `supabase/functions/auth-privy/index.ts` 中的 `corsHeaders`

#### Q3: 用户创建失败

**原因**：数据库迁移未执行或 users 表结构不正确

**解决**：
```bash
# 重新运行迁移
supabase db push

# 或在 Dashboard 中手动检查表结构
```

---

## 🎨 前端集成

认证 Hook 已经更新为调用 Edge Function：

```typescript
// lib/hooks/useAuth.ts
const response = await fetch(
  `${supabaseUrl}/functions/v1/auth-privy`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ privyToken, user }),
  }
);
```

在组件中使用：

```typescript
import { useAuth } from '@/lib/hooks/useAuth';

function MyComponent() {
  const { user, authenticated, loading, isAdmin } = useAuth();

  if (loading) return <div>加载中...</div>;
  if (!authenticated) return <div>请登录</div>;

  return <div>欢迎, {user?.wallet_address}</div>;
}
```

---

## 📁 项目文件结构

```
art-rwa-platform/
├── supabase/
│   ├── functions/
│   │   ├── auth-privy/
│   │   │   └── index.ts          # Edge Function 主文件
│   │   └── .env.example          # 环境变量示例
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_update_users_for_privy.sql  # Privy 集成迁移
│   └── config.toml               # Supabase 配置
├── lib/
│   └── hooks/
│       └── useAuth.ts            # 认证 Hook
├── docs/
│   ├── AUTH_INTEGRATION.md       # 认证架构文档
│   ├── EDGE_FUNCTION_DEPLOYMENT.md  # 部署指南
│   └── QUICKSTART.md            # 本文件
└── .env                          # 环境变量
```

---

## 🔐 安全检查清单

部署前确保：

- [ ] `PRIVY_APP_SECRET` 已设置且正确
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 未在前端暴露
- [ ] 数据库 RLS 策略已启用
- [ ] Edge Function 已部署到生产环境
- [ ] 监控和日志已配置
- [ ] 备份策略已设置

---

## 📖 相关文档

- **完整认证文档**：`docs/AUTH_INTEGRATION.md`
- **Edge Function 详细指南**：`docs/EDGE_FUNCTION_DEPLOYMENT.md`
- **设置指南**：`docs/SETUP_GUIDE.md`

---

## 🆘 需要帮助？

1. 查看 Edge Function 日志：`supabase functions logs auth-privy`
2. 检查浏览器 Console 错误
3. 参考文档：`docs/` 目录
4. Supabase Dashboard → Functions → Logs

---

## 🎉 完成！

认证系统已经配置完成。现在你可以：

1. ✅ 用户通过 Privy 登录（钱包/邮箱）
2. ✅ Edge Function 验证 token
3. ✅ 自动创建/更新 Supabase 用户记录
4. ✅ 前端获取用户信息和权限
5. ✅ 基于角色的访问控制（RLS）

开始构建你的艺术品 RWA 平台吧！🚀
