export type UserRole = 'USER' | 'CREATOR' | 'MODERATOR' | 'ADMIN';
export type TransactionType = 'RECHARGE' | 'GIFT_SENT' | 'GIFT_RECEIVED' | 'WITHDRAWAL' | 'REFERRAL_BONUS' | 'REFERRAL_COMMISSION' | 'PLATFORM_FEE';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED';
export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'UNDER_REVIEW' | 'REJECTED' | 'ARCHIVED';
export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentGateway = 'STRIPE' | 'PAYPAL' | 'MOYASAR' | 'STC_PAY' | 'PAYONEER' | 'SKRILL';

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  is_verified: boolean;
  kyc_status: KycStatus;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  malcoin_balance: number;
  quscoin_balance: number;
  total_gifted: number;
  total_received: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
}

export interface RechargePackage {
  id: string;
  name: string;
  name_ar: string;
  price_usd: number;
  malcoin_amount: number;
  bonus_percentage: number;
  bonus_malcoin: number;
  is_active: boolean;
  is_promotional: boolean;
  first_purchase_only: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  related_user_id: string | null;
  type: TransactionType;
  status: TransactionStatus;
  malcoin_amount: number;
  quscoin_amount: number;
  usd_amount: number;
  description: string | null;
  metadata: Record<string, unknown> | null;
  reference_id: string | null;
  reference_type: string | null;
  payment_gateway: PaymentGateway | null;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface Gift {
  id: string;
  name: string;
  name_ar: string;
  icon_url: string | null;
  malcoin_cost: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface GiftTransaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  gift_id: string;
  article_id: string | null;
  malcoin_spent: number;
  quscoin_earned: number;
  platform_fee: number;
  creator_share: number;
  transaction_id: string | null;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  signup_bonus_paid: boolean;
  signup_bonus_amount: number;
  total_commission_earned: number;
  created_at: string;
}

export interface Article {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  status: ArticleStatus;
  view_count: number;
  like_count: number;
  comment_count: number;
  gift_count: number;
  total_malcoin_received: number;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  article_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  quscoin_amount: number;
  usd_equivalent: number;
  status: WithdrawalStatus;
  payment_gateway: PaymentGateway;
  payment_details: Record<string, unknown>;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: UserRole;
  avatar_url: string | null;
}

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  display_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  iat?: number;
  exp?: number;
}

// Admin Stats
export interface PlatformStats {
  total_users: number;
  total_creators: number;
  total_articles: number;
  total_transactions: number;
  total_malcoin_recharged: number;
  total_quscoin_earned: number;
  total_platform_revenue: number;
  pending_withdrawals: number;
}
