// OrbitPay Finance — Mock Data Service

export interface User {
  id: string;
  name: string;
  firstName: string;
  email: string;
  phone: string;
  avatar: string;
  tier: 'standard' | 'premium' | 'elite';
  kycStatus: 'verified' | 'pending' | 'unverified';
  joinDate: string;
  orbitId: string;
}

export interface WalletBalance {
  currency: string;
  symbol: string;
  amount: number;
  exchangeRate: number;
  weeklyChange: number;
  weeklyChangePercent: number;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'payment' | 'topup' | 'investment' | 'crypto' | 'withdrawal';
  title: string;
  subtitle: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  icon: string;
  category: string;
  recipientAvatar?: string;
}

export interface Card {
  id: string;
  type: 'virtual' | 'physical';
  network: 'visa' | 'mastercard';
  last4: string;
  holderName: string;
  expiry: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'blocked';
  color: string;
  tier: 'standard' | 'premium' | 'elite';
  cashbackPercent: number;
  spentThisMonth: number;
  limitMonthly: number;
}

export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  valueUSD: number;
  price: number;
  change24h: number;
  change24hPercent: number;
  icon: string;
  color: string;
}

export interface InvestmentAsset {
  id: string;
  name: string;
  ticker: string;
  amount: number;
  currentValue: number;
  purchaseValue: number;
  gainLoss: number;
  gainLossPercent: number;
  type: 'stock' | 'etf' | 'bond' | 'fund';
  icon: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: string;
  icon: string;
  color: string;
  autoSave: boolean;
  autoSaveAmount: number;
}

export interface Notification {
  id: string;
  type: 'transaction' | 'security' | 'promotion' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: string;
}

export interface Contact {
  id: string;
  name: string;
  username: string;
  avatar: string;
  recentlySent: boolean;
  lastTransactionDate?: string;
}

// ─── Mock Current User ───────────────────────────────────────────────
export const MOCK_USER: User = {
  id: 'usr_aisha_001',
  name: 'Aisha Mensah',
  firstName: 'Aisha',
  email: 'aisha.mensah@orbitpay.finance',
  phone: '+1 (555) 012-3456',
  avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face',
  tier: 'premium',
  kycStatus: 'verified',
  joinDate: '2023-03-15',
  orbitId: '@aisha.orbit',
};

// ─── Mock Wallets ─────────────────────────────────────────────────────
export const MOCK_WALLETS: WalletBalance[] = [
  { currency: 'USD', symbol: '$', amount: 24850.75, exchangeRate: 1.0, weeklyChange: 421.03, weeklyChangePercent: 1.72 },
  { currency: 'EUR', symbol: '€', amount: 8320.40, exchangeRate: 0.92, weeklyChange: -120.50, weeklyChangePercent: -1.43 },
  { currency: 'GBP', symbol: '£', amount: 5100.00, exchangeRate: 0.79, weeklyChange: 89.20, weeklyChangePercent: 1.78 },
  { currency: 'BTC', symbol: '₿', amount: 0.42, exchangeRate: 67420, weeklyChange: 0.01, weeklyChangePercent: 2.43 },
];

// ─── Mock Transactions ───────────────────────────────────────────────
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn_001',
    type: 'receive',
    title: 'Received from Marcus',
    subtitle: 'Rent split — July',
    amount: 850.00,
    currency: 'USD',
    status: 'completed',
    timestamp: '2026-07-12T10:30:00Z',
    icon: 'arrow-downward',
    category: 'Transfer',
    recipientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: 'txn_002',
    type: 'payment',
    title: 'Netflix Subscription',
    subtitle: 'Monthly — Auto Pay',
    amount: -18.99,
    currency: 'USD',
    status: 'completed',
    timestamp: '2026-07-11T08:00:00Z',
    icon: 'subscriptions',
    category: 'Entertainment',
  },
  {
    id: 'txn_003',
    type: 'send',
    title: 'Sent to Priya K.',
    subtitle: 'Lunch at Nobu',
    amount: -127.50,
    currency: 'USD',
    status: 'completed',
    timestamp: '2026-07-10T14:20:00Z',
    icon: 'arrow-upward',
    category: 'Food',
    recipientAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: 'txn_004',
    type: 'topup',
    title: 'Wallet Top-up',
    subtitle: 'From Chase Bank •••4521',
    amount: 2000.00,
    currency: 'USD',
    status: 'completed',
    timestamp: '2026-07-09T09:15:00Z',
    icon: 'account-balance',
    category: 'Top-up',
  },
  {
    id: 'txn_005',
    type: 'investment',
    title: 'AAPL Dividend',
    subtitle: 'Q2 2026 Dividend',
    amount: 43.12,
    currency: 'USD',
    status: 'completed',
    timestamp: '2026-07-08T16:00:00Z',
    icon: 'trending-up',
    category: 'Investment',
  },
  {
    id: 'txn_006',
    type: 'crypto',
    title: 'Bitcoin Purchase',
    subtitle: '0.005 BTC @ $67,420',
    amount: -337.10,
    currency: 'USD',
    status: 'completed',
    timestamp: '2026-07-07T11:45:00Z',
    icon: 'currency-bitcoin',
    category: 'Crypto',
  },
  {
    id: 'txn_007',
    type: 'payment',
    title: 'Whole Foods Market',
    subtitle: 'Groceries',
    amount: -94.37,
    currency: 'USD',
    status: 'completed',
    timestamp: '2026-07-06T17:30:00Z',
    icon: 'shopping-cart',
    category: 'Groceries',
  },
  {
    id: 'txn_008',
    type: 'send',
    title: 'International Wire',
    subtitle: 'To GBP Wallet — UK',
    amount: -500.00,
    currency: 'USD',
    status: 'pending',
    timestamp: '2026-07-12T09:00:00Z',
    icon: 'public',
    category: 'Transfer',
  },
];

// ─── Mock Cards ──────────────────────────────────────────────────────
export const MOCK_CARDS: Card[] = [
  {
    id: 'card_001',
    type: 'physical',
    network: 'visa',
    last4: '4521',
    holderName: 'AISHA MENSAH',
    expiry: '09/29',
    balance: 24850.75,
    currency: 'USD',
    status: 'active',
    color: '#1B6B4A',
    tier: 'premium',
    cashbackPercent: 2.5,
    spentThisMonth: 1847.32,
    limitMonthly: 10000,
  },
  {
    id: 'card_002',
    type: 'virtual',
    network: 'mastercard',
    last4: '8834',
    holderName: 'AISHA MENSAH',
    expiry: '12/27',
    balance: 8320.40,
    currency: 'EUR',
    status: 'active',
    color: '#0F4530',
    tier: 'standard',
    cashbackPercent: 1.0,
    spentThisMonth: 423.60,
    limitMonthly: 5000,
  },
];

// ─── Mock Crypto ─────────────────────────────────────────────────────
export const MOCK_CRYPTO: CryptoAsset[] = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    amount: 0.4216,
    valueUSD: 28420.87,
    price: 67420.00,
    change24h: 1240.00,
    change24hPercent: 1.87,
    icon: 'currency-bitcoin',
    color: '#F7931A',
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    amount: 4.82,
    valueUSD: 17654.20,
    price: 3662.28,
    change24h: -98.40,
    change24hPercent: -2.62,
    icon: 'diamond',
    color: '#627EEA',
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    amount: 22.5,
    valueUSD: 3487.50,
    price: 155.00,
    change24h: 6.20,
    change24hPercent: 4.17,
    icon: 'wb-sunny',
    color: '#9945FF',
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    amount: 1500.00,
    valueUSD: 1500.00,
    price: 1.00,
    change24h: 0.00,
    change24hPercent: 0.0,
    icon: 'attach-money',
    color: '#2775CA',
  },
];

// ─── Mock Investments ────────────────────────────────────────────────
export const MOCK_INVESTMENTS: InvestmentAsset[] = [
  {
    id: 'inv_aapl',
    name: 'Apple Inc.',
    ticker: 'AAPL',
    amount: 15,
    currentValue: 3187.50,
    purchaseValue: 2850.00,
    gainLoss: 337.50,
    gainLossPercent: 11.84,
    type: 'stock',
    icon: 'phone-iphone',
  },
  {
    id: 'inv_voo',
    name: 'Vanguard S&P 500',
    ticker: 'VOO',
    amount: 8,
    currentValue: 4224.00,
    purchaseValue: 3920.00,
    gainLoss: 304.00,
    gainLossPercent: 7.76,
    type: 'etf',
    icon: 'show-chart',
  },
  {
    id: 'inv_tsla',
    name: 'Tesla Inc.',
    ticker: 'TSLA',
    amount: 10,
    currentValue: 2490.00,
    purchaseValue: 2700.00,
    gainLoss: -210.00,
    gainLossPercent: -7.78,
    type: 'stock',
    icon: 'electric-car',
  },
];

// ─── Mock Savings Goals ──────────────────────────────────────────────
export const MOCK_SAVINGS: SavingsGoal[] = [
  {
    id: 'sav_001',
    name: 'Vacation — Bali',
    targetAmount: 5000,
    currentAmount: 3240,
    currency: 'USD',
    deadline: '2026-12-01',
    icon: 'beach-access',
    color: '#27AE60',
    autoSave: true,
    autoSaveAmount: 200,
  },
  {
    id: 'sav_002',
    name: 'Emergency Fund',
    targetAmount: 20000,
    currentAmount: 12500,
    currency: 'USD',
    deadline: '2027-06-01',
    icon: 'security',
    color: '#2980B9',
    autoSave: true,
    autoSaveAmount: 500,
  },
  {
    id: 'sav_003',
    name: 'New MacBook Pro',
    targetAmount: 3500,
    currentAmount: 1800,
    currency: 'USD',
    deadline: '2026-10-01',
    icon: 'laptop-mac',
    color: '#8E44AD',
    autoSave: false,
    autoSaveAmount: 0,
  },
];

// ─── Mock Contacts ───────────────────────────────────────────────────
export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'c_001',
    name: 'Marcus Lee',
    username: '@marcus.lee',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
    recentlySent: true,
    lastTransactionDate: '2026-07-12',
  },
  {
    id: 'c_002',
    name: 'Priya Kapoor',
    username: '@priya.k',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face',
    recentlySent: true,
    lastTransactionDate: '2026-07-10',
  },
  {
    id: 'c_003',
    name: 'James Osei',
    username: '@james.osei',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    recentlySent: true,
    lastTransactionDate: '2026-07-05',
  },
  {
    id: 'c_004',
    name: 'Sofia Chen',
    username: '@sofia.chen',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face',
    recentlySent: false,
  },
  {
    id: 'c_005',
    name: 'David Williams',
    username: '@david.w',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face',
    recentlySent: false,
  },
];

// ─── Mock Notifications ──────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_001',
    type: 'transaction',
    title: 'Money Received',
    message: 'Marcus Lee sent you $850.00 for Rent split — July',
    timestamp: '2026-07-12T10:30:00Z',
    read: false,
    icon: 'arrow-downward',
  },
  {
    id: 'notif_002',
    type: 'security',
    title: 'New Login Detected',
    message: 'New sign-in from iPhone 16 Pro — Lagos, NG',
    timestamp: '2026-07-12T08:15:00Z',
    read: false,
    icon: 'security',
  },
  {
    id: 'notif_003',
    type: 'promotion',
    title: 'Earn 3x Rewards This Weekend',
    message: 'Use your OrbitPay card at select restaurants to earn triple points.',
    timestamp: '2026-07-11T09:00:00Z',
    read: true,
    icon: 'star',
  },
  {
    id: 'notif_004',
    type: 'transaction',
    title: 'Auto-Save Complete',
    message: '$200 auto-saved to your Bali Vacation goal.',
    timestamp: '2026-07-10T00:01:00Z',
    read: true,
    icon: 'savings',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────
export function formatCurrency(amount: number, symbol: string): string {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
