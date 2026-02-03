# 数据库表关系文档

## 数据库 ER 图

```
┌─────────────────┐
│     users       │ (核心用户表)
│─────────────────│
│ privy_user_id PK│←─────────────────────────┐
│ auth_user_id    │                          │
│ wallet_address  │                          │
│ email           │                          │
│ role            │                          │
└─────────────────┘                          │
        │ 1                                  │
        │                                    │
        │ 1                                  │
        ↓                                    │
┌─────────────────┐                          │
│    artists      │ (艺术家档案)              │
│─────────────────│                          │
│ id           PK │                          │
│ privy_user_id FK│──────────────────────────┘
│ artist_name     │
│ artist_bio      │
│ verified_artist │
│ social_media    │
└─────────────────┘
        │ 1
        │
        │ N
        ↓
┌─────────────────────────┐
│       artworks          │ (艺术作品)
│─────────────────────────│
│ id                   PK │
│ artist_id            FK │─────→ artists(id)
│ submitted_by         FK │─────→ users(privy_user_id)
│ reviewed_by          FK │─────→ users(privy_user_id)
│ contract_address        │
│ title                   │
│ token_name              │
│ status                  │
└─────────────────────────┘
        │ 1                      │ 1
        │                        │
        │ N                      │ N
        ↓                        ↓
┌──────────────────┐    ┌──────────────────────┐
│ price_snapshots  │    │ transaction_records  │ (交易流水)
│──────────────────│    │──────────────────────│
│ id            PK │    │ id                PK │
│ contract_addr FK │    │ artwork_id        FK │─→ artworks(id)
│ price_usd        │    │ artist_id         FK │─→ artists(id)
│ price_bnb        │    │ user_id           FK │─→ users(privy_user_id)
│ volume_24h       │    │ counterparty_id   FK │─→ users(privy_user_id)
└──────────────────┘    │ transaction_type     │
         ↑              │ amount               │
         │              │ currency             │
         │              │ transaction_hash     │
         │              │ status               │
         │              └──────────────────────┘
         │
         │
         └──────── artworks(contract_address)


┌─────────────────┐
│  user_wallets   │ (用户钱包)
│─────────────────│
│ id           PK │
│ user_id      FK │─────→ users(privy_user_id)
│ currency        │
│ balance         │
│ locked_balance  │
└─────────────────┘
         ↑
         │ 1
         │
         │ N
    users(privy_user_id)
```

## 表关系详细说明

### 1. users → artists (一对一)

**关系类型**: 1:1 (可选)
- **关联字段**: `artists.privy_user_id` → `users.privy_user_id`
- **删除策略**: `ON DELETE CASCADE`
- **说明**: 用户可以选择成为艺术家，创建艺术家档案

**业务逻辑**:
```sql
-- 用户注册后，role='user'
-- 如果要成为艺术家，需要：
1. 将 users.role 更新为 'artist'
2. 在 artists 表中创建对应记录
```

---

### 2. artists → artworks (一对多)

**关系类型**: 1:N
- **关联字段**: `artworks.artist_id` → `artists.id`
- **删除策略**: `ON DELETE SET NULL`
- **说明**: 一个艺术家可以创建多个作品

**业务场景**:
- 艺术家提交新作品 → `artworks.artist_id` 指向该艺术家
- 艺术家被删除 → 作品保留，但 `artist_id` 置为 NULL

---

### 3. users → artworks (一对多，多重关系)

#### 3a. 作品提交关系
**关系类型**: 1:N
- **关联字段**: `artworks.submitted_by` → `users.privy_user_id`
- **删除策略**: `ON DELETE SET NULL`
- **说明**: 记录谁提交了这个作品

#### 3b. 作品审核关系
**关系类型**: 1:N
- **关联字段**: `artworks.reviewed_by` → `users.privy_user_id`
- **删除策略**: `ON DELETE SET NULL`
- **说明**: 记录管理员审核人

**业务流程**:
```
1. Artist 提交作品 → submitted_by = artist_user_id, status = 'pending'
2. Admin 审核作品 → reviewed_by = admin_user_id, status = 'approved'/'rejected'
```

---

### 4. artworks → price_snapshots (一对多)

**关系类型**: 1:N
- **关联字段**: `price_snapshots.contract_address` → `artworks.contract_address`
- **删除策略**: `ON DELETE CASCADE`
- **说明**: 一个作品有多个历史价格快照

**业务场景**:
- 作品铸造后获得合约地址
- 定时任务定期抓取价格数据 → 插入 price_snapshots
- 用于展示价格走势图

---

### 5. users → user_wallets (一对多)

**关系类型**: 1:N
- **关联字段**: `user_wallets.user_id` → `users.privy_user_id`
- **删除策略**: `ON DELETE CASCADE`
- **唯一约束**: `UNIQUE(user_id, currency)`
- **说明**: 每个用户每种币种一个钱包

**数据结构**:
```sql
-- 用户有多个币种的钱包
user_id: 'user123'
  ├─ BNB:  balance=10.5,  locked=2.0
  ├─ ETH:  balance=1.23,  locked=0.5
  └─ USDT: balance=1000,  locked=0
```

**业务操作**:
- 用户充值 → `balance += amount`
- 创建订单 → `locked_balance += order_amount`
- 订单成交 → `locked_balance -= order_amount`, `balance -= order_amount`

---

### 6. users → transaction_records (一对多，双重关系)

#### 6a. 交易发起者
**关系类型**: 1:N
- **关联字段**: `transaction_records.user_id` → `users.privy_user_id`
- **删除策略**: `ON DELETE SET NULL`
- **说明**: 发起交易的用户

#### 6b. 交易对手方
**关系类型**: 1:N
- **关联字段**: `transaction_records.counterparty_id` → `users.privy_user_id`
- **删除策略**: `ON DELETE SET NULL`
- **说明**: P2P 交易中的另一方

**业务场景**:
```sql
-- 场景1: 用户A购买用户B的作品
INSERT INTO transaction_records (
  transaction_type = 'buy',
  user_id = 'userA',           -- 买家
  counterparty_id = 'userB',   -- 卖家
  artwork_id = 'artwork123',
  amount = 100
);

-- 场景2: 用户充值（无对手方）
INSERT INTO transaction_records (
  transaction_type = 'deposit',
  user_id = 'userA',
  counterparty_id = NULL,
  amount = 1000
);
```

---

### 7. artworks → transaction_records (一对多)

**关系类型**: 1:N
- **关联字段**: `transaction_records.artwork_id` → `artworks.id`
- **删除策略**: `ON DELETE SET NULL`
- **说明**: 一个作品可以有多笔交易记录

**交易类型**:
- `buy` - 购买该作品的代币
- `sell` - 出售该作品的代币
- `platform_fee` - 该作品交易产生的手续费

---

### 8. artists → transaction_records (一对多)

**关系类型**: 1:N
- **关联字段**: `transaction_records.artist_id` → `artists.id`
- **删除策略**: `ON DELETE SET NULL`
- **说明**: 艺术家的作品交易记录（用于统计收益）

**业务用途**:
```sql
-- 查询艺术家总收益
SELECT artist_id, SUM(amount) as total_sales
FROM transaction_records
WHERE transaction_type = 'sell'
  AND artist_id = 'artist123'
GROUP BY artist_id;
```

---

## 数据完整性策略总结

| 表名 | 删除策略 | 原因 |
|------|---------|------|
| artists → users | CASCADE | 用户删除，艺术家档案也应删除 |
| artworks → artists | SET NULL | 保留作品历史记录 |
| artworks → users | SET NULL | 保留作品历史记录 |
| price_snapshots → artworks | CASCADE | 作品删除，价格数据无意义 |
| user_wallets → users | CASCADE | 用户删除，钱包数据也应删除 |
| transaction_records → * | SET NULL | 保留交易历史，但解除关联 |

---

## 常用查询示例

### 查询用户的所有资产
```sql
SELECT
  u.privy_user_id,
  u.email,
  uw.currency,
  uw.balance,
  uw.locked_balance,
  (uw.balance + uw.locked_balance) as total_balance
FROM users u
LEFT JOIN user_wallets uw ON u.privy_user_id = uw.user_id
WHERE u.privy_user_id = 'user123';
```

### 查询艺术家的所有作品和交易
```sql
SELECT
  a.artist_name,
  aw.title,
  aw.status,
  COUNT(tr.id) as transaction_count,
  SUM(tr.amount) as total_volume
FROM artists a
JOIN artworks aw ON a.id = aw.artist_id
LEFT JOIN transaction_records tr ON aw.id = tr.artwork_id
WHERE a.privy_user_id = 'artist123'
GROUP BY a.artist_name, aw.title, aw.status;
```

### 查询用户交易历史（包括作为买家和卖家）
```sql
SELECT
  tr.transaction_type,
  tr.amount,
  tr.currency,
  tr.status,
  tr.created_at,
  CASE
    WHEN tr.user_id = 'user123' THEN 'initiator'
    WHEN tr.counterparty_id = 'user123' THEN 'counterparty'
  END as role,
  aw.title as artwork_title
FROM transaction_records tr
LEFT JOIN artworks aw ON tr.artwork_id = aw.id
WHERE tr.user_id = 'user123'
   OR tr.counterparty_id = 'user123'
ORDER BY tr.created_at DESC;
```

---

## 表统计

| 表名 | 外键数量 | 被引用次数 | 关系复杂度 |
|------|---------|-----------|-----------|
| users | 0 | 8 | ⭐⭐⭐⭐⭐ 核心表 |
| artists | 1 | 2 | ⭐⭐⭐ 中等 |
| artworks | 3 | 2 | ⭐⭐⭐⭐ 复杂 |
| price_snapshots | 1 | 0 | ⭐ 简单 |
| user_wallets | 1 | 0 | ⭐⭐ 简单 |
| transaction_records | 4 | 0 | ⭐⭐⭐⭐ 复杂 |

---

## 数据流示例

### 完整交易流程

```
1. 用户注册
   └─> INSERT INTO users (privy_user_id, role='user')

2. 成为艺术家
   ├─> UPDATE users SET role='artist'
   └─> INSERT INTO artists (privy_user_id, artist_name, ...)

3. 充值
   ├─> INSERT INTO transaction_records (type='deposit', user_id, amount)
   └─> INSERT/UPDATE user_wallets (balance += amount)

4. 提交作品
   └─> INSERT INTO artworks (artist_id, submitted_by, status='pending')

5. 管理员审核
   └─> UPDATE artworks SET status='approved', reviewed_by='admin123'

6. 铸造NFT（后端服务）
   └─> UPDATE artworks SET contract_address='0x...'

7. 购买作品
   ├─> 锁定买家余额: UPDATE user_wallets SET locked_balance += amount
   ├─> 创建交易记录: INSERT INTO transaction_records (type='buy', user_id=buyer, artwork_id, ...)
   ├─> 区块链交易确认: UPDATE transaction_records SET status='confirming', confirmations++
   ├─> 交易完成:
   │   ├─> UPDATE user_wallets SET balance -= amount, locked_balance -= amount (买家)
   │   ├─> UPDATE user_wallets SET balance += amount (卖家)
   │   └─> UPDATE transaction_records SET status='completed'
   └─> 更新艺术家统计: TRIGGER updates artists.total_artworks

8. 价格追踪（定时任务）
   └─> INSERT INTO price_snapshots (contract_address, price_usd, price_bnb, ...)
```

---

**文档版本**: v1.0
**最后更新**: 2026-01-29
**数据库版本**: PostgreSQL 14+ with Supabase
