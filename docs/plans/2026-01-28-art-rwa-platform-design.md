# 艺术品 RWA 平台设计文档

**项目名称**: Art RWA Platform
**设计日期**: 2026-01-28
**版本**: 1.0

---

## 项目概述

一个基于 BNB Chain 的艺术品 RWA（Real World Asset）平台，允许将实体艺术品代币化为可交易的份额。艺术家提交申请，管理员审核后发行 ERC-20 代币，用户可在 PancakeSwap 等 DEX 上交易这些份额代币。

### 核心功能
- 艺术品展示和浏览
- 艺术家申请提交系统
- 管理员审核和代币发行
- 简单的代币交易（通过外部 DEX）

### 技术栈
- **前端**: Next.js 14 + React + TailwindCSS + shadcn/ui
- **钱包**: Privy (钱包连接器)
- **区块链**: BNB Chain (BSC)
- **智能合约**: Solidity + Hardhat + OpenZeppelin
- **后端**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **存储**: IPFS (Pinata) + Supabase Storage
- **DEX 集成**: PancakeSwap

---

## 一、整体架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  React 页面   │  │ Privy SDK    │  │ Wagmi/Viem   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
           │                    │                  │
           ▼                    ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  Next.js         │  │  Privy Auth      │  │  BNB Chain      │
│  API Routes      │  │  Service         │  │  (BSC)          │
└──────────────────┘  └──────────────────┘  └─────────────────┘
           │                                         │
           ▼                                         ▼
┌──────────────────┐                    ┌─────────────────────┐
│  Supabase        │                    │  智能合约            │
│  - PostgreSQL    │                    │  - Factory          │
│  - Storage       │                    │  - ERC-20 Tokens    │
└──────────────────┘                    └─────────────────────┘
           │
           ▼
┌──────────────────┐
│  IPFS            │
│  (Pinata)        │
└──────────────────┘
```

### 组件说明

**前端层**
- Next.js App Router 架构
- Privy SDK 处理钱包连接和身份认证
- Wagmi + Viem 与智能合约交互
- TailwindCSS + shadcn/ui 提供 UI 组件

**后端层**
- Next.js API Routes 处理业务逻辑
- Supabase PostgreSQL 存储数据
- Supabase Storage 临时存储文件

**区块链层**
- ArtTokenFactory 合约：工厂合约，部署代币
- ArtToken 合约：每件艺术品的 ERC-20 代币

**存储层**
- IPFS: 永久存储艺术品图片、证书
- Supabase: 快速查询和展示

**外部集成**
- PancakeSwap API: 获取代币价格
- PancakeSwap DEX: 用户交易代币

---

## 二、智能合约设计

### 2.1 ArtTokenFactory.sol (工厂合约)

**职责**: 创建和管理所有艺术品代币

**核心功能**:
```solidity
contract ArtTokenFactory is Ownable {
    // 创建新的艺术品代币
    function createArtToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        string memory metadataURI,
        address artistAddress
    ) external onlyOwner returns (address);

    // 分配代币：80% 给艺术家，20% 给平台
    function distributeTokens(
        address tokenAddress,
        address artist,
        address platform
    ) internal;

    // 获取所有已创建的代币
    function getAllTokens() external view returns (address[] memory);

    // 事件
    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 totalSupply,
        address indexed artist
    );
}
```

**关键特性**:
- 只有合约 owner (管理员) 可以创建代币
- 使用 Clone Factory 模式降低 gas 费
- 自动分配代币份额（80/20 比例）
- 发出事件供前端监听

### 2.2 ArtToken.sol (ERC-20 代币)

**职责**: 代表单个艺术品的可交易份额

**核心功能**:
```solidity
contract ArtToken is ERC20 {
    string public metadataURI; // IPFS 元数据链接

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        string memory _metadataURI
    ) ERC20(name, symbol) {
        metadataURI = _metadataURI;
        _mint(address(this), totalSupply);
    }

    // 标准 ERC20 功能
    // transfer, approve, transferFrom 等
}
```

**关键特性**:
- 继承 OpenZeppelin ERC20
- 总供应量固定，不可增发
- 包含 metadataURI 指向艺术品信息
- 完全符合 ERC-20 标准，可在任何 DEX 交易

### 2.3 代币分配流程

1. 管理员调用 `createArtToken()` 创建代币
2. 工厂合约部署新 ArtToken 实例
3. 代币铸造到工厂合约地址
4. 工厂合约自动分配：
   - 80% → 艺术家钱包
   - 20% → 平台钱包
5. 发出 `TokenCreated` 事件

---

## 三、前端架构设计

### 3.1 项目结构

```
art-rwa-platform/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx              # 主布局
│   │   ├── page.tsx                # 首页
│   │   ├── artwork/[id]/page.tsx   # 艺术品详情
│   │   ├── submit/page.tsx         # 提交申请
│   │   └── admin/
│   │       ├── page.tsx            # 审核列表
│   │       └── review/[id]/page.tsx
│   ├── api/
│   │   ├── artworks/route.ts
│   │   ├── submit/route.ts
│   │   ├── admin/
│   │   │   ├── approve/route.ts
│   │   │   └── reject/route.ts
│   │   └── deploy/route.ts
│   └── layout.tsx
├── components/
│   ├── wallet/
│   │   └── ConnectButton.tsx
│   ├── artwork/
│   │   ├── ArtworkCard.tsx
│   │   ├── ArtworkDetail.tsx
│   │   └── PriceChart.tsx
│   ├── forms/
│   │   └── SubmitArtworkForm.tsx
│   └── admin/
│       └── ReviewPanel.tsx
├── lib/
│   ├── privy.ts
│   ├── wagmi.ts
│   ├── supabase.ts
│   ├── contracts.ts
│   └── ipfs.ts
└── contracts/                      # Hardhat 项目
    ├── contracts/
    │   ├── ArtTokenFactory.sol
    │   └── ArtToken.sol
    ├── scripts/
    │   └── deploy.js
    └── test/
```

### 3.2 核心页面功能

**首页 (app/page.tsx)**
- 展示所有已发行的艺术品（status='approved'）
- 实时显示代币价格（从 PancakeSwap API 获取）
- 筛选和搜索功能
- 卡片展示：图片、名称、价格、涨跌幅

**艺术品详情页 (app/artwork/[id]/page.tsx)**
- 大图展示（IPFS 图片）
- 艺术品描述、艺术家信息
- 代币信息：符号、供应量、合约地址
- 当前价格和 24h 涨跌
- "在 PancakeSwap 交易" 按钮
- 证书下载

**提交申请页 (app/submit/page.tsx)**
- 钱包连接检查
- 表单字段：
  - 艺术品名称、描述
  - 艺术家信息
  - 图片上传（拖拽或选择）
  - 证书上传
  - 代币参数（名称、符号、总供应量）
- 提交后显示待审核状态

**管理员审核页 (app/admin/page.tsx)**
- 权限检查（只有管理员地址可访问）
- 待审核列表（可筛选状态）
- 查看详情、批准、拒绝
- 批准后触发代币部署

### 3.3 关键技术集成

**Privy 钱包连接**
```typescript
// lib/privy.ts
import { PrivyProvider } from '@privy-io/react-auth';

export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  config: {
    loginMethods: ['wallet', 'email'],
    appearance: {
      theme: 'light',
      accentColor: '#676FFF',
    },
    defaultChain: bsc, // BNB Chain
    supportedChains: [bsc],
  },
};
```

**Wagmi 合约交互**
```typescript
// lib/wagmi.ts
import { createConfig } from 'wagmi';
import { bsc } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_RPC_URL),
  },
});
```

**PancakeSwap 价格获取**
```typescript
// lib/pancakeswap.ts
export async function getTokenPrice(tokenAddress: string) {
  const response = await fetch(
    `https://api.pancakeswap.info/api/v2/tokens/${tokenAddress}`
  );
  const data = await response.json();
  return {
    price: data.data.price,
    priceChange24h: data.data.price_change_percentage_24h,
  };
}
```

---

## 四、数据流和用户旅程

### 4.1 艺术家提交艺术品

```
1. 访问 /submit
   ↓
2. Privy 钱包连接
   ↓
3. 填写表单（艺术品信息 + 代币参数）
   ↓
4. 上传文件（图片、证书）
   ↓
5. 提交 → POST /api/submit
   ↓
6. API 验证数据
   ↓
7. 上传文件到 Supabase Storage
   ↓
8. 写入 artworks 表 (status: 'pending')
   ↓
9. 返回成功，显示"等待审核"
```

### 4.2 管理员审核和发行

```
1. 访问 /admin (权限验证)
   ↓
2. 查看待审核列表 (status='pending')
   ↓
3. 点击某个申请查看详情
   ↓
4. 点击"批准" → POST /api/admin/approve
   ↓
5. API 后端操作:
   a. 上传图片到 IPFS (获得 CID)
   b. 上传证书到 IPFS
   c. 创建元数据 JSON 上传到 IPFS
   d. 调用工厂合约 createArtToken(...)
   e. 等待交易确认
   f. 更新数据库:
      - status = 'approved'
      - contract_address = 新代币地址
      - metadata_ipfs_hash = IPFS CID
   ↓
6. 前端监听 TokenCreated 事件
   ↓
7. 显示"代币发行成功"
```

### 4.3 用户浏览和交易

```
1. 访问首页
   ↓
2. GET /api/artworks (status='approved')
   ↓
3. 并发获取每个代币的价格 (PancakeSwap API)
   ↓
4. 展示艺术品列表
   ↓
5. 点击某个艺术品 → 详情页
   ↓
6. 查看详细信息、价格图表
   ↓
7. 点击"在 PancakeSwap 交易"
   ↓
8. 跳转到 PancakeSwap:
   https://pancakeswap.finance/swap?outputCurrency={tokenAddress}
   ↓
9. 用户在 PancakeSwap 完成交易
```

---

## 五、数据库设计

### 5.1 artworks 表

```sql
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 基本信息
  title VARCHAR(255) NOT NULL,
  description TEXT,
  artist_name VARCHAR(255) NOT NULL,
  artist_bio TEXT,

  -- 代币信息
  token_name VARCHAR(100) NOT NULL,
  token_symbol VARCHAR(20) NOT NULL,
  total_supply BIGINT NOT NULL,
  contract_address VARCHAR(42),

  -- 存储信息
  image_url TEXT,
  certificate_url TEXT,
  metadata_ipfs_hash VARCHAR(100),

  -- 审核信息
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  submitted_by VARCHAR(42) NOT NULL,
  reviewed_by VARCHAR(42),
  review_note TEXT,

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,

  CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_artworks_status ON artworks(status);
CREATE INDEX idx_artworks_contract ON artworks(contract_address);
```

### 5.2 users 表

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'artist',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_docs TEXT[],
  total_submissions INTEGER DEFAULT 0,
  approved_submissions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,

  CONSTRAINT check_role CHECK (role IN ('artist', 'admin', 'user'))
);
```

### 5.3 price_snapshots 表

```sql
CREATE TABLE price_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_address VARCHAR(42) NOT NULL,
  price_usd DECIMAL(20, 6),
  price_bnb DECIMAL(20, 10),
  volume_24h DECIMAL(20, 6),
  liquidity_usd DECIMAL(20, 6),
  snapshot_time TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_contract
    FOREIGN KEY (contract_address)
    REFERENCES artworks(contract_address)
);

CREATE INDEX idx_price_contract_time
  ON price_snapshots(contract_address, snapshot_time DESC);
```

### 5.4 Row Level Security

```sql
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artworks viewable by everyone"
  ON artworks FOR SELECT USING (true);

CREATE POLICY "Users can submit artworks"
  ON artworks FOR INSERT
  WITH CHECK (auth.jwt() ->> 'wallet_address' = submitted_by);

CREATE POLICY "Only admins can update"
  ON artworks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE wallet_address = auth.jwt() ->> 'wallet_address'
      AND role = 'admin'
    )
  );
```

---

## 六、错误处理和边缘情况

### 6.1 智能合约层

**部署失败**
- Gas 不足：前端预估并提示充值
- 代币符号冲突：允许重复（通过地址区分）
- 网络拥堵：60 秒超时，支持重试

**代币分配失败**
- 无效地址：前端验证 `isAddress()`
- 分配失败：管理员可手动转账

### 6.2 API 层

**文件上传**
- 文件过大：前端限制 + 压缩
- IPFS 失败：重试 3 次，指数退避

**数据库操作**
- 并发冲突：乐观锁 + 事务
- 外键约束：CASCADE 或软删除

### 6.3 前端

**钱包连接**
- 用户拒绝：友好提示
- 错误网络：Privy 自动切换提示
- 移动端：优先使用深链接

**PancakeSwap 集成**
- 流动性池不存在：显示"暂无交易对"
- API 限流：降级展示，使用缓存

### 6.4 边缘情况

**提交后修改**
- pending 状态允许编辑
- 已审核不可修改

**链上链下不同步**
- 后台定时任务扫描链上事件
- 自动同步缺失数据

**管理员误操作**
- 添加"撤销"功能
- 代币无法销毁，但可下架

**IPFS 访问失败**
- 使用多个 Gateway
- Supabase 保留备份

**恶意提交**
- reCAPTCHA v3
- 限制提交频率
- 可选：提交质押 BNB

---

## 七、部署和测试

### 7.1 环境配置

**.env.local**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=

# 区块链
NEXT_PUBLIC_BSC_RPC_URL=https://bsc-testnet.publicnode.com
NEXT_PUBLIC_FACTORY_CONTRACT=0x...
PRIVATE_KEY=

# IPFS
PINATA_API_KEY=
PINATA_SECRET_KEY=

# 管理员
ADMIN_WALLET_ADDRESS=0x...
```

### 7.2 测试策略

**智能合约测试 (Hardhat)**
- 单元测试覆盖率 > 90%
- 测试代币创建、分配、事件

**API 集成测试**
- 测试所有 API 端点
- 验证权限控制
- 模拟失败场景

**E2E 测试 (Playwright)**
- 艺术家提交流程
- 管理员审核流程
- 用户浏览和跳转

### 7.3 部署流程

**测试网阶段**
1. 部署合约到 BSC Testnet
2. 设置 Supabase 项目
3. 部署前端到 Vercel
4. 完整流程测试

**主网阶段**
1. 智能合约审计（可选）
2. 准备管理员钱包（充值 BNB）
3. 部署合约到 BSC Mainnet
4. 更新前端环境变量
5. 创建初始流动性池

### 7.4 监控和维护

**监控**
- BSCScan 监控合约
- Vercel Analytics 性能监控
- Sentry 错误捕获
- Supabase 数据库监控

**定期任务**
- 每小时同步链上数据
- 每 15 分钟更新价格
- 每天备份数据库

**安全措施**
- 管理员私钥硬件钱包
- API 限流
- 定期依赖更新

---

## 八、发布检查清单

- [ ] 智能合约测试网完整测试
- [ ] 所有 E2E 测试通过
- [ ] 环境变量正确配置
- [ ] IPFS 固定服务已付费
- [ ] 管理员钱包有足够 BNB
- [ ] Privy 配置正确
- [ ] 错误监控已启用
- [ ] 备份策略已设置
- [ ] SSL 证书有效
- [ ] 用户文档已准备

---

## 九、未来扩展（V2+）

**可能的功能增强**:
- 平台内置交易界面（嵌入 PancakeSwap Widget）
- NFT 分红机制（艺术品出租、展览收入）
- DAO 治理（代币持有者投票）
- 多链支持（Ethereum, Polygon）
- 拍卖功能
- 实体艺术品追踪（IoT 集成）
- 二级市场版税（艺术家持续收益）

---

## 总结

这个设计提供了一个完整的 MVP 方案，平衡了去中心化和用户体验，使用成熟的技术栈，能够在 2-3 周内实现基本功能。核心优势：

1. **快速上线**: 使用现成框架和服务
2. **成本可控**: BSC 低 gas + Supabase 免费额度
3. **用户友好**: Privy 降低 Web3 门槛
4. **可扩展**: 架构支持未来功能扩展
5. **安全可靠**: 完善的错误处理和测试

**关键里程碑**:
- Week 1: 智能合约 + 基础前端
- Week 2: 完整流程 + 测试网部署
- Week 3: 测试 + 主网部署
