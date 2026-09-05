-- Promo Code Registry (Admin creates codes, users redeem them)
CREATE TABLE orenza_promo_code_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  value DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_redeemed BOOLEAN DEFAULT FALSE,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE
);

-- Promo Activation (tracks user's active promo, expires after 40 days)
CREATE TABLE orenza_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, FORFEITED
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- Only one active promo per user
);

-- Wallets (PROMO_SANDBOX vs REAL_TRADING)
CREATE TABLE orenza_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_type VARCHAR(20) NOT NULL, -- PROMO_SANDBOX, REAL_TRADING
  balance DECIMAL(12, 2) DEFAULT 0,
  locked_balance DECIMAL(12, 2) DEFAULT 0, -- Losses (non-withdrawable for PROMO)
  profit_balance DECIMAL(12, 2) DEFAULT 0, -- Withdrawable for PROMO
  loss_balance DECIMAL(12, 2) DEFAULT 0, -- Accumulated losses (display only for PROMO)
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, wallet_type)
);

-- Payouts (withdrawal requests)
CREATE TABLE orenza_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_type VARCHAR(20) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, PROCESSED, REJECTED
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Row Level Security Policies
ALTER TABLE orenza_promo_code_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE orenza_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orenza_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orenza_payouts ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see their own promo codes
CREATE POLICY promo_codes_user_access ON orenza_promo_codes
  FOR ALL USING (auth.uid() = user_id);

-- RLS: Users can only see their own wallets
CREATE POLICY wallets_user_access ON orenza_wallets
  FOR ALL USING (auth.uid() = user_id);

-- RLS: Users can only see their own payouts
CREATE POLICY payouts_user_access ON orenza_payouts
  FOR ALL USING (auth.uid() = user_id);
