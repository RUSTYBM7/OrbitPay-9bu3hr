import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from '@/template';
import {
  MOCK_USER, MOCK_WALLETS, MOCK_TRANSACTIONS, MOCK_CARDS,
  MOCK_CRYPTO, MOCK_INVESTMENTS, MOCK_SAVINGS, MOCK_NOTIFICATIONS, MOCK_CONTACTS,
  User, WalletBalance, Transaction, Card, CryptoAsset, InvestmentAsset, SavingsGoal, Notification, Contact,
} from '../services/mockData';
import {
  fetchUserProfile, fetchWallets, fetchTransactions, fetchCards,
  fetchCrypto, fetchInvestments, fetchSavings, fetchNotifications, fetchContacts,
  createTransaction, markNotificationReadDB, markAllNotificationsReadDB, seedUserData,
} from '../services/supabaseService';

export interface WalletContextType {
  user: User;
  wallets: WalletBalance[];
  activeWallet: WalletBalance;
  activeWalletIndex: number;
  setActiveWalletIndex: (i: number) => void;
  transactions: Transaction[];
  cards: Card[];
  crypto: CryptoAsset[];
  investments: InvestmentAsset[];
  savings: SavingsGoal[];
  notifications: Notification[];
  unreadCount: number;
  contacts: Contact[];
  balanceHidden: boolean;
  toggleBalanceHidden: () => void;
  totalPortfolioValue: number;
  totalCryptoValue: number;
  totalInvestmentValue: number;
  loading: boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => Promise<void>;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  refreshData: () => Promise<void>;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();

  const [user, setUser] = useState<User>(MOCK_USER);
  const [wallets, setWallets] = useState<WalletBalance[]>(MOCK_WALLETS);
  const [activeWalletIndex, setActiveWalletIndex] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [cards, setCards] = useState<Card[]>(MOCK_CARDS);
  const [crypto, setCrypto] = useState<CryptoAsset[]>(MOCK_CRYPTO);
  const [investments, setInvestments] = useState<InvestmentAsset[]>(MOCK_INVESTMENTS);
  const [savings, setSavings] = useState<SavingsGoal[]>(MOCK_SAVINGS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      // Seed data for new users, then fetch all
      await seedUserData(userId, authUser?.username || authUser?.email?.split('@')[0] || 'User');
      const [
        profile, userWallets, userTransactions, userCards,
        userCrypto, userInvestments, userSavings, userNotifications, userContacts,
      ] = await Promise.all([
        fetchUserProfile(userId),
        fetchWallets(userId),
        fetchTransactions(userId),
        fetchCards(userId),
        fetchCrypto(userId),
        fetchInvestments(userId),
        fetchSavings(userId),
        fetchNotifications(userId),
        fetchContacts(userId),
      ]);
      if (profile) setUser(profile);
      if (userWallets.length > 0) setWallets(userWallets);
      if (userTransactions.length > 0) setTransactions(userTransactions);
      if (userCards.length > 0) setCards(userCards);
      if (userCrypto.length > 0) setCrypto(userCrypto);
      if (userInvestments.length > 0) setInvestments(userInvestments);
      if (userSavings.length > 0) setSavings(userSavings);
      if (userNotifications.length > 0) setNotifications(userNotifications);
      if (userContacts.length > 0) setContacts(userContacts);
    } catch (e) {
      // silently fall back to mock data
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser?.id) {
      loadData(authUser.id);
    }
  }, [authUser?.id]);

  const activeWallet = wallets[activeWalletIndex] ?? wallets[0];
  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCryptoValue = crypto.reduce((sum, c) => sum + c.valueUSD, 0);
  const totalInvestmentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const totalPortfolioValue = (activeWallet?.amount ?? 0) + totalCryptoValue + totalInvestmentValue;

  const toggleBalanceHidden = useCallback(() => setBalanceHidden(prev => !prev), []);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = { ...tx, id: `txn_${Date.now()}`, timestamp: new Date().toISOString() };
    setTransactions(prev => [newTx, ...prev]);
    if (authUser?.id) {
      const savedTx = await createTransaction(authUser.id, tx);
      if (savedTx) {
        setTransactions(prev => prev.map(t => t.id === newTx.id ? savedTx : t));
      }
    }
  }, [authUser?.id]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (authUser?.id) markAllNotificationsReadDB(authUser.id);
  }, [authUser?.id]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    markNotificationReadDB(id);
  }, []);

  const refreshData = useCallback(async () => {
    if (authUser?.id) await loadData(authUser.id);
  }, [authUser?.id, loadData]);

  return (
    <WalletContext.Provider value={{
      user, wallets, activeWallet, activeWalletIndex, setActiveWalletIndex,
      transactions, cards, crypto, investments, savings,
      notifications, unreadCount, contacts,
      balanceHidden, toggleBalanceHidden,
      totalPortfolioValue, totalCryptoValue, totalInvestmentValue,
      loading, addTransaction, markAllNotificationsRead, markNotificationRead, refreshData,
    }}>
      {children}
    </WalletContext.Provider>
  );
}
