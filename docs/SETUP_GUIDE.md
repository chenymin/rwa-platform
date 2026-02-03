# Art RWA Platform - 认证集成设置指南

## ✅ 已完成的工作

### 1. 前端界面优化
- ✅ 创建专业的 Landing Page（Hero + Features + How it Works）
- ✅ 优化导航栏，改为中文界面
- ✅ 将"提交作品"改名为"作品管理"
- ✅ 登录按钮改为下拉菜单样式，显示钱包地址/邮箱
- ✅ 创建 /gallery、/about 页面

### 2. Privy + Supabase 认证架构
- ✅ 创建数据库迁移文件（002_update_users_for_privy.sql）
- ✅ users 表使用 privy_user_id 作为主键
- ✅ 创建认证 API 端点（/api/auth/privy）
- ✅ 实现用户自动创建/更新逻辑
- ✅ 创建认证 Hook（useAuth）
- ✅ 安装并配置 @privy-io/node 包
- ✅ 创建完整的认证文档（AUTH_INTEGRATION.md）

---

## 📋 接下来需要做的事情

### 第一步：运行数据库迁移

1. 连接到 Supabase 数据库：

```bash
# 方法1: 使用 Supabase CLI
supabase db push

# 方法2: 在 Supabase Dashboard 中执行
# 1. 打开 https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
# 2. 复制并执行 supabase/migrations/002_update_users_for_privy.sql
```

⚠️ **注意**：这个迁移会删除并重建 users 表，确保备份现有数据！

### 第二步：配置环境变量

确保 `.env` 文件包含：

```env
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=cmko6jj3200dljv0cv4doct1p
PRIVY_APP_SECRET=你的_privy_app_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nfjkrddcteplefvmcvgp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**获取 Privy App Secret**：
1. 访问 https://dashboard.privy.io
2. 选择你的应用
3. 进入 Settings → API Keys
4. 复制 App Secret

### 第三步：更新 ConnectButton 组件

需要更新现有的 ConnectButton 使用新的 useAuth hook：

```typescript
// components/wallet/connect-button.tsx
import { useAuth } from '@/lib/hooks/useAuth';

export function ConnectButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { user, loading, error } = useAuth();

  // ... 组件逻辑
}
```

### 第四步：测试认证流程

1. 启动开发服务器（已经在运行）：
```bash
npm run dev
```

2. 打开浏览器访问 http://localhost:3003

3. 测试流程：
   - 点击"登录"按钮
   - 使用钱包或邮箱登录
   - 检查浏览器 Console 是否有错误
   - 检查 localStorage 中的 `supabase_session`
   - 验证下拉菜单显示正确

### 第五步：设置管理员账户

登录后，你需要将自己设置为管理员：

1. 获取你的 Privy User ID（从浏览器 Console 或 localStorage）

2. 在 Supabase Dashboard 中执行：
```sql
UPDATE users
SET role = 'admin', is_verified = true
WHERE privy_user_id = '你的_privy_user_id';
```

3. 刷新页面，验证管理员权限

---

## 🔧 可选：启用真实的 Token 验证

当前的认证 API 中 token 验证被注释掉了（为了快速测试）。

生产环境中需要启用：

```typescript
// app/api/auth/privy/route.ts

import { verifyPrivyToken } from '@/lib/privy-server';

// 取消注释这部分代码
const verificationResult = await verifyPrivyToken(privyToken);
if (!verificationResult.success) {
  return NextResponse.json(
    { error: 'Invalid Privy token' },
    { status: 401 }
  );
}
```

---

## 📚 重要文档

- **认证集成文档**：`docs/AUTH_INTEGRATION.md`
- **数据库迁移**：`supabase/migrations/002_update_users_for_privy.sql`
- **认证 API**：`app/api/auth/privy/route.ts`
- **认证 Hook**：`lib/hooks/useAuth.ts`

---

## 🐛 常见问题

### Q1: 登录后没有保存 session

**原因**：API 调用失败或 Privy token 获取失败

**解决**：
1. 检查浏览器 Console 错误
2. 验证环境变量是否正确
3. 检查 `/api/auth/privy` 返回的响应

### Q2: 数据库迁移失败

**原因**：可能有现有数据或外键约束

**解决**：
1. 先备份 users 表数据
2. 手动删除相关约束
3. 重新运行迁移

### Q3: Token 验证失败

**原因**：PRIVY_APP_SECRET 配置错误

**解决**：
1. 从 Privy Dashboard 重新获取 App Secret
2. 确保 secret 没有多余的空格或换行
3. 重启开发服务器

---

## 🚀 下一步优化

1. [ ] 完善 token 验证逻辑
2. [ ] 添加 token 刷新机制
3. [ ] 实现 JWT 作为 session token
4. [ ] 添加 API 限流
5. [ ] 完善错误处理和用户提示
6. [ ] 添加单元测试

---

## 📞 需要帮助？

如果遇到问题，请检查：
1. 浏览器 Console 日志
2. 服务器终端日志
3. Supabase Dashboard 中的 Logs
4. Privy Dashboard 中的 Analytics

记得查看 `docs/AUTH_INTEGRATION.md` 获取完整的技术细节！
