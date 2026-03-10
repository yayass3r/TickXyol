import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data } satisfies ApiResponse<T>, { status });
}

export function errorResponse(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error } satisfies ApiResponse, { status });
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// QUSCOIN to USD conversion rate
// 1000 QUSCOIN = 1 USD (based on platform rate: 1$ = 500 MALCOIN, 80% conversion)
export const QUSCOIN_TO_USD_RATE = 0.001;
export const MALCOIN_TO_USD_RATE = 0.002;

export function quscoinToUsd(quscoin: number): number {
  return quscoin * QUSCOIN_TO_USD_RATE;
}

export function malcoinToUsd(malcoin: number): number {
  return malcoin * MALCOIN_TO_USD_RATE;
}

// Gift calculation
export const CREATOR_SHARE_PERCENTAGE = 0.8;
export const PLATFORM_FEE_PERCENTAGE = 0.2;

export function calculateGiftShares(malcoinAmount: number): {
  creatorShare: number;
  platformFee: number;
} {
  const creatorShare = Math.floor(malcoinAmount * CREATOR_SHARE_PERCENTAGE);
  const platformFee = malcoinAmount - creatorShare;
  return { creatorShare, platformFee };
}

// Referral commission
export const REFERRAL_SIGNUP_BONUS = 50; // MALCOIN
export const REFERRAL_COMMISSION_RATE = 0.02; // 2%

export function calculateReferralCommission(malcoinRecharged: number): number {
  return Math.floor(malcoinRecharged * REFERRAL_COMMISSION_RATE);
}
