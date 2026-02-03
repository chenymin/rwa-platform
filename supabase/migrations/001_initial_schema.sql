-- =====================================================
-- Combined Migration: Initial Schema with Privy Auth
-- =====================================================
-- Date: 2026-01-29
-- Description: Complete database schema setup with Privy authentication integration
-- This combines migrations: 002, 003, 004

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Part 1: Users Table with Privy Integration
-- =====================================================
-- Migration: Update users table to use Privy user ID as primary key
-- Date: 2026-01-28
-- Description: Restructure users table to integrate with Privy authentication

-- Step 1: Drop existing foreign key constraints (if any exist)
-- (Currently no FK constraints to users table, but adding for future-proofing)

-- Step 2: Create new users table with Privy integration
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  -- Privy user ID as primary key
  privy_user_id VARCHAR(255) PRIMARY KEY,

  -- User identifiers (can be null if user hasn't connected wallet yet)
  wallet_address VARCHAR(42) UNIQUE,
  email VARCHAR(255),
  phone_number VARCHAR(20),

  -- Supabase Auth integration
  auth_user_id UUID UNIQUE,

  -- User profile
  role VARCHAR(20) DEFAULT 'user',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_docs TEXT[],

  -- Statistics
  total_submissions INTEGER DEFAULT 0,
  approved_submissions INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,

  CONSTRAINT check_role CHECK (role IN ('artist', 'admin', 'user'))
);

-- Indexes
CREATE INDEX idx_users_wallet ON users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_phone ON users(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);

-- Comments
COMMENT ON TABLE users IS 'Users table integrated with Privy authentication. privy_user_id is the primary identifier.';
COMMENT ON COLUMN users.privy_user_id IS 'Unique identifier from Privy authentication service';
COMMENT ON COLUMN users.wallet_address IS 'Optional wallet address - user may login via email or social';
COMMENT ON COLUMN users.phone_number IS 'Phone number from Privy authentication (optional)';
COMMENT ON COLUMN users.auth_user_id IS 'UUID from Supabase Auth system, used for authentication and RLS policies';

-- =====================================================
-- Part 1.5: Artists Table
-- =====================================================

-- Create artists table for artist-specific information
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to user account
  privy_user_id VARCHAR(255) UNIQUE NOT NULL,

  -- Artist profile
  artist_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  artist_bio TEXT,

  -- Portfolio and links
  portfolio_url TEXT,
  website_url TEXT,

  -- Social media (flexible JSON structure)
  social_media JSONB DEFAULT '{}'::jsonb,
  -- Example: {"twitter": "@artist", "instagram": "@artist", "discord": "artist#1234"}

  -- Artist verification and status
  verified_artist BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP,

  -- Artist specialization/category
  specialization TEXT[],
  -- Example: ['digital', 'painting', '3D', 'photography']

  -- Statistics
  total_artworks INTEGER DEFAULT 0,
  total_sales DECIMAL(20, 6) DEFAULT 0,

  -- Profile media
  avatar_url TEXT,
  banner_url TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Foreign key constraint
  CONSTRAINT fk_artist_user
    FOREIGN KEY (privy_user_id)
    REFERENCES users(privy_user_id)
    ON DELETE CASCADE
);

-- Indexes for artists
CREATE INDEX idx_artists_privy_user_id ON artists(privy_user_id);
CREATE INDEX idx_artists_verified ON artists(verified_artist);
CREATE INDEX idx_artists_name ON artists(artist_name);

-- Comments
COMMENT ON TABLE artists IS 'Artist profiles with portfolio and verification information';
COMMENT ON COLUMN artists.privy_user_id IS 'Links to the user account (one-to-one relationship)';
COMMENT ON COLUMN artists.social_media IS 'JSON object containing social media handles';
COMMENT ON COLUMN artists.specialization IS 'Array of art categories/specializations';
COMMENT ON COLUMN artists.verified_artist IS 'Whether the artist has been verified by platform';

-- =====================================================
-- Part 2: Artworks Table
-- =====================================================

-- Create artworks table
CREATE TABLE IF NOT EXISTS artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to artist
  artist_id UUID,

  -- Artwork information
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Token information
  token_name VARCHAR(100) NOT NULL,
  token_symbol VARCHAR(20) NOT NULL,
  total_supply BIGINT NOT NULL,
  contract_address VARCHAR(42) UNIQUE,

  -- Media
  image_url TEXT,
  certificate_url TEXT,
  metadata_ipfs_hash VARCHAR(100),

  -- Status and review
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  submitted_by VARCHAR(255) NOT NULL,
  reviewed_by VARCHAR(255),
  review_note TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,

  CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Indexes for artworks
CREATE INDEX idx_artworks_status ON artworks(status);
CREATE INDEX idx_artworks_artist_id ON artworks(artist_id);
CREATE INDEX idx_artworks_submitted_by ON artworks(submitted_by);
CREATE INDEX idx_artworks_contract ON artworks(contract_address) WHERE contract_address IS NOT NULL;

-- =====================================================
-- Part 3: Price Snapshots Table
-- =====================================================

-- Create price snapshots table for tracking artwork prices
CREATE TABLE price_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address VARCHAR(42) NOT NULL,
  price_usd DECIMAL(20, 6),
  price_bnb DECIMAL(20, 10),
  volume_24h DECIMAL(20, 6),
  liquidity_usd DECIMAL(20, 6),
  snapshot_time TIMESTAMP DEFAULT NOW()
);

-- Indexes for price snapshots
CREATE INDEX idx_price_contract_time ON price_snapshots(contract_address, snapshot_time DESC);

-- Comments
COMMENT ON TABLE price_snapshots IS 'Historical price data for tokenized artworks';

-- =====================================================
-- Part 3.5: User Wallets Table (Multi-Currency)
-- =====================================================

-- Create user_wallets table for multi-currency balance management
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User association
  user_id VARCHAR(255) NOT NULL,

  -- Currency type
  currency VARCHAR(10) NOT NULL,
  -- BNB, ETH, USDT, USDC, etc.

  -- Balance management
  balance DECIMAL(30, 18) NOT NULL DEFAULT 0,
  -- Available balance (18 decimal precision for Ethereum standard)

  locked_balance DECIMAL(30, 18) NOT NULL DEFAULT 0,
  -- Locked balance (in orders, processing)

  -- Statistics
  total_deposit DECIMAL(30, 18) DEFAULT 0,
  -- Cumulative deposits

  total_withdraw DECIMAL(30, 18) DEFAULT 0,
  -- Cumulative withdrawals

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uk_user_currency UNIQUE(user_id, currency),
  CONSTRAINT check_balance_non_negative CHECK (balance >= 0),
  CONSTRAINT check_locked_non_negative CHECK (locked_balance >= 0)
);

-- Indexes for user_wallets
CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_user_wallets_currency ON user_wallets(currency);

-- Comments
COMMENT ON TABLE user_wallets IS 'Multi-currency wallet balances for users';
COMMENT ON COLUMN user_wallets.balance IS 'Available balance for trading';
COMMENT ON COLUMN user_wallets.locked_balance IS 'Balance locked in pending orders';
COMMENT ON COLUMN user_wallets.currency IS 'Currency code (BNB, ETH, USDT, etc.)';

-- =====================================================
-- Part 3.6: Transaction Records Table
-- =====================================================

-- Create transaction_records table for all transaction history
CREATE TABLE transaction_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Transaction type
  transaction_type VARCHAR(20) NOT NULL,
  -- buy, sell, platform_fee, deposit, withdraw

  -- User information
  user_id VARCHAR(255) NOT NULL,
  -- Transaction initiator

  counterparty_id VARCHAR(255),
  -- Counterparty user (buyer/seller on the other side)

  -- Artwork association
  artwork_id UUID,
  artist_id UUID,

  -- Amount information
  quantity DECIMAL(30, 18),
  -- Token quantity

  price_per_token DECIMAL(30, 18),
  -- Price per token

  amount DECIMAL(30, 18) NOT NULL,
  -- Total transaction amount

  currency VARCHAR(10) NOT NULL,
  -- Transaction currency

  fee_amount DECIMAL(30, 18) DEFAULT 0,
  -- Platform fee

  -- Blockchain information
  transaction_hash VARCHAR(66),
  -- Transaction hash (0x prefix + 64 chars)

  block_number BIGINT,
  -- Block height

  confirmations INTEGER DEFAULT 0,
  -- Confirmation count (0-12+)

  contract_address VARCHAR(42),
  -- Contract address

  -- Status management
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending, confirming, confirmed, completed, failed, cancelled

  failure_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Gas fees, notes, referral info, etc.

  -- Constraints
  CONSTRAINT check_transaction_type CHECK (
    transaction_type IN ('buy', 'sell', 'platform_fee', 'deposit', 'withdraw')
  ),
  CONSTRAINT check_transaction_status CHECK (
    status IN ('pending', 'confirming', 'confirmed', 'completed', 'failed', 'cancelled')
  ),
  CONSTRAINT check_amount_positive CHECK (amount > 0)
);

-- Indexes for transaction_records
CREATE INDEX idx_transaction_user_id ON transaction_records(user_id);
CREATE INDEX idx_transaction_artwork_id ON transaction_records(artwork_id);
CREATE INDEX idx_transaction_artist_id ON transaction_records(artist_id);
CREATE INDEX idx_transaction_type ON transaction_records(transaction_type);
CREATE INDEX idx_transaction_status ON transaction_records(status);
CREATE INDEX idx_transaction_created_at ON transaction_records(created_at DESC);
CREATE INDEX idx_transaction_hash ON transaction_records(transaction_hash)
  WHERE transaction_hash IS NOT NULL;
CREATE INDEX idx_transaction_counterparty ON transaction_records(counterparty_id)
  WHERE counterparty_id IS NOT NULL;

-- Comments
COMMENT ON TABLE transaction_records IS 'Unified transaction history for all transaction types';
COMMENT ON COLUMN transaction_records.transaction_type IS 'Type of transaction: buy, sell, platform_fee, deposit, withdraw';
COMMENT ON COLUMN transaction_records.counterparty_id IS 'User ID of the counterparty in P2P transactions';
COMMENT ON COLUMN transaction_records.confirmations IS 'Number of blockchain confirmations (usually 12+ for finality)';
COMMENT ON COLUMN transaction_records.metadata IS 'Additional transaction metadata (gas fees, notes, referral, etc.)';

-- =====================================================
-- Part 4: Foreign Key Constraints
-- =====================================================

-- Step 3: Update artworks table to reference privy_user_id and artist_id

-- Add foreign key constraints for artworks
ALTER TABLE artworks
  ADD CONSTRAINT fk_artwork_artist
    FOREIGN KEY (artist_id)
    REFERENCES artists(id)
    ON DELETE SET NULL;

ALTER TABLE artworks
  ADD CONSTRAINT fk_submitted_by
    FOREIGN KEY (submitted_by)
    REFERENCES users(privy_user_id)
    ON DELETE SET NULL;

ALTER TABLE artworks
  ADD CONSTRAINT fk_reviewed_by
    FOREIGN KEY (reviewed_by)
    REFERENCES users(privy_user_id)
    ON DELETE SET NULL;

-- Add foreign key for price snapshots
ALTER TABLE price_snapshots
  ADD CONSTRAINT fk_price_contract
    FOREIGN KEY (contract_address)
    REFERENCES artworks(contract_address)
    ON DELETE CASCADE;

-- Add foreign key constraints for user_wallets
ALTER TABLE user_wallets
  ADD CONSTRAINT fk_wallet_user
    FOREIGN KEY (user_id)
    REFERENCES users(privy_user_id)
    ON DELETE CASCADE;

-- Add foreign key constraints for transaction_records
ALTER TABLE transaction_records
  ADD CONSTRAINT fk_transaction_user
    FOREIGN KEY (user_id)
    REFERENCES users(privy_user_id)
    ON DELETE SET NULL;

ALTER TABLE transaction_records
  ADD CONSTRAINT fk_transaction_counterparty
    FOREIGN KEY (counterparty_id)
    REFERENCES users(privy_user_id)
    ON DELETE SET NULL;

ALTER TABLE transaction_records
  ADD CONSTRAINT fk_transaction_artwork
    FOREIGN KEY (artwork_id)
    REFERENCES artworks(id)
    ON DELETE SET NULL;

ALTER TABLE transaction_records
  ADD CONSTRAINT fk_transaction_artist
    FOREIGN KEY (artist_id)
    REFERENCES artists(id)
    ON DELETE SET NULL;

-- =====================================================
-- Part 5: Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can view user profiles
CREATE POLICY "User profiles viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Users can update own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- System can insert new users (via service role)
CREATE POLICY "System can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Enable RLS on artists table
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Anyone can view artist profiles
CREATE POLICY "Artist profiles viewable by everyone"
  ON artists FOR SELECT
  USING (true);

-- Artists can update own profile
CREATE POLICY "Artists can update own profile" ON artists
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.privy_user_id = artists.privy_user_id
      AND users.auth_user_id = auth.uid()
    )
  );

-- System can insert artist profiles
CREATE POLICY "System can insert artists"
  ON artists FOR INSERT
  WITH CHECK (true);

-- Enable RLS on artworks table
ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved artworks
CREATE POLICY "Approved artworks viewable by everyone"
  ON artworks FOR SELECT
  USING (status = 'approved' OR EXISTS (
    SELECT 1 FROM users
    WHERE users.privy_user_id = artworks.submitted_by
    AND users.auth_user_id = auth.uid()
  ));

-- Artists can insert own artworks
CREATE POLICY "Artists can insert own artworks" ON artworks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.privy_user_id = submitted_by
      AND users.auth_user_id = auth.uid()
    )
  );

-- Artists can update own artworks
CREATE POLICY "Artists can update own artworks" ON artworks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.privy_user_id = artworks.submitted_by
      AND users.auth_user_id = auth.uid()
    )
  );

-- Enable RLS on price snapshots
ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;

-- Anyone can view price snapshots
CREATE POLICY "Price snapshots viewable by everyone"
  ON price_snapshots FOR SELECT
  USING (true);

-- Only system can insert price snapshots
CREATE POLICY "System can insert price snapshots"
  ON price_snapshots FOR INSERT
  WITH CHECK (true);

-- Enable RLS on user_wallets
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

-- Users can view own wallets
CREATE POLICY "Users can view own wallets"
  ON user_wallets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.privy_user_id = user_wallets.user_id
      AND users.auth_user_id = auth.uid()
    )
  );

-- System can insert and update wallets
CREATE POLICY "System can insert wallets"
  ON user_wallets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update wallets"
  ON user_wallets FOR UPDATE
  USING (true);

-- Enable RLS on transaction_records
ALTER TABLE transaction_records ENABLE ROW LEVEL SECURITY;

-- Users can view own transactions (as initiator or counterparty)
CREATE POLICY "Users can view own transactions"
  ON transaction_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.privy_user_id = transaction_records.user_id
      AND users.auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.privy_user_id = transaction_records.counterparty_id
      AND users.auth_user_id = auth.uid()
    )
  );

-- System can insert and update transactions
CREATE POLICY "System can insert transactions"
  ON transaction_records FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update transactions"
  ON transaction_records FOR UPDATE
  USING (true);

-- =====================================================
-- Part 6: Functions and Triggers
-- =====================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for artists table
CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for artworks table
CREATE TRIGGER update_artworks_updated_at
  BEFORE UPDATE ON artworks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update artist stats when artwork is approved
CREATE OR REPLACE FUNCTION update_artist_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE artists
    SET total_artworks = total_artworks + 1
    WHERE id = NEW.artist_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for artist stats
CREATE TRIGGER update_artist_stats_trigger
  AFTER UPDATE ON artworks
  FOR EACH ROW
  EXECUTE FUNCTION update_artist_stats();

-- Create trigger for user_wallets table
CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for transaction_records table
CREATE TRIGGER update_transaction_records_updated_at
  BEFORE UPDATE ON transaction_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Part 7: Realtime
-- =====================================================

-- Enable realtime for artworks and artists
ALTER PUBLICATION supabase_realtime ADD TABLE artworks;
ALTER PUBLICATION supabase_realtime ADD TABLE artists;
ALTER PUBLICATION supabase_realtime ADD TABLE price_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE user_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE transaction_records;

-- =====================================================
-- Part 8: Initial Data
-- =====================================================

-- Insert admin user (update with your actual Privy user ID after first login)
-- This is a placeholder - you'll need to update it with real data
INSERT INTO users (privy_user_id, wallet_address, role, is_verified)
VALUES ('admin_privy_id_placeholder', '0x0000000000000000000000000000000000000000', 'admin', true)
ON CONFLICT (privy_user_id) DO NOTHING;
