# 部署检查清单 - V3 Final

快速部署指南，按顺序执行。

---

## ✅ 部署前准备

### 1. 升级 Node.js (必需)
```bash
# 检查当前版本
node --version

# 如果 < 20.0.0，使用 nvm 升级
nvm install 20
nvm use 20

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 2. 配置本地环境变量
创建 `.env` 文件：
```bash
# 从 Supabase Dashboard 获取
NEXT_PUBLIC_SUPABASE_URL=https://nfjkrddcteplefvmcvgp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key

# 从 Privy Dashboard 获取
NEXT_PUBLIC_PRIVY_APP_ID=cmko6jj3200dljv0cv4doct1p
```

**获取方式**：
- Supabase Dashboard: https://supabase.com/dashboard/project/nfjkrddcteplefvmcvgp/settings/api
- Privy Dashboard: https://dashboard.privy.io

---

## 🗄️ 数据库部署

### 1. 登录并链接项目
```bash
# 登录 Supabase
supabase login

# 链接到项目
supabase link --project-ref nfjkrddcteplefvmcvgp
```

### 2. 运行数据库迁移
```bash
# 执行所有迁移
supabase db push

# 验证迁移成功
supabase db diff
```

**迁移包括**：
- ✅ `002_update_users_for_privy.sql` - 更新 users 表结构
- ✅ `003_add_auth_user_id.sql` - 添加 Auth 集成

### 3. 验证数据库
```sql
-- 在 Supabase SQL Editor 中执行

-- 检查 users 表结构
\d users;

-- 应该看到这些字段：
-- privy_user_id (主键)
-- auth_user_id (UUID, unique)
-- wallet_address
-- email
-- role
-- ...

-- 检查索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users';

-- 应该看到 idx_users_auth_user_id
```

---

## 🔧 Edge Function 部署

### 1. 配置 Secrets
```bash
# 只需要3个环境变量
supabase secrets set SUPABASE_URL=https://nfjkrddcteplefvmcvgp.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set PRIVY_APP_ID=cmko6jj3200dljv0cv4doct1p

# 验证配置
supabase secrets list

# 应该看到：
# SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY
# PRIVY_APP_ID
```

**注意**: V3 Final 不再需要 `SUPABASE_JWT_SECRET` 和 `PRIVY_APP_SECRET`

### 2. 部署 Edge Function
```bash
# 部署
supabase functions deploy auth-privy

# 验证部署
supabase functions list

# 应该看到 auth-privy 状态为 ACTIVE
```

### 3. 测试 Edge Function
```bash
# 查看实时日志
supabase functions logs auth-privy --follow

# 在另一个终端测试（需要真实的 Privy token）
curl -X POST 'https://nfjkrddcteplefvmcvgp.supabase.co/functions/v1/auth-privy' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"privyToken":"your-real-privy-token"}'
```

---

## 🌐 前端部署

### 1. 本地测试
```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3003
# 测试登录流程
```

### 2. 测试认证流程

**步骤**：
1. 点击"登录"按钮
2. 使用 Privy 登录（钱包/邮箱）
3. 检查浏览器 Console
4. 验证用户信息显示

**检查点**：
- [ ] Privy 登录成功
- [ ] Edge Function 调用成功
- [ ] Session token 返回
- [ ] 用户信息正确显示
- [ ] 页面刷新后仍然登录

### 3. 验证数据库记录
```sql
-- 查看 Auth 用户
SELECT id, email, raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 查看自定义用户表
SELECT privy_user_id, auth_user_id, wallet_address, email
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- 验证关联
SELECT
  u.privy_user_id,
  u.auth_user_id,
  u.wallet_address,
  au.email as auth_email
FROM users u
JOIN auth.users au ON u.auth_user_id = au.id
LIMIT 5;
```

---

## 🔐 设置管理员

### 1. 获取你的 Privy User ID
登录后，在浏览器 Console 中执行：
```javascript
localStorage.getItem('supabase_user')
```

复制 `privy_user_id` 的值。

### 2. 设置为管理员
```sql
-- 在 Supabase SQL Editor 中执行
UPDATE users
SET role = 'admin', is_verified = true
WHERE privy_user_id = 'your-privy-user-id';

-- 验证
SELECT privy_user_id, role, is_verified
FROM users
WHERE role = 'admin';
```

---

## 🧪 完整测试

### 1. 认证测试
- [ ] 使用钱包登录
- [ ] 使用邮箱登录
- [ ] 页面刷新保持登录
- [ ] 登出功能正常
- [ ] Token 过期后重新登录

### 2. RLS 策略测试
```sql
-- 设置当前用户上下文（使用你的 auth_user_id）
SET request.jwt.claims = '{"sub": "your-auth-user-id"}';

-- 测试用户表访问
SELECT * FROM users WHERE auth_user_id = auth.uid();

-- 测试 artworks 表访问
SELECT * FROM artworks WHERE submitted_by IN (
  SELECT privy_user_id FROM users WHERE auth_user_id = auth.uid()
);
```

### 3. API 访问测试
```bash
# 使用获取的 access_token 测试
curl -X GET 'https://nfjkrddcteplefvmcvgp.supabase.co/rest/v1/users?select=*' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

---

## 📊 监控

### 查看日志
```bash
# Edge Function 日志
supabase functions logs auth-privy --limit 50

# 实时日志
supabase functions logs auth-privy --follow
```

### Dashboard 监控
- Auth 用户: https://supabase.com/dashboard/project/nfjkrddcteplefvmcvgp/auth/users
- Edge Function: https://supabase.com/dashboard/project/nfjkrddcteplefvmcvgp/functions/auth-privy
- Database: https://supabase.com/dashboard/project/nfjkrddcteplefvmcvgp/editor

---

## ⚠️ 常见问题

### Q1: Edge Function 返回 401
**原因**: Privy token 无效或过期
**解决**:
- 检查 PRIVY_APP_ID 是否正确
- 确认前端传递的是最新的 Privy token
- 查看 Edge Function 日志

### Q2: 用户创建失败
**原因**: 环境变量配置错误
**解决**:
```bash
# 检查 secrets
supabase secrets list

# 重新设置
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...

# 重新部署
supabase functions deploy auth-privy
```

### Q3: RLS 策略不工作
**原因**: JWT token 格式不正确或 auth_user_id 关联错误
**解决**:
```sql
-- 检查 JWT
SELECT auth.uid();

-- 检查用户关联
SELECT auth_user_id FROM users WHERE privy_user_id = 'your-privy-id';

-- 确保两者匹配
```

### Q4: 前端页面报错
**原因**: 环境变量未配置或 Node.js 版本过低
**解决**:
1. 检查 `.env` 文件
2. 升级 Node.js 到 20+
3. 重新安装依赖
4. 重启开发服务器

---

## ✅ 部署完成检查

完成所有步骤后，确认：

### 基础设施
- [ ] Node.js 版本 >= 20.0.0
- [ ] 数据库迁移已执行
- [ ] Edge Function 已部署
- [ ] 环境变量已配置（3个）

### 功能测试
- [ ] 用户可以登录
- [ ] Session 正确创建
- [ ] 数据库记录正确
- [ ] RLS 策略工作
- [ ] 页面刷新保持登录

### 数据验证
- [ ] auth.users 有记录
- [ ] public.users 有记录
- [ ] auth_user_id 正确关联
- [ ] 管理员已设置

---

## 🎉 完成！

部署成功！你的 Art RWA Platform 认证系统已经上线！

**文档参考**：
- V3 架构: `docs/AUTH_IMPLEMENTATION_V3.md`
- V3 Final 总结: `docs/V3_FINAL_SUMMARY.md`
- 升级指南: `docs/V3_UPGRADE_GUIDE.md`
- 快速开始: `docs/QUICKSTART.md`

有问题查看 Edge Function 日志：
```bash
supabase functions logs auth-privy --follow
```
