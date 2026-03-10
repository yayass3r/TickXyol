-- =============================================
-- Xylo Platform Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('USER', 'CREATOR', 'MODERATOR', 'ADMIN');
CREATE TYPE transaction_type AS ENUM ('RECHARGE', 'GIFT_SENT', 'GIFT_RECEIVED', 'WITHDRAWAL', 'REFERRAL_BONUS', 'REFERRAL_COMMISSION', 'PLATFORM_FEE');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');
CREATE TYPE withdrawal_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED');
CREATE TYPE article_status AS ENUM ('DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'REJECTED', 'ARCHIVED');
CREATE TYPE kyc_status AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE payment_gateway AS ENUM ('STRIPE', 'PAYPAL', 'MOYASAR', 'STC_PAY', 'PAYONEER', 'SKRILL');

-- =============================================
-- USERS TABLE
-- =============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  kyc_status kyc_status NOT NULL DEFAULT 'NOT_SUBMITTED',
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- WALLETS TABLE
-- =============================================

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  malcoin_balance BIGINT NOT NULL DEFAULT 0 CHECK (malcoin_balance >= 0),
  quscoin_balance BIGINT NOT NULL DEFAULT 0 CHECK (quscoin_balance >= 0),
  total_gifted BIGINT NOT NULL DEFAULT 0,
  total_received BIGINT NOT NULL DEFAULT 0,
  total_withdrawn BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- RECHARGE PACKAGES TABLE
-- =============================================

CREATE TABLE recharge_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  price_usd DECIMAL(10, 2) NOT NULL CHECK (price_usd > 0),
  malcoin_amount BIGINT NOT NULL CHECK (malcoin_amount > 0),
  bonus_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (bonus_percentage >= 0),
  bonus_malcoin BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_promotional BOOLEAN NOT NULL DEFAULT false,
  first_purchase_only BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default packages
INSERT INTO recharge_packages (name, name_ar, price_usd, malcoin_amount, bonus_percentage, bonus_malcoin, display_order) VALUES
  ('Starter', 'المبتدئ', 1.00, 500, 0, 0, 1),
  ('Standard', 'القياسي', 3.00, 1500, 2, 30, 2),
  ('Premium', 'المميز', 5.00, 3000, 2, 60, 3);

-- Promotional first-purchase package
INSERT INTO recharge_packages (name, name_ar, price_usd, malcoin_amount, bonus_percentage, bonus_malcoin, is_promotional, first_purchase_only, display_order) VALUES
  ('Welcome Offer', 'عرض الترحيب', 1.00, 1500, 200, 1000, true, true, 0);

-- =============================================
-- TRANSACTIONS TABLE
-- =============================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'PENDING',
  malcoin_amount BIGINT NOT NULL DEFAULT 0,
  quscoin_amount BIGINT NOT NULL DEFAULT 0,
  usd_amount DECIMAL(10, 4) NOT NULL DEFAULT 0,
  description TEXT,
  metadata JSONB,
  reference_id UUID,
  reference_type VARCHAR(50),
  payment_gateway payment_gateway,
  payment_reference VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- GIFTS TABLE
-- =============================================

CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  icon_url TEXT,
  malcoin_cost BIGINT NOT NULL CHECK (malcoin_cost > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default gifts
INSERT INTO gifts (name, name_ar, malcoin_cost, display_order) VALUES
  ('Rose', 'وردة', 10, 1),
  ('Coffee', 'قهوة', 50, 2),
  ('Crown', 'تاج', 100, 3),
  ('Diamond', 'ماسة', 500, 4),
  ('Galaxy', 'مجرة', 1000, 5),
  ('Castle', 'قلعة', 5000, 6);

-- =============================================
-- GIFT TRANSACTIONS TABLE
-- =============================================

CREATE TABLE gift_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gift_id UUID NOT NULL REFERENCES gifts(id),
  article_id UUID,
  malcoin_spent BIGINT NOT NULL,
  quscoin_earned BIGINT NOT NULL,
  platform_fee BIGINT NOT NULL,
  creator_share BIGINT NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- REFERRALS TABLE
-- =============================================

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  signup_bonus_paid BOOLEAN NOT NULL DEFAULT false,
  signup_bonus_amount BIGINT NOT NULL DEFAULT 50,
  total_commission_earned BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- REFERRAL COMMISSIONS TABLE
-- =============================================

CREATE TABLE referral_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  recharge_transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  commission_malcoin BIGINT NOT NULL,
  commission_percentage DECIMAL(5, 2) NOT NULL DEFAULT 2.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ARTICLES TABLE
-- =============================================

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(600) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  status article_status NOT NULL DEFAULT 'DRAFT',
  view_count BIGINT NOT NULL DEFAULT 0,
  like_count BIGINT NOT NULL DEFAULT 0,
  comment_count BIGINT NOT NULL DEFAULT 0,
  gift_count BIGINT NOT NULL DEFAULT 0,
  total_malcoin_received BIGINT NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ARTICLE LIKES TABLE
-- =============================================

CREATE TABLE article_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- =============================================
-- COMMENTS TABLE
-- =============================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- WITHDRAWAL REQUESTS TABLE
-- =============================================

CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quscoin_amount BIGINT NOT NULL CHECK (quscoin_amount > 0),
  usd_equivalent DECIMAL(10, 4) NOT NULL,
  status withdrawal_status NOT NULL DEFAULT 'PENDING',
  payment_gateway payment_gateway NOT NULL,
  payment_details JSONB NOT NULL,
  admin_notes TEXT,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SESSION TOKENS TABLE (for custom JWT management)
-- =============================================

CREATE TABLE session_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by ON users(referred_by);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_gift_transactions_sender ON gift_transactions(sender_id);
CREATE INDEX idx_gift_transactions_receiver ON gift_transactions(receiver_id);
CREATE INDEX idx_gift_transactions_article ON gift_transactions(article_id);
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_session_tokens_user_id ON session_tokens(user_id);
CREATE INDEX idx_session_tokens_expires_at ON session_tokens(expires_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles but only update their own
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Wallets: users can only see their own wallet
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (auth.uid()::text = user_id::text);

-- Transactions: users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid()::text = user_id::text);

-- Articles: published articles are public, authors can manage their own
CREATE POLICY "Anyone can view published articles" ON articles FOR SELECT USING (status = 'PUBLISHED');
CREATE POLICY "Authors can manage own articles" ON articles FOR ALL USING (auth.uid()::text = author_id::text);

-- Comments: public for published articles
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add comments" ON comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid()::text = author_id::text);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create wallet when user is created
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_wallet_on_user_insert AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION create_wallet_for_new_user();

-- Function: process gift transaction (atomic)
CREATE OR REPLACE FUNCTION process_gift(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_gift_id UUID,
  p_article_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_gift gifts%ROWTYPE;
  v_sender_wallet wallets%ROWTYPE;
  v_creator_share BIGINT;
  v_platform_fee BIGINT;
  v_transaction_id UUID;
BEGIN
  -- Get gift details
  SELECT * INTO v_gift FROM gifts WHERE id = p_gift_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gift not found or inactive';
  END IF;

  -- Get sender wallet and check balance
  SELECT * INTO v_sender_wallet FROM wallets WHERE user_id = p_sender_id FOR UPDATE;
  IF v_sender_wallet.malcoin_balance < v_gift.malcoin_cost THEN
    RAISE EXCEPTION 'Insufficient MALCOIN balance';
  END IF;

  -- Calculate shares: 80% to creator, 20% platform fee
  v_creator_share := FLOOR(v_gift.malcoin_cost * 0.8);
  v_platform_fee := v_gift.malcoin_cost - v_creator_share;

  -- Deduct from sender
  UPDATE wallets SET 
    malcoin_balance = malcoin_balance - v_gift.malcoin_cost,
    total_gifted = total_gifted + v_gift.malcoin_cost
  WHERE user_id = p_sender_id;

  -- Add QUSCOIN to receiver (creator gets 80% as QUSCOIN)
  UPDATE wallets SET 
    quscoin_balance = quscoin_balance + v_creator_share,
    total_received = total_received + v_creator_share
  WHERE user_id = p_receiver_id;

  -- Create sender transaction
  INSERT INTO transactions (user_id, related_user_id, type, status, malcoin_amount, description, reference_type)
  VALUES (p_sender_id, p_receiver_id, 'GIFT_SENT', 'COMPLETED', v_gift.malcoin_cost, 
          'أرسلت هدية: ' || v_gift.name_ar, 'gift')
  RETURNING id INTO v_transaction_id;

  -- Create receiver transaction
  INSERT INTO transactions (user_id, related_user_id, type, status, quscoin_amount, description, reference_type)
  VALUES (p_receiver_id, p_sender_id, 'GIFT_RECEIVED', 'COMPLETED', v_creator_share,
          'استلمت هدية: ' || v_gift.name_ar, 'gift');

  -- Record gift transaction details
  INSERT INTO gift_transactions (sender_id, receiver_id, gift_id, article_id, malcoin_spent, 
    quscoin_earned, platform_fee, creator_share, transaction_id)
  VALUES (p_sender_id, p_receiver_id, p_gift_id, p_article_id, v_gift.malcoin_cost,
    v_creator_share, v_platform_fee, v_creator_share, v_transaction_id);

  -- Update article stats if applicable
  IF p_article_id IS NOT NULL THEN
    UPDATE articles SET 
      gift_count = gift_count + 1,
      total_malcoin_received = total_malcoin_received + v_gift.malcoin_cost
    WHERE id = p_article_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'malcoin_spent', v_gift.malcoin_cost,
    'quscoin_earned', v_creator_share,
    'platform_fee', v_platform_fee
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: process recharge with referral commission
CREATE OR REPLACE FUNCTION process_recharge(
  p_user_id UUID,
  p_package_id UUID,
  p_payment_reference VARCHAR DEFAULT NULL,
  p_payment_gateway payment_gateway DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_package recharge_packages%ROWTYPE;
  v_user users%ROWTYPE;
  v_referral referrals%ROWTYPE;
  v_total_malcoin BIGINT;
  v_commission BIGINT;
  v_has_previous_purchase BOOLEAN;
  v_transaction_id UUID;
BEGIN
  -- Get package
  SELECT * INTO v_package FROM recharge_packages WHERE id = p_package_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found or inactive';
  END IF;

  -- Get user
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check if first purchase restriction applies
  IF v_package.first_purchase_only THEN
    SELECT EXISTS(
      SELECT 1 FROM transactions 
      WHERE user_id = p_user_id AND type = 'RECHARGE' AND status = 'COMPLETED'
    ) INTO v_has_previous_purchase;
    
    IF v_has_previous_purchase THEN
      RAISE EXCEPTION 'This package is only available for first purchase';
    END IF;
  END IF;

  -- Calculate total malcoin (base + bonus)
  v_total_malcoin := v_package.malcoin_amount + v_package.bonus_malcoin;

  -- Add MALCOIN to user wallet
  UPDATE wallets SET malcoin_balance = malcoin_balance + v_total_malcoin
  WHERE user_id = p_user_id;

  -- Create recharge transaction
  INSERT INTO transactions (user_id, type, status, malcoin_amount, usd_amount, description, 
    payment_gateway, payment_reference)
  VALUES (p_user_id, 'RECHARGE', 'COMPLETED', v_total_malcoin, v_package.price_usd,
    'شحن رصيد - ' || v_package.name_ar, p_payment_gateway, p_payment_reference)
  RETURNING id INTO v_transaction_id;

  -- Process referral commission (2% from platform, not deducted from user)
  SELECT r.* INTO v_referral FROM referrals r 
  WHERE r.referred_id = p_user_id AND r.status = 'ACTIVE';
  
  IF FOUND THEN
    -- Pay signup bonus if not yet paid
    IF NOT v_referral.signup_bonus_paid THEN
      UPDATE wallets SET malcoin_balance = malcoin_balance + 50
      WHERE user_id = v_referral.referrer_id;
      
      INSERT INTO transactions (user_id, related_user_id, type, status, malcoin_amount, description)
      VALUES (v_referral.referrer_id, p_user_id, 'REFERRAL_BONUS', 'COMPLETED', 50,
        'مكافأة الإحالة - مستخدم جديد');
      
      UPDATE referrals SET signup_bonus_paid = true WHERE id = v_referral.id;
    END IF;

    -- Calculate 2% commission on recharge
    v_commission := FLOOR(v_package.malcoin_amount * 0.02);
    
    IF v_commission > 0 THEN
      UPDATE wallets SET malcoin_balance = malcoin_balance + v_commission
      WHERE user_id = v_referral.referrer_id;
      
      INSERT INTO transactions (user_id, related_user_id, type, status, malcoin_amount, description, reference_id, reference_type)
      VALUES (v_referral.referrer_id, p_user_id, 'REFERRAL_COMMISSION', 'COMPLETED', v_commission,
        'عمولة إحالة 2%', v_transaction_id, 'transaction');
      
      INSERT INTO referral_commissions (referral_id, recharge_transaction_id, commission_malcoin, commission_percentage)
      VALUES (v_referral.id, v_transaction_id, v_commission, 2.00);
      
      UPDATE referrals SET total_commission_earned = total_commission_earned + v_commission
      WHERE id = v_referral.id;
    END IF;
  END IF;

  RETURN json_build_object(
    'success', true,
    'malcoin_added', v_total_malcoin,
    'bonus_malcoin', v_package.bonus_malcoin,
    'transaction_id', v_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
