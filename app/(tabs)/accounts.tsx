import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useRouter } from 'expo-router';
import { useWallet } from '../../hooks/useWallet';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../../constants/theme';
import { formatCurrency } from '../../services/mockData';

const TABS = ['Overview', 'Crypto', 'Invest', 'Savings'];

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const router = useRouter();
  const {
    wallets, activeWallet, activeWalletIndex, setActiveWalletIndex,
    crypto, investments, savings, totalCryptoValue, totalInvestmentValue,
  } = useWallet();

  const [activeTab, setActiveTab] = useState('Overview');

  const totalSavings = savings.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Accounts</Text>
        <Pressable
          style={styles.headerBtn}
          onPress={() => showAlert('Add Account', 'Link a bank account, card, or crypto wallet.')}
          hitSlop={8}
        >
          <MaterialIcons name="add" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map(t => (
          <Pressable
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {activeTab === 'Overview' && (
          <>
            {/* Net Worth Banner */}
            <View style={styles.netWorthCard}>
              <Text style={styles.netWorthLabel}>Total Net Worth</Text>
              <Text style={styles.netWorthAmount}>
                ${(activeWallet.amount + totalCryptoValue + totalInvestmentValue + totalSavings).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
              <View style={styles.netWorthBreakdown}>
                {[
                  { label: 'Cash', value: activeWallet.amount, color: Colors.primary },
                  { label: 'Crypto', value: totalCryptoValue, color: Colors.bitcoin },
                  { label: 'Stocks', value: totalInvestmentValue, color: Colors.ethereum },
                  { label: 'Savings', value: totalSavings, color: Colors.success },
                ].map(item => (
                  <View key={item.label} style={styles.netWorthItem}>
                    <View style={[styles.netWorthDot, { backgroundColor: item.color }]} />
                    <Text style={styles.netWorthItemLabel}>{item.label}</Text>
                    <Text style={styles.netWorthItemValue}>
                      ${item.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Wallets List */}
            <Text style={styles.sectionTitle}>My Wallets</Text>
            {wallets.map((w, i) => (
              <Pressable
                key={w.currency}
                style={[styles.walletRow, i === activeWalletIndex && styles.walletRowActive]}
                onPress={() => { setActiveWalletIndex(i); showAlert(`${w.currency} Wallet`, `Balance: ${w.symbol}${w.amount.toLocaleString()}`); }}
              >
                <View style={[styles.walletIcon, { backgroundColor: i === 0 ? Colors.primary : i === 1 ? Colors.ethereum : i === 2 ? Colors.info : Colors.bitcoin }]}>
                  <Text style={styles.walletIconText}>{w.currency.slice(0, 1)}</Text>
                </View>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletCurrency}>{w.currency} Wallet</Text>
                  <Text style={styles.walletRate}>1 {w.currency} = {w.exchangeRate.toFixed(2)} USD</Text>
                </View>
                <View style={styles.walletRight}>
                  <Text style={styles.walletBalance}>{w.symbol}{w.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
                  <View style={[styles.walletChangePill, w.weeklyChange >= 0 ? styles.pillGreen : styles.pillRed]}>
                    <Text style={[styles.walletChangeText, { color: w.weeklyChange >= 0 ? Colors.success : Colors.error }]}>
                      {w.weeklyChange >= 0 ? '+' : ''}{w.weeklyChangePercent.toFixed(2)}%
                    </Text>
                  </View>
                </View>
                {i === activeWalletIndex && (
                  <MaterialIcons name="check-circle" size={16} color={Colors.success} style={{ marginLeft: 8 }} />
                )}
              </Pressable>
            ))}
          </>
        )}

        {activeTab === 'Crypto' && (
          <>
            <View style={styles.portfolioHeader}>
              <View>
                <Text style={styles.portfolioLabel}>Crypto Portfolio</Text>
                <Text style={styles.portfolioValue}>${totalCryptoValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
              </View>
              <Pressable style={styles.tradeBtn} onPress={() => showAlert('Trade', 'Buy or sell crypto assets.')}>
                <Text style={styles.tradeBtnText}>Trade</Text>
              </Pressable>
            </View>
            {crypto.map(c => (
              <Pressable
                key={c.id}
                style={styles.assetRow}
                onPress={() => router.push({ pathname: '/crypto-detail', params: { id: c.id } })}
              >
                <View style={[styles.assetIcon, { backgroundColor: c.color + '22' }]}>
                  <MaterialIcons name={c.icon as any} size={22} color={c.color} />
                </View>
                <View style={styles.assetInfo}>
                  <Text style={styles.assetName}>{c.name}</Text>
                  <Text style={styles.assetSub}>{c.amount} {c.symbol}</Text>
                </View>
                <View style={styles.assetRight}>
                  <Text style={styles.assetValue}>${c.valueUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
                  <Text style={[styles.assetChange, { color: c.change24hPercent >= 0 ? Colors.success : Colors.error }]}>
                    {c.change24hPercent >= 0 ? '+' : ''}{c.change24hPercent.toFixed(2)}%
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {activeTab === 'Invest' && (
          <>
            <View style={styles.portfolioHeader}>
              <View>
                <Text style={styles.portfolioLabel}>Investment Portfolio</Text>
                <Text style={styles.portfolioValue}>${totalInvestmentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
              </View>
              <Pressable style={styles.tradeBtn} onPress={() => showAlert('Invest', 'Buy stocks, ETFs, and funds.')}>
                <Text style={styles.tradeBtnText}>Invest</Text>
              </Pressable>
            </View>
            {investments.map(inv => (
              <Pressable
                key={inv.id}
                style={styles.assetRow}
                onPress={() => showAlert(inv.name, `Ticker: ${inv.ticker}\nValue: $${inv.currentValue.toLocaleString()}\nGain/Loss: $${inv.gainLoss.toFixed(2)} (${inv.gainLossPercent.toFixed(2)}%)`)}
              >
                <View style={[styles.assetIcon, { backgroundColor: Colors.background }]}>
                  <MaterialIcons name={inv.icon as any} size={22} color={Colors.primary} />
                </View>
                <View style={styles.assetInfo}>
                  <Text style={styles.assetName}>{inv.ticker}</Text>
                  <Text style={styles.assetSub}>{inv.amount} shares · {inv.type.toUpperCase()}</Text>
                </View>
                <View style={styles.assetRight}>
                  <Text style={styles.assetValue}>${inv.currentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
                  <Text style={[styles.assetChange, { color: inv.gainLoss >= 0 ? Colors.success : Colors.error }]}>
                    {inv.gainLoss >= 0 ? '+' : ''}${inv.gainLoss.toFixed(2)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {activeTab === 'Savings' && (
          <>
            <View style={styles.portfolioHeader}>
              <View>
                <Text style={styles.portfolioLabel}>Total Savings</Text>
                <Text style={styles.portfolioValue}>${totalSavings.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
              </View>
              <Pressable style={styles.tradeBtn} onPress={() => showAlert('New Goal', 'Create a new savings goal.')}>
                <MaterialIcons name="add" size={16} color={Colors.textOnDark} />
                <Text style={styles.tradeBtnText}>New Goal</Text>
              </Pressable>
            </View>
            {savings.map(goal => {
              const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              return (
                <Pressable
                  key={goal.id}
                  style={styles.savingsCard}
                  onPress={() => showAlert(goal.name, `Saved: $${goal.currentAmount.toLocaleString()} / $${goal.targetAmount.toLocaleString()}\nDeadline: ${goal.deadline}\nAuto-save: ${goal.autoSave ? `$${goal.autoSaveAmount}/month` : 'Off'}`)}
                >
                  <View style={styles.savingsCardTop}>
                    <View style={[styles.savingsIcon, { backgroundColor: goal.color + '22' }]}>
                      <MaterialIcons name={goal.icon as any} size={20} color={goal.color} />
                    </View>
                    <View style={styles.savingsInfo}>
                      <Text style={styles.savingsName}>{goal.name}</Text>
                      <Text style={styles.savingsDeadline}>by {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <View style={styles.savingsRight}>
                      <Text style={styles.savingsAmount}>${goal.currentAmount.toLocaleString()}</Text>
                      <Text style={styles.savingsTarget}>of ${goal.targetAmount.toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: goal.color }]} />
                  </View>
                  <View style={styles.savingsFooter}>
                    <Text style={styles.savingsPct}>{pct.toFixed(0)}% reached</Text>
                    {goal.autoSave && (
                      <View style={styles.autoSavePill}>
                        <MaterialIcons name="autorenew" size={11} color={Colors.success} />
                        <Text style={styles.autoSaveText}>${goal.autoSaveAmount}/mo</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerBtn: {
    width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  tabBar: { paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  tab: {
    paddingHorizontal: Spacing.base, paddingVertical: 9, borderRadius: Radius.pill,
    backgroundColor: Colors.surface, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tabTextActive: { color: Colors.textOnDark, fontWeight: FontWeight.semibold },
  content: { paddingHorizontal: Spacing.base },
  netWorthCard: {
    backgroundColor: Colors.primary, borderRadius: Radius.xxl,
    padding: Spacing.lg, marginBottom: Spacing.base, ...Shadow.md,
  },
  netWorthLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  netWorthAmount: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textOnDark, marginBottom: Spacing.base },
  netWorthBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  netWorthItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: '40%' },
  netWorthDot: { width: 8, height: 8, borderRadius: 4 },
  netWorthItemLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', flex: 1 },
  netWorthItemValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  walletRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm,
    ...Shadow.sm, borderWidth: 1.5, borderColor: 'transparent',
  },
  walletRowActive: { borderColor: Colors.mint },
  walletIcon: {
    width: 44, height: 44, borderRadius: Radius.circle,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  walletIconText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  walletInfo: { flex: 1 },
  walletCurrency: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  walletRate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  walletRight: { alignItems: 'flex-end' },
  walletBalance: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  walletChangePill: { borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  pillGreen: { backgroundColor: Colors.successBg },
  pillRed: { backgroundColor: Colors.errorBg },
  walletChangeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  portfolioHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
    marginBottom: Spacing.md, ...Shadow.sm,
  },
  portfolioLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 2 },
  portfolioValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  tradeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.base, paddingVertical: 9,
  },
  tradeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  assetRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  assetIcon: {
    width: 44, height: 44, borderRadius: Radius.circle,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  assetInfo: { flex: 1 },
  assetName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  assetSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  assetRight: { alignItems: 'flex-end' },
  assetValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  assetChange: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginTop: 2 },
  savingsCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.sm,
  },
  savingsCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  savingsIcon: {
    width: 44, height: 44, borderRadius: Radius.circle,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  savingsInfo: { flex: 1 },
  savingsName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  savingsDeadline: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  savingsRight: { alignItems: 'flex-end' },
  savingsAmount: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  savingsTarget: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  progressTrack: {
    height: 6, backgroundColor: Colors.background, borderRadius: Radius.pill, marginBottom: Spacing.sm, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: Radius.pill },
  savingsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savingsPct: { fontSize: FontSize.xs, color: Colors.textMuted },
  autoSavePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.successBg, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 3,
  },
  autoSaveText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.semibold },
});
