# Art RWA Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an MVP art RWA platform where artists submit real-world artworks, admins approve and issue ERC-20 share tokens on BNB Chain, and users can browse and trade on PancakeSwap.

**Architecture:** Next.js 14 frontend + Privy wallet connector + Supabase backend + Hardhat smart contracts + IPFS storage + PancakeSwap integration.

**Tech Stack:**
- Frontend: Next.js 14, React, TypeScript, TailwindCSS, shadcn/ui
- Blockchain: Solidity, Hardhat, ethers.js, Wagmi, Viem
- Backend: Next.js API Routes, Supabase
- Storage: IPFS (Pinata), Supabase Storage
- Auth: Privy

---

## Phase 1: Project Foundation

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`
- Create: `app/layout.tsx`, `app/page.tsx`

**Step 1: Clean workspace and initialize**

```bash
cd /Users/chenyangmin/.worktrees/art-rwa-platform
# Remove old Vue template files
rm -rf src build config static webpack_plugins .babelrc .editorconfig .eslintignore .eslintrc.js .postcssrc.js .project .travis.yml favicon.ico index.html LICENSE README.md README.zh-CN.md debug.log
rm package.json package-lock.json .npmrc
```

**Step 2: Create Next.js app**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

Expected: Next.js project initialized with App Router

**Step 3: Install core dependencies**

```bash
npm install @privy-io/react-auth wagmi viem @tanstack/react-query
npm install @supabase/supabase-js @supabase/ssr
npm install ethers@^5.7.2
npm install pinata-web3
npm install -D @types/node
```

**Step 4: Install UI dependencies**

```bash
npx shadcn-ui@latest init -d
npx shadcn-ui@latest add button card input label textarea select dialog dropdown-menu table
```

**Step 5: Verify project structure**

Run: `ls -la`
Expected: Next.js app structure with `app/` directory

**Step 6: Commit**

```bash
git add .
git commit -m "feat: initialize Next.js project with dependencies

- Set up Next.js 14 with App Router
- Add Privy, Wagmi, Supabase, IPFS dependencies
- Install shadcn/ui components"
```

---

### Task 2: Setup Environment Configuration

**Files:**
- Create: `.env.local.example`
- Create: `.env.local` (gitignored)
- Modify: `.gitignore`

**Step 1: Create environment template**

Create `.env.local.example`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-secret

# Blockchain (BSC Testnet)
NEXT_PUBLIC_BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS=

# Blockchain (BSC Mainnet - for production)
# NEXT_PUBLIC_BSC_RPC_URL=https://bsc-dataseed1.binance.org
# NEXT_PUBLIC_CHAIN_ID=56

# Admin wallet
ADMIN_WALLET_ADDRESS=
ADMIN_PRIVATE_KEY=

# IPFS (Pinata)
PINATA_JWT=your-pinata-jwt
NEXT_PUBLIC_PINATA_GATEWAY=gateway.pinata.cloud

# Platform wallet (receives 20% of tokens)
PLATFORM_WALLET_ADDRESS=
```

**Step 2: Update .gitignore**

Add to `.gitignore`:
```
.env.local
contracts/cache
contracts/artifacts
contracts/typechain-types
node_modules
```

**Step 3: Commit**

```bash
git add .env.local.example .gitignore
git commit -m "chore: add environment configuration template"
```

---

## Phase 2: Smart Contracts

### Task 3: Initialize Hardhat Project

**Files:**
- Create: `contracts/hardhat.config.ts`
- Create: `contracts/package.json`

**Step 1: Create contracts directory**

```bash
mkdir contracts
cd contracts
npm init -y
```

**Step 2: Install Hardhat and dependencies**

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
npm install dotenv
```

**Step 3: Initialize Hardhat**

```bash
npx hardhat init
```

Select: "Create a TypeScript project"

**Step 4: Create hardhat.config.ts**

Create `contracts/hardhat.config.ts`:
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env.local" });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    bscTestnet: {
      url: process.env.NEXT_PUBLIC_BSC_RPC_URL || "",
      chainId: 97,
      accounts: process.env.ADMIN_PRIVATE_KEY ? [process.env.ADMIN_PRIVATE_KEY] : [],
    },
    bscMainnet: {
      url: "https://bsc-dataseed1.binance.org",
      chainId: 56,
      accounts: process.env.ADMIN_PRIVATE_KEY ? [process.env.ADMIN_PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
```

**Step 5: Commit**

```bash
cd ..
git add contracts/
git commit -m "feat: initialize Hardhat for smart contract development"
```

---

### Task 4: Write ArtToken Contract

**Files:**
- Create: `contracts/contracts/ArtToken.sol`
- Create: `contracts/test/ArtToken.test.ts`

**Step 1: Write failing test**

Create `contracts/test/ArtToken.test.ts`:
```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ArtToken", function () {
  it("should deploy with correct name, symbol, and supply", async function () {
    const ArtToken = await ethers.getContractFactory("ArtToken");
    const artToken = await ArtToken.deploy(
      "Mona Lisa Shares",
      "MLS",
      ethers.parseEther("10000"),
      "ipfs://QmTest123"
    );

    expect(await artToken.name()).to.equal("Mona Lisa Shares");
    expect(await artToken.symbol()).to.equal("MLS");
    expect(await artToken.totalSupply()).to.equal(ethers.parseEther("10000"));
    expect(await artToken.metadataURI()).to.equal("ipfs://QmTest123");
  });

  it("should mint total supply to deployer", async function () {
    const [deployer] = await ethers.getSigners();
    const ArtToken = await ethers.getContractFactory("ArtToken");
    const artToken = await ArtToken.deploy(
      "Test Art",
      "TEST",
      ethers.parseEther("1000"),
      "ipfs://test"
    );

    expect(await artToken.balanceOf(deployer.address)).to.equal(
      ethers.parseEther("1000")
    );
  });

  it("should allow transfers", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const ArtToken = await ethers.getContractFactory("ArtToken");
    const artToken = await ArtToken.deploy(
      "Test Art",
      "TEST",
      ethers.parseEther("1000"),
      "ipfs://test"
    );

    await artToken.transfer(addr1.address, ethers.parseEther("100"));
    expect(await artToken.balanceOf(addr1.address)).to.equal(
      ethers.parseEther("100")
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd contracts
npx hardhat test
```

Expected: FAIL with "ArtToken not found"

**Step 3: Write minimal implementation**

Create `contracts/contracts/ArtToken.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ArtToken is ERC20 {
    string public metadataURI;

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        string memory _metadataURI
    ) ERC20(name, symbol) {
        metadataURI = _metadataURI;
        _mint(msg.sender, totalSupply);
    }
}
```

**Step 4: Run test to verify it passes**

```bash
npx hardhat test
```

Expected: PASS - 3 tests

**Step 5: Commit**

```bash
cd ..
git add contracts/contracts/ArtToken.sol contracts/test/ArtToken.test.ts
git commit -m "feat: implement ArtToken ERC20 contract

- Standard ERC20 with metadata URI
- Fixed supply minted to deployer
- OpenZeppelin base for security"
```

---

### Task 5: Write ArtTokenFactory Contract

**Files:**
- Create: `contracts/contracts/ArtTokenFactory.sol`
- Create: `contracts/test/ArtTokenFactory.test.ts`

**Step 1: Write failing test**

Create `contracts/test/ArtTokenFactory.test.ts`:
```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ArtTokenFactory", function () {
  it("should create new art token", async function () {
    const [owner, artist, platform] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ArtTokenFactory");
    const factory = await Factory.deploy(platform.address);

    const tx = await factory.createArtToken(
      "Starry Night",
      "STAR",
      ethers.parseEther("10000"),
      "ipfs://QmArt1",
      artist.address
    );

    const receipt = await tx.wait();
    const event = receipt?.logs.find(
      (log: any) => log.eventName === "TokenCreated"
    );

    expect(event).to.not.be.undefined;
  });

  it("should distribute tokens 80/20", async function () {
    const [owner, artist, platform] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ArtTokenFactory");
    const factory = await Factory.deploy(platform.address);

    const tx = await factory.createArtToken(
      "Test Art",
      "TEST",
      ethers.parseEther("10000"),
      "ipfs://test",
      artist.address
    );

    const receipt = await tx.wait();
    const tokenAddress = receipt?.logs[0].address;

    const ArtToken = await ethers.getContractFactory("ArtToken");
    const token = ArtToken.attach(tokenAddress);

    expect(await token.balanceOf(artist.address)).to.equal(
      ethers.parseEther("8000")
    );
    expect(await token.balanceOf(platform.address)).to.equal(
      ethers.parseEther("2000")
    );
  });

  it("should only allow owner to create tokens", async function () {
    const [owner, notOwner, platform] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ArtTokenFactory");
    const factory = await Factory.deploy(platform.address);

    await expect(
      factory.connect(notOwner).createArtToken(
        "Test",
        "TEST",
        ethers.parseEther("1000"),
        "ipfs://test",
        notOwner.address
      )
    ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
  });

  it("should track all created tokens", async function () {
    const [owner, artist, platform] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ArtTokenFactory");
    const factory = await Factory.deploy(platform.address);

    await factory.createArtToken("Art1", "ART1", ethers.parseEther("1000"), "ipfs://1", artist.address);
    await factory.createArtToken("Art2", "ART2", ethers.parseEther("2000"), "ipfs://2", artist.address);

    const tokens = await factory.getAllTokens();
    expect(tokens.length).to.equal(2);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd contracts
npx hardhat test test/ArtTokenFactory.test.ts
```

Expected: FAIL with "ArtTokenFactory not found"

**Step 3: Write minimal implementation**

Create `contracts/contracts/ArtTokenFactory.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ArtToken.sol";

contract ArtTokenFactory is Ownable {
    address public platformWallet;
    address[] public allTokens;

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 totalSupply,
        address indexed artist,
        string metadataURI
    );

    constructor(address _platformWallet) Ownable(msg.sender) {
        platformWallet = _platformWallet;
    }

    function createArtToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        string memory metadataURI,
        address artistAddress
    ) external onlyOwner returns (address) {
        ArtToken newToken = new ArtToken(name, symbol, totalSupply, metadataURI);
        address tokenAddress = address(newToken);

        // Distribute: 80% to artist, 20% to platform
        uint256 artistShare = (totalSupply * 80) / 100;
        uint256 platformShare = totalSupply - artistShare;

        newToken.transfer(artistAddress, artistShare);
        newToken.transfer(platformWallet, platformShare);

        allTokens.push(tokenAddress);

        emit TokenCreated(
            tokenAddress,
            name,
            symbol,
            totalSupply,
            artistAddress,
            metadataURI
        );

        return tokenAddress;
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    function setPlatformWallet(address _platformWallet) external onlyOwner {
        platformWallet = _platformWallet;
    }
}
```

**Step 4: Run test to verify it passes**

```bash
npx hardhat test
```

Expected: PASS - all tests (7 total)

**Step 5: Commit**

```bash
cd ..
git add contracts/contracts/ArtTokenFactory.sol contracts/test/ArtTokenFactory.test.ts
git commit -m "feat: implement ArtTokenFactory contract

- Factory pattern for deploying art tokens
- Automatic 80/20 distribution (artist/platform)
- Only owner can create tokens
- Tracks all created tokens"
```

---

### Task 6: Create Deployment Script

**Files:**
- Create: `contracts/scripts/deploy.ts`

**Step 1: Write deployment script**

Create `contracts/scripts/deploy.ts`:
```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Get platform wallet from env or use deployer
  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS || deployer.address;

  console.log("Platform wallet:", platformWallet);

  // Deploy Factory
  const ArtTokenFactory = await ethers.getContractFactory("ArtTokenFactory");
  const factory = await ArtTokenFactory.deploy(platformWallet);

  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();

  console.log("ArtTokenFactory deployed to:", factoryAddress);
  console.log("\nSave this to your .env.local:");
  console.log(`NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS=${factoryAddress}`);

  console.log("\nVerify on BSCScan:");
  console.log(`npx hardhat verify --network bscTestnet ${factoryAddress} ${platformWallet}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**Step 2: Test deployment on local network**

```bash
cd contracts
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy.ts --network localhost
```

Expected: Contract deployed successfully

**Step 3: Commit**

```bash
cd ..
git add contracts/scripts/deploy.ts
git commit -m "feat: add deployment script for contracts"
```

---

## Phase 3: Frontend Foundation

### Task 7: Setup Privy Provider

**Files:**
- Create: `lib/privy.ts`
- Modify: `app/layout.tsx`

**Step 1: Create Privy configuration**

Create `lib/privy.ts`:
```typescript
import { bsc, bscTestnet } from 'viem/chains';

export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  config: {
    loginMethods: ['wallet', 'email'],
    appearance: {
      theme: 'light' as const,
      accentColor: '#F0B90B', // Binance yellow
      logo: '/logo.png',
    },
    defaultChain: process.env.NEXT_PUBLIC_CHAIN_ID === '56' ? bsc : bscTestnet,
    supportedChains: process.env.NEXT_PUBLIC_CHAIN_ID === '56' ? [bsc] : [bscTestnet],
  },
};
```

**Step 2: Create providers wrapper**

Create `app/providers.tsx`:
```typescript
'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import { privyConfig } from '@/lib/privy';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider appId={privyConfig.appId} config={privyConfig.config}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
```

**Step 3: Update root layout**

Modify `app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Art RWA Platform",
  description: "Tokenize real-world artworks on BNB Chain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 4: Create Wagmi config**

Create `lib/wagmi.ts`:
```typescript
import { createConfig, http } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';

const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97');
const chain = chainId === 56 ? bsc : bscTestnet;

export const config = createConfig({
  chains: [chain],
  transports: {
    [chain.id]: http(process.env.NEXT_PUBLIC_BSC_RPC_URL),
  },
});
```

**Step 5: Commit**

```bash
git add lib/privy.ts lib/wagmi.ts app/providers.tsx app/layout.tsx
git commit -m "feat: setup Privy and Wagmi providers"
```

---

### Task 8: Create Wallet Connect Button

**Files:**
- Create: `components/wallet/connect-button.tsx`

**Step 1: Create component**

Create `components/wallet/connect-button.tsx`:
```typescript
'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';

export function ConnectButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();

  if (!ready) {
    return <Button disabled>Loading...</Button>;
  }

  if (!authenticated) {
    return (
      <Button onClick={login}>
        Connect Wallet
      </Button>
    );
  }

  const wallet = wallets[0];
  const address = wallet?.address;

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm">
        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
      </div>
      <Button variant="outline" onClick={logout}>
        Disconnect
      </Button>
    </div>
  );
}
```

**Step 2: Test component**

Update `app/page.tsx` to test:
```typescript
import { ConnectButton } from '@/components/wallet/connect-button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Art RWA Platform</h1>
      <ConnectButton />
    </main>
  );
}
```

**Step 3: Run dev server and test**

```bash
npm run dev
```

Visit http://localhost:3000 and test wallet connection

**Step 4: Commit**

```bash
git add components/wallet/connect-button.tsx app/page.tsx
git commit -m "feat: add wallet connect button component"
```

---

## Phase 4: Supabase Integration

### Task 9: Setup Supabase Client

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/types.ts`

**Step 1: Create client-side Supabase**

Create `lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 2: Create server-side Supabase**

Create `lib/supabase/server.ts`:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

**Step 3: Create TypeScript types**

Create `lib/supabase/types.ts`:
```typescript
export type ArtworkStatus = 'pending' | 'approved' | 'rejected';

export interface Artwork {
  id: string;
  title: string;
  description: string;
  artist_name: string;
  artist_bio: string;
  token_name: string;
  token_symbol: string;
  total_supply: number;
  contract_address: string | null;
  image_url: string;
  certificate_url: string | null;
  metadata_ipfs_hash: string | null;
  status: ArtworkStatus;
  submitted_by: string;
  reviewed_by: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

export interface User {
  id: string;
  wallet_address: string;
  email: string | null;
  role: 'artist' | 'admin' | 'user';
  is_verified: boolean;
  verification_docs: string[];
  total_submissions: number;
  approved_submissions: number;
  created_at: string;
  last_login: string | null;
}

export interface PriceSnapshot {
  id: string;
  contract_address: string;
  price_usd: number;
  price_bnb: number;
  volume_24h: number;
  liquidity_usd: number;
  snapshot_time: string;
}
```

**Step 4: Commit**

```bash
git add lib/supabase/
git commit -m "feat: setup Supabase client for browser and server"
```

---

### Task 10: Create Database Schema Migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Create migration file**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
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

CREATE UNIQUE INDEX idx_users_wallet ON users(wallet_address);

-- Artworks table
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  title VARCHAR(255) NOT NULL,
  description TEXT,
  artist_name VARCHAR(255) NOT NULL,
  artist_bio TEXT,

  token_name VARCHAR(100) NOT NULL,
  token_symbol VARCHAR(20) NOT NULL,
  total_supply BIGINT NOT NULL,
  contract_address VARCHAR(42),

  image_url TEXT,
  certificate_url TEXT,
  metadata_ipfs_hash VARCHAR(100),

  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  submitted_by VARCHAR(42) NOT NULL,
  reviewed_by VARCHAR(42),
  review_note TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,

  CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_artworks_status ON artworks(status);
CREATE INDEX idx_artworks_submitted_by ON artworks(submitted_by);
CREATE INDEX idx_artworks_contract ON artworks(contract_address);

-- Price snapshots table
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

-- Row Level Security
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artworks viewable by everyone"
  ON artworks FOR SELECT USING (true);

CREATE POLICY "Users can submit artworks"
  ON artworks FOR INSERT
  WITH CHECK (true);

-- Enable realtime for artworks
ALTER PUBLICATION supabase_realtime ADD TABLE artworks;
```

**Step 2: Document Supabase setup**

Create `supabase/README.md`:
```markdown
# Supabase Setup

## Initial Setup

1. Create a new project at https://supabase.com
2. Copy your project URL and anon key to `.env.local`
3. Run the migration:

\`\`\`bash
# Copy the SQL from migrations/001_initial_schema.sql
# Paste into Supabase SQL Editor and run
\`\`\`

## Storage Buckets

Create these buckets in Supabase Storage:

1. `artwork-images` - Public bucket for artwork images
2. `certificates` - Private bucket for certificates

## Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
```

**Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase database schema migration"
```

---

## Phase 5: Core Pages and Features

### Task 11: Create Homepage with Artwork Gallery

**Files:**
- Create: `app/(main)/page.tsx`
- Create: `app/(main)/layout.tsx`
- Create: `components/artwork/artwork-card.tsx`
- Create: `components/layout/navbar.tsx`

**Step 1: Create main layout with navbar**

Create `components/layout/navbar.tsx`:
```typescript
import Link from 'next/link';
import { ConnectButton } from '@/components/wallet/connect-button';

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Art RWA
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/" className="hover:text-primary">
            Gallery
          </Link>
          <Link href="/submit" className="hover:text-primary">
            Submit Artwork
          </Link>
          <Link href="/admin" className="hover:text-primary">
            Admin
          </Link>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
```

Create `app/(main)/layout.tsx`:
```typescript
import { Navbar } from '@/components/layout/navbar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

**Step 2: Create artwork card component**

Create `components/artwork/artwork-card.tsx`:
```typescript
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Artwork } from '@/lib/supabase/types';

interface ArtworkCardProps {
  artwork: Artwork;
  price?: number;
  priceChange24h?: number;
}

export function ArtworkCard({ artwork, price, priceChange24h }: ArtworkCardProps) {
  return (
    <Link href={`/artwork/${artwork.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square relative">
          <Image
            src={artwork.image_url || '/placeholder.png'}
            alt={artwork.title}
            fill
            className="object-cover"
          />
        </div>
        <CardHeader>
          <CardTitle>{artwork.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{artwork.artist_name}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-muted-foreground">{artwork.token_symbol}</span>
            {price && (
              <>
                <span className="text-lg font-bold">${price.toFixed(2)}</span>
                {priceChange24h !== undefined && (
                  <span className={priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                  </span>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Step 3: Create homepage**

Create `app/(main)/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server';
import { ArtworkCard } from '@/components/artwork/artwork-card';

export default async function HomePage() {
  const supabase = createClient();

  const { data: artworks, error } = await supabase
    .from('artworks')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching artworks:', error);
    return <div>Error loading artworks</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">Discover Tokenized Art</h1>

      {!artworks || artworks.length === 0 ? (
        <p className="text-muted-foreground">No artworks available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add app/(main)/ components/layout/navbar.tsx components/artwork/artwork-card.tsx
git commit -m "feat: create homepage with artwork gallery"
```

---

### Task 12: Create Submit Artwork Page

**Files:**
- Create: `app/(main)/submit/page.tsx`
- Create: `components/forms/submit-artwork-form.tsx`
- Create: `app/api/submit/route.ts`

**Step 1: Create submit form component**

Create `components/forms/submit-artwork-form.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SubmitArtworkForm() {
  const { authenticated, user } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Submission failed');

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>
            Please connect your wallet to submit artwork
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submission Successful!</CardTitle>
          <CardDescription>
            Your artwork has been submitted for review. We'll notify you once it's approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setSuccess(false)}>Submit Another</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Submit Artwork for Tokenization</CardTitle>
          <CardDescription>
            Fill in the details about your artwork and token parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Artwork Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Artwork Information</h3>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" name="description" required rows={4} />
            </div>

            <div>
              <Label htmlFor="artist_name">Artist Name *</Label>
              <Input id="artist_name" name="artist_name" required />
            </div>

            <div>
              <Label htmlFor="artist_bio">Artist Bio</Label>
              <Textarea id="artist_bio" name="artist_bio" rows={3} />
            </div>

            <div>
              <Label htmlFor="image">Artwork Image *</Label>
              <Input id="image" name="image" type="file" accept="image/*" required />
              <p className="text-sm text-muted-foreground mt-1">Max 10MB, JPG or PNG</p>
            </div>

            <div>
              <Label htmlFor="certificate">Certificate/Provenance (Optional)</Label>
              <Input id="certificate" name="certificate" type="file" accept=".pdf" />
              <p className="text-sm text-muted-foreground mt-1">PDF format, max 5MB</p>
            </div>
          </div>

          {/* Token Parameters */}
          <div className="space-y-4">
            <h3 className="font-semibold">Token Parameters</h3>

            <div>
              <Label htmlFor="token_name">Token Name *</Label>
              <Input id="token_name" name="token_name" placeholder="e.g., Starry Night Shares" required />
            </div>

            <div>
              <Label htmlFor="token_symbol">Token Symbol *</Label>
              <Input id="token_symbol" name="token_symbol" placeholder="e.g., STAR" required maxLength={10} />
            </div>

            <div>
              <Label htmlFor="total_supply">Total Supply *</Label>
              <Input id="total_supply" name="total_supply" type="number" placeholder="10000" required min="1" />
              <p className="text-sm text-muted-foreground mt-1">
                You'll receive 80% of tokens, platform receives 20%
              </p>
            </div>
          </div>

          <input type="hidden" name="submitted_by" value={user?.wallet?.address || ''} />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
```

**Step 2: Create submit page**

Create `app/(main)/submit/page.tsx`:
```typescript
import { SubmitArtworkForm } from '@/components/forms/submit-artwork-form';

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Submit Artwork</h1>
      <SubmitArtworkForm />
    </div>
  );
}
```

**Step 3: Create API route**

Create `app/api/submit/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const supabase = createClient();

    // Extract form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const artist_name = formData.get('artist_name') as string;
    const artist_bio = formData.get('artist_bio') as string;
    const token_name = formData.get('token_name') as string;
    const token_symbol = formData.get('token_symbol') as string;
    const total_supply = parseInt(formData.get('total_supply') as string);
    const submitted_by = formData.get('submitted_by') as string;
    const imageFile = formData.get('image') as File;
    const certFile = formData.get('certificate') as File | null;

    // Upload image to Supabase Storage
    const imageExt = imageFile.name.split('.').pop();
    const imagePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${imageExt}`;

    const { data: imageData, error: imageError } = await supabase.storage
      .from('artwork-images')
      .upload(imagePath, imageFile);

    if (imageError) throw imageError;

    const { data: { publicUrl: image_url } } = supabase.storage
      .from('artwork-images')
      .getPublicUrl(imagePath);

    // Upload certificate if provided
    let certificate_url = null;
    if (certFile && certFile.size > 0) {
      const certExt = certFile.name.split('.').pop();
      const certPath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${certExt}`;

      const { error: certError } = await supabase.storage
        .from('certificates')
        .upload(certPath, certFile);

      if (certError) throw certError;

      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(certPath);

      certificate_url = publicUrl;
    }

    // Insert artwork into database
    const { data, error } = await supabase
      .from('artworks')
      .insert({
        title,
        description,
        artist_name,
        artist_bio,
        token_name,
        token_symbol,
        total_supply,
        submitted_by,
        image_url,
        certificate_url,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, artwork: data });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json(
      { error: 'Submission failed' },
      { status: 500 }
    );
  }
}
```

**Step 4: Commit**

```bash
git add app/(main)/submit/ components/forms/submit-artwork-form.tsx app/api/submit/
git commit -m "feat: create artwork submission form and API"
```

---

## Phase 6: Admin Features

(Continue with remaining tasks for admin panel, IPFS integration, contract deployment API, artwork details page, etc.)

---

## Execution Notes

This plan continues with:
- Task 13: Admin Review Page
- Task 14: IPFS Upload Integration
- Task 15: Contract Deployment API
- Task 16: Artwork Details Page
- Task 17: PancakeSwap Price Integration
- Task 18: Testing
- Task 19: Deployment

Each task follows the same pattern:
1. Write failing test (if applicable)
2. Run to verify failure
3. Write minimal implementation
4. Run to verify pass
5. Commit with descriptive message

Total estimated tasks: ~20
Total estimated time: 2-3 weeks for MVP
