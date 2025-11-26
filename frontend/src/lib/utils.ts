import { type ClassValue, clsx } from 'clsx';
import { formatUnits, parseUnits } from 'viem';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format numbers
export function formatNumber(value: number | string, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

// Format USD
export function formatUSD(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

// Format token amount from Wei
export function formatTokenAmount(value: bigint, decimals = 18, displayDecimals = 2): string {
  const formatted = formatUnits(value, decimals);
  return formatNumber(formatted, displayDecimals);
}

// Parse token amount to Wei
export function parseTokenAmount(value: string, decimals = 18): bigint {
  return parseUnits(value, decimals);
}

// Shorten address
export function shortenAddress(address: string, chars = 4): string {
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

// Format date
export function formatDate(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : timestamp;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

// Format percentage
export function formatPercentage(value: number, decimals = 2): string {
  return `${formatNumber(value, decimals)}%`;
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

// Generate referral link
export function generateReferralLink(address: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nst.finance';
  return `${baseUrl}?ref=${address}`;
}

// Get referrer from URL
export function getReferrerFromURL(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
}

// Calculate growth percentage
export function calculateGrowth(current: bigint, previous: bigint): number {
  if (previous === BigInt(0)) return current > BigInt(0) ? 10000 : 0; // 10000% if starting from 0
  if (current <= previous) return 0;
  
  const increase = current - previous;
  return Number((increase * BigInt(10000)) / previous);
}

// Format growth percentage (basis points to %)
export function formatGrowth(basisPoints: number): string {
  return formatPercentage(basisPoints / 100, 2);
}