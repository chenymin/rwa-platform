# V3 升级指南 - Supabase Auth 集成

## 🎯 核心改进

V3 将认证系统完全集成到 Supabase Auth，使用官方 API 生成 token，而不是手动生成 JWT。

---

## 🔑 关键变化

### 1. **用户存储**

**V2**: 仅在自定义 `users` 表中存储用户

**V3**: 双表设计
- `auth.users` (Supabase Auth) - 存储认证信息
- `public.users` (自定义表) - 存储业务信息
- 通过 `auth_user_id` 关联

### 2. **JWT Token**

**V2**:
```json
{
  "sub": "did:privy:abc123",  // ❌ 自定义 ID
  "email": "user@example.com"
}
```

**V3**:
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // ✅ Supabase Auth UUID
  "email": "user@example.com",
  "user_metadata": {
    "privy_user_id": "did:privy:abc123",
    "wallet_address": "0x..."
  }
}
```

### 3. **RLS 策略**

**V2**: 需要自定义函数
```sql
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (privy_user_id = current_setting('request.jwt.claims')::json->>'sub');
```

**V3**: 使用原生 `auth.uid()`
```sql
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (auth.uid() = auth_user_id);  -- ✅ 简单清晰
```

---

## 📋 升级步骤

### 1. 运行数据库迁移

```bash
# 执行新的迁移，添加 auth_user_id 字段
supabase db push
```

这会执行 `003_add_auth_user_id.sql`:
- 添加 `auth_user_id UUID` 字段
- 更新 RLS 策略使用 `auth.uid()`
- 创建索引优化查询

### 2. 重新部署 Edge Function

```bash
# Edge Function 已更新，重新部署
supabase functions deploy auth-privy
```

### 3. 测试认证流程

1. 前端登录（使用 Privy）
2. 检查 Supabase Auth 用户创建：
   ```sql
   SELECT id, email, raw_user_meta_data
   FROM auth.users
   ORDER BY created_at DESC
   LIMIT 5;
   ```
3. 检查自定义表关联：
   ```sql
   SELECT privy_user_id, auth_user_id, wallet_address
   FROM users
   ORDER BY created_at DESC
   LIMIT 5;
   ```

---

## 🔍 验证清单

### ✅ 数据库

- [ ] `users` 表有 `auth_user_id` 字段
- [ ] RLS 策略使用 `auth.uid()`
- [ ] 索引已创建

### ✅ Supabase Auth

- [ ] 用户在 `auth.users` 表中创建
- [ ] `user_metadata` 包含 Privy 信息
- [ ] `auth_user_id` 在自定义表中正确关联

### ✅ JWT Token

- [ ] `sub` 是 UUID 格式
- [ ] `user_metadata` 包含 `privy_user_id`
- [ ] Token 可以通过 `supabase.auth.setSession()` 使用

### ✅ RLS 策略

- [ ] `auth.uid()` 返回正确的 UUID
- [ ] 用户只能访问自己的数据
- [ ] Artworks 策略正常工作

---

## 🚀 优势

### 1. **原生 Supabase 集成**
- 完全兼容 Supabase Auth 生态
- 可以使用 Supabase Dashboard 管理用户
- 支持 Supabase Auth 的所有功能

### 2. **简化的 RLS 策略**
- 使用 `auth.uid()` 而不是复杂的 JWT 解析
- 策略更简洁、更易维护
- 性能更好（Postgres 优化）

### 3. **更好的安全性**
- Token 格式完全符合 Supabase 标准
- Auth 用户由 Supabase 管理
- 自动应用 Supabase 的安全最佳实践

### 4. **灵活性**
- 保留 `privy_user_id` 作为业务主键
- 可以同时支持 Privy 和其他认证方式
- 易于扩展

---

## 🔄 数据流程

```
Privy 登录
    ↓
验证 Privy Token
    ↓
创建/获取 Supabase Auth 用户 (auth.users)
    ├── UUID: 550e8400-...
    ├── email: user@example.com
    └── user_metadata: { privy_user_id, wallet_address }
    ↓
在自定义表中关联 (public.users)
    ├── privy_user_id: did:privy:abc123
    ├── auth_user_id: 550e8400-...
    └── wallet_address, role, etc.
    ↓
生成 JWT (sub = UUID)
    ↓
返回 Session 给前端
    ↓
后续请求使用 JWT
    ↓
RLS 策略通过 auth.uid() 验证权限
```

---

## 🆘 常见问题

### Q1: 旧用户如何迁移？

**A**: Edge Function 自动处理。首次登录时：
1. 查找是否有 `auth_user_id`
2. 如果没有，创建新的 Supabase Auth 用户
3. 更新 `auth_user_id` 字段

### Q2: Privy 用户 ID 还能用吗？

**A**: 可以！
- `privy_user_id` 仍然是业务主键
- 用于 artworks 表的外键关联
- 在 JWT 的 `user_metadata` 中保留

### Q3: 需要修改前端代码吗？

**A**: 不需要！
- 前端仍然使用 `supabase.auth.setSession()`
- Session 格式保持兼容
- 用户信息仍然可以从 `user_metadata` 获取

### Q4: RLS 策略会影响性能吗？

**A**: 不会，反而更快！
- `auth.uid()` 是 Postgres 原生函数
- 比解析 JWT claims 更快
- 结果会被缓存

---

## 📚 相关文档

- **详细架构**: `docs/AUTH_IMPLEMENTATION_V3.md`
- **V2 对比**: `docs/AUTH_IMPLEMENTATION_V2.md`
- **部署指南**: `docs/EDGE_FUNCTION_DEPLOYMENT.md`
- **快速开始**: `docs/QUICKSTART.md`

---

## ✅ 完成！

升级到 V3 后，你的认证系统将：
- ✅ 使用 Supabase Auth API 管理用户
- ✅ 生成标准的 Supabase JWT token
- ✅ 支持原生的 RLS 策略
- ✅ 完全集成到 Supabase 生态系统

开始升级吧！🚀
