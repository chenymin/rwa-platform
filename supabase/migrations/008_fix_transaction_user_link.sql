-- 008: 修复交易用户关联触发器
-- 问题: 原触发器只检查 from_address，但 mint 事件的 from_address 是零地址
-- 修复: 对于 mint 事件检查 to_address，对于其他事件优先检查 from_address

-- 删除旧触发器
DROP TRIGGER IF EXISTS trigger_link_transaction_user ON transactions;

-- 重新创建触发器函数
CREATE OR REPLACE FUNCTION link_transaction_to_user()
RETURNS TRIGGER AS $$
DECLARE
  zero_address VARCHAR(42) := '0x0000000000000000000000000000000000000000';
BEGIN
  -- 对于 mint 事件 (from_address 是零地址)，通过 to_address 查找用户
  IF LOWER(NEW.from_address) = zero_address THEN
    SELECT privy_user_id INTO NEW.user_privy_id
    FROM users
    WHERE LOWER(wallet_address) = LOWER(NEW.to_address)
    LIMIT 1;
  ELSE
    -- 对于其他事件，优先通过 from_address 查找
    SELECT privy_user_id INTO NEW.user_privy_id
    FROM users
    WHERE LOWER(wallet_address) = LOWER(NEW.from_address)
    LIMIT 1;

    -- 如果 from_address 没有匹配，尝试 to_address
    IF NEW.user_privy_id IS NULL THEN
      SELECT privy_user_id INTO NEW.user_privy_id
      FROM users
      WHERE LOWER(wallet_address) = LOWER(NEW.to_address)
      LIMIT 1;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 重新创建触发器
CREATE TRIGGER trigger_link_transaction_user
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION link_transaction_to_user();

-- 更新现有的 NULL user_privy_id 记录
-- 对于 mint 事件，通过 to_address 匹配
UPDATE transactions t
SET user_privy_id = u.privy_user_id
FROM users u
WHERE t.user_privy_id IS NULL
  AND LOWER(t.from_address) = '0x0000000000000000000000000000000000000000'
  AND LOWER(u.wallet_address) = LOWER(t.to_address);

-- 对于其他事件，先通过 from_address 匹配
UPDATE transactions t
SET user_privy_id = u.privy_user_id
FROM users u
WHERE t.user_privy_id IS NULL
  AND LOWER(t.from_address) != '0x0000000000000000000000000000000000000000'
  AND LOWER(u.wallet_address) = LOWER(t.from_address);

-- 剩余的尝试通过 to_address 匹配
UPDATE transactions t
SET user_privy_id = u.privy_user_id
FROM users u
WHERE t.user_privy_id IS NULL
  AND LOWER(u.wallet_address) = LOWER(t.to_address);

-- 注释
COMMENT ON FUNCTION link_transaction_to_user() IS '自动关联交易到用户: mint事件检查to_address, 其他事件优先from_address';
