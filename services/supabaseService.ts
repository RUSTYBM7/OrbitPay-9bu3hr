// OrbitPay Finance — Supabase Service Layer
import { getSupabaseClient } from '@/template';
import {
  WalletBalance, Transaction, Card, CryptoAsset,
  InvestmentAsset, SavingsGoal, Notification, Contact, User,
  MOCK_WALLETS, MOCK_TRANSACTIONS, MOCK_CARDS, MOCK_CRYPTO,
  MOCK_INVESTMENTS, MOCK_SAVINGS, MOCK_NOTIFICATIONS, MOCK_CONTACTS,
} from './mockData';

const db = () => getSupabaseClient();

// ─── User Profile ─────────────────────────────────────────────────────
export async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await db()
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username || 'User',
    firstName: data.first_name || data.username || 'User',
    email: data.email,
    phone: data.phone || '',
    avatar: data.avatar_url || 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face',
    tier: (data.tier as any) || 'standard',
    kycStatus: (data.kyc_status as any) || 'unverified',
    joinDate: data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    orbitId: data.orbit_id || `@${(data.username || 'user').toLowerCase()}`,
  };
}

export async function updateUserProfile(userId: string, updates: Partial<{
  first_name: string; last_name: string; phone: string;
  avatar_url: string; orbit_id: string;
}>): Promise<boolean> {
  const { error } = await db().from('user_profiles').update(updates).eq('id', userId);
  return !error;
}

// ─── Wallets ──────────────────────────────────────────────────────────
export async function fetchWallets(userId: string): Promise<WalletBalance[]> {
  const { data, error } = await db()
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false });
  if (error || !data || data.length === 0) return MOCK_WALLETS;
  return data.map((w: any) => ({
    currency: w.currency,
    symbol: w.symbol,
    amount: Number(w.amount),
    exchangeRate: Number(w.exchange_rate),
    weeklyChange: Number(w.weekly_change),
    weeklyChangePercent: Number(w.weekly_change_percent),
  }));
}

export async function seedWallets(userId: string): Promise<void> {
  const existing = await db().from('wallets').select('id').eq('user_id', userId).limit(1);
  if (existing.data && existing.data.length > 0) return;
  await db().from('wallets').insert(
    MOCK_WALLETS.map((w, i) => ({
      user_id: userId,
      currency: w.currency,
      symbol: w.symbol,
      amount: w.amount,
      exchange_rate: w.exchangeRate,
      weekly_change: w.weeklyChange,
      weekly_change_percent: w.weeklyChangePercent,
      is_primary: i === 0,
    }))
  );
}

// ─── Transactions ─────────────────────────────────────────────────────
export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await db()
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data || data.length === 0) return MOCK_TRANSACTIONS;
  return data.map((t: any) => ({
    id: t.id,
    type: t.type,
    title: t.title,
    subtitle: t.subtitle || '',
    amount: Number(t.amount),
    currency: t.currency,
    status: t.status,
    timestamp: t.created_at,
    icon: t.icon || 'swap-horiz',
    category: t.category || 'Transfer',
    recipientAvatar: t.recipient_avatar,
  }));
}

export async function createTransaction(
  userId: string,
  tx: Omit<Transaction, 'id' | 'timestamp'>
): Promise<Transaction | null> {
  const { data, error } = await db()
    .from('transactions')
    .insert({
      user_id: userId,
      type: tx.type,
      title: tx.title,
      subtitle: tx.subtitle,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      category: tx.category,
      icon: tx.icon,
      recipient_avatar: tx.recipientAvatar,
    })
    .select()
    .single();
  if (error || !data) return null;
  return { ...tx, id: data.id, timestamp: data.created_at };
}

export async function seedTransactions(userId: string): Promise<void> {
  const existing = await db().from('transactions').select('id').eq('user_id', userId).limit(1);
  if (existing.data && existing.data.length > 0) return;
  await db().from('transactions').insert(
    MOCK_TRANSACTIONS.map(t => ({
      user_id: userId,
      type: t.type,
      title: t.title,
      subtitle: t.subtitle,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      category: t.category,
      icon: t.icon,
      recipient_avatar: t.recipientAvatar,
    }))
  );
}

// ─── Cards ────────────────────────────────────────────────────────────
export async function fetchCards(userId: string): Promise<Card[]> {
  const { data, error } = await db()
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error || !data || data.length === 0) return MOCK_CARDS;
  return data.map((c: any) => ({
    id: c.id,
    type: c.type,
    network: c.network,
    last4: c.last4,
    holderName: c.holder_name,
    expiry: c.expiry,
    balance: Number(c.balance),
    currency: c.currency,
    status: c.status,
    color: c.color,
    tier: c.tier,
    cashbackPercent: Number(c.cashback_percent),
    spentThisMonth: Number(c.spent_this_month),
    limitMonthly: Number(c.limit_monthly),
  }));
}

export async function seedCards(userId: string, holderName: string): Promise<void> {
  const existing = await db().from('cards').select('id').eq('user_id', userId).limit(1);
  if (existing.data && existing.data.length > 0) return;
  await db().from('cards').insert(
    MOCK_CARDS.map(c => ({
      user_id: userId,
      type: c.type,
      network: c.network,
      last4: c.last4,
      holder_name: holderName.toUpperCase() || c.holderName,
      expiry: c.expiry,
      balance: c.balance,
      currency: c.currency,
      status: c.status,
      color: c.color,
      tier: c.tier,
      cashback_percent: c.cashbackPercent,
      spent_this_month: c.spentThisMonth,
      limit_monthly: c.limitMonthly,
    }))
  );
}

// ─── Crypto ───────────────────────────────────────────────────────────
export async function fetchCrypto(userId: string): Promise<CryptoAsset[]> {
  const { data, error } = await db()
    .from('crypto_holdings')
    .select('*')
    .eq('user_id', userId);
  if (error || !data || data.length === 0) return MOCK_CRYPTO;
  return data.map((c: any) => ({
    id: c.coin_id,
    name: c.name,
    symbol: c.symbol,
    amount: Number(c.amount),
    valueUSD: Number(c.value_usd),
    price: Number(c.price),
    change24h: Number(c.change_24h),
    change24hPercent: Number(c.change_24h_percent),
    icon: c.icon,
    color: c.color,
  }));
}

export async function seedCrypto(userId: string): Promise<void> {
  const existing = await db().from('crypto_holdings').select('id').eq('user_id', userId).limit(1);
  if (existing.data && existing.data.length > 0) return;
  await db().from('crypto_holdings').insert(
    MOCK_CRYPTO.map(c => ({
      user_id: userId,
      coin_id: c.id,
      name: c.name,
      symbol: c.symbol,
      amount: c.amount,
      value_usd: c.valueUSD,
      price: c.price,
      change_24h: c.change24h,
      change_24h_percent: c.change24hPercent,
      icon: c.icon,
      color: c.color,
    }))
  );
}

// ─── Investments ──────────────────────────────────────────────────────
export async function fetchInvestments(userId: string): Promise<InvestmentAsset[]> {
  const { data, error } = await db()
    .from('investment_holdings')
    .select('*')
    .eq('user_id', userId);
  if (error || !data || data.length === 0) return MOCK_INVESTMENTS;
  return data.map((inv: any) => ({
    id: inv.id,
    name: inv.name,
    ticker: inv.ticker,
    amount: Number(inv.amount),
    currentValue: Number(inv.current_value),
    purchaseValue: Number(inv.purchase_value),
    gainLoss: Number(inv.gain_loss),
    gainLossPercent: Number(inv.gain_loss_percent),
    type: inv.type,
    icon: inv.icon,
  }));
}

export async function seedInvestments(userId: string): Promise<void> {
  const existing = await db().from('investment_holdings').select('id').eq('user_id', userId).limit(1);
  if (existing.data && existing.data.length > 0) return;
  await db().from('investment_holdings').insert(
    MOCK_INVESTMENTS.map(inv => ({
      user_id: userId,
      ticker: inv.ticker,
      name: inv.name,
      amount: inv.amount,
      current_value: inv.currentValue,
      purchase_value: inv.purchaseValue,
      gain_loss: inv.gainLoss,
      gain_loss_percent: inv.gainLossPercent,
      type: inv.type,
      icon: inv.icon,
    }))
  );
}

// ─── Savings ──────────────────────────────────────────────────────────
export async function fetchSavings(userId: string): Promise<SavingsGoal[]> {
  const { data, error } = await db()
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId);
  if (error || !data || data.length === 0) return MOCK_SAVINGS;
  return data.map((s: any) => ({
    id: s.id,
    name: s.name,
    targetAmount: Number(s.target_amount),
    currentAmount: Number(s.current_amount),
    currency: s.currency,
    deadline: s.deadline || '',
    icon: s.icon,
    color: s.color,
    autoSave: s.auto_save,
    autoSaveAmount: Number(s.auto_save_amount),
  }));
}

export async function seedSavings(userId: string): Promise<void> {
  const existing = await db().from('savings_goals').select('id').eq('user_id', userId).limit(1);
  if (existing.data && existing.data.length > 0) return;
  await db().from('savings_goals').insert(
    MOCK_SAVINGS.map(s => ({
      user_id: userId,
      name: s.name,
      target_amount: s.targetAmount,
      current_amount: s.currentAmount,
      currency: s.currency,
      deadline: s.deadline,
      icon: s.icon,
      color: s.color,
      auto_save: s.autoSave,
      auto_save_amount: s.autoSaveAmount,
    }))
  );
}

// ─── Notifications ────────────────────────────────────────────────────
export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await db()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data || data.length === 0) return MOCK_NOTIFICATIONS;
  return data.map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    timestamp: n.created_at,
    read: n.read,
    icon: n.icon,
  }));
}

export async function markNotificationReadDB(notifId: string): Promise<void> {
  await db().from('notifications').update({ read: true }).eq('id', notifId);
}

export async function markAllNotificationsReadDB(userId: string): Promise<void> {
  await db().from('notifications').update({ read: true }).eq('user_id', userId);
}

export async function seedNotifications(userId: string): Promise<void> {
  const existing = await db().from('notifications').select('id').eq('user_id', userId).limit(1);
  if (existing.data && existing.data.length > 0) return;
  await db().from('notifications').insert(
    MOCK_NOTIFICATIONS.map(n => ({
      user_id: userId,
      type: n.type,
      title: n.title,
      message: n.message,
      icon: n.icon,
      read: n.read,
    }))
  );
}

// ─── Contacts ─────────────────────────────────────────────────────────
export async function fetchContacts(userId: string): Promise<Contact[]> {
  const { data, error } = await db()
    .from('contacts')
    .select('*')
    .eq('user_id', userId);
  if (error || !data || data.length === 0) return MOCK_CONTACTS;
  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    username: c.username || '',
    avatar: c.avatar || '',
    recentlySent: c.recently_sent,
    lastTransactionDate: c.last_transaction_date,
  }));
}

export async function seedContacts(userId: string): Promise<void> {
  const existing = await db().from('contacts').select('id').eq('user_id', userId).limit(1);
  if (existing.data && existing.data.length > 0) return;
  await db().from('contacts').insert(
    MOCK_CONTACTS.map(c => ({
      user_id: userId,
      name: c.name,
      username: c.username,
      avatar: c.avatar,
      recently_sent: c.recentlySent,
      last_transaction_date: c.lastTransactionDate || null,
    }))
  );
}

// ─── KYC ─────────────────────────────────────────────────────────────
export async function submitKYC(userId: string, data: {
  firstName: string; lastName: string; dateOfBirth: string;
  addressLine1: string; city: string; country: string; postalCode: string;
  documentType: string; documentFrontUrl?: string; documentBackUrl?: string;
}): Promise<boolean> {
  const { error } = await db().from('kyc_submissions').upsert({
    user_id: userId,
    first_name: data.firstName,
    last_name: data.lastName,
    date_of_birth: data.dateOfBirth,
    address_line1: data.addressLine1,
    city: data.city,
    country: data.country,
    postal_code: data.postalCode,
    document_type: data.documentType,
    document_front_url: data.documentFrontUrl,
    document_back_url: data.documentBackUrl,
    status: 'pending',
    submitted_at: new Date().toISOString(),
  });
  if (!error) {
    await db().from('user_profiles').update({ kyc_status: 'pending' }).eq('id', userId);
  }
  return !error;
}

// ─── Seed all data for new user ───────────────────────────────────────
export async function seedUserData(userId: string, displayName: string): Promise<void> {
  await Promise.all([
    seedWallets(userId),
    seedTransactions(userId),
    seedCards(userId, displayName),
    seedCrypto(userId),
    seedInvestments(userId),
    seedSavings(userId),
    seedNotifications(userId),
    seedContacts(userId),
  ]);
}
