-- 007: 创建交易记录表
-- 用于存储从链上同步的交易数据

-- 1. 创建交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 链上数据
  tx_hash VARCHAR(66) UNIQUE NOT NULL,
  block_number BIGINT NOT NULL,
  block_hash VARCHAR(66) NOT NULL,  -- 用于 reorg 检测
  block_timestamp TIMESTAMPTZ NOT NULL,
  gas_used BIGINT,
  gas_price NUMERIC(78, 0),

  -- 事件类型: 'mint', 'transfer', 'approval'
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('mint', 'transfer', 'approval')),

  -- 地址信息
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42) NOT NULL,

  -- 金额（以最小单位存储）
  token_amount NUMERIC(78, 0),        -- ART 代币数量 (18 decimals)
  usdt_amount NUMERIC(78, 0),         -- USDT 金额 (6 decimals, 仅 mint 时有值)

  -- 关联用户（通过 from_address 自动关联）
  user_privy_id VARCHAR(255) REFERENCES users(privy_user_id) ON DELETE SET NULL,

  -- 合约地址（支持未来多合约）
  contract_address VARCHAR(42) NOT NULL,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_transactions_user_privy_id ON transactions(user_privy_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(LOWER(from_address));
CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON transactions(LOWER(to_address));
CREATE INDEX IF NOT EXISTS idx_transactions_event_type ON transactions(event_type);
CREATE INDEX IF NOT EXISTS idx_transactions_block_timestamp ON transactions(block_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_block_number ON transactions(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_block_hash ON transactions(block_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_contract ON transactions(contract_address);

-- 复合索引：用户+时间（常用查询）
CREATE INDEX IF NOT EXISTS idx_transactions_user_time ON transactions(user_privy_id, block_timestamp DESC);

-- 3. 创建同步状态表
CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  contract_address VARCHAR(42) NOT NULL,
  last_synced_block BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 确保每个合约只有一行记录
  UNIQUE(contract_address)
);

-- 4. 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- 5. RLS 策略
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的交易记录
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  USING (
    -- 通过 privy_user_id 关联
    user_privy_id IN (
      SELECT privy_user_id FROM users WHERE auth_user_id = auth.uid()
    )
    -- 或者通过钱包地址匹配
    OR LOWER(from_address) IN (
      SELECT LOWER(wallet_address) FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- 服务角色可以插入（Edge Function 使用）
CREATE POLICY "Service role can insert transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (true);

-- 服务角色可以更新
CREATE POLICY "Service role can update transactions"
  ON transactions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- sync_state 表的 RLS
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- 只有服务角色可以操作 sync_state
CREATE POLICY "Service role can manage sync_state"
  ON sync_state
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. 创建函数：根据钱包地址关联用户
CREATE OR REPLACE FUNCTION link_transaction_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 通过 from_address 查找用户
  SELECT privy_user_id INTO NEW.user_privy_id
  FROM users
  WHERE LOWER(wallet_address) = LOWER(NEW.from_address)
  LIMIT 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_link_transaction_user
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION link_transaction_to_user();

-- 7. 注释
COMMENT ON TABLE transactions IS '链上交易记录表';
COMMENT ON COLUMN transactions.tx_hash IS '交易哈希';
COMMENT ON COLUMN transactions.event_type IS '事件类型: mint(购买), transfer(转账), approval(授权)';
COMMENT ON COLUMN transactions.token_amount IS 'ART 代币数量 (18 decimals)';
COMMENT ON COLUMN transactions.usdt_amount IS 'USDT 金额 (6 decimals), 仅 mint 时有值';
COMMENT ON COLUMN transactions.user_privy_id IS '关联用户的 Privy ID';
COMMENT ON TABLE sync_state IS '链上同步状态表';
