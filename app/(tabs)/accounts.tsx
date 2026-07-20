import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useRouter } from 'expo-router';
import { useWallet } from '../../hooks/useWallet';
import { useTheme } from '../../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../../constants/theme';
import { formatCurrency } from '../../services/mockData';

const TABS = ['Overview', 'Crypto', 'Invest', 'Savings'];

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const router = useRouter();
  const { colors } = useTheme();
  const {
    wallets, activeWallet, activeWalletIndex, setActiveWalletIndex,
    crypto, investments, savings, totalCryptoValue, totalInvestmentValue,
  } = useWallet();

  const [activeTab, setActiveTab] = useState('Overview');

  const totalSavings = savings.reduce((s, g) => s + g.currentAmount, 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Accounts</Text>
        <Pressable
          style={[styles.headerBtn, { backgroundColor: colors.surface }]}
          onPress={() => showAlert('Add Account', 'Link a bank account, card, or crypto wallet.')}
          hitSlop={8}
        >
          <MaterialIcons name="add" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map(t => (
          <Pressable
            key={t}
            style={[styles.tab, { backgroundColor: colors.surface, borderColor: colors.border }, activeTab === t && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === t && { color: colors.textOnDark, fontWeight: FontWeight.semibold }]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {activeTab === 'Overview' && (
          <>
            <View style={[styles.netWorthCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.netWorthLabel}>Total Net Worth</Text>
              <Text style={styles.netWorthAmount}>
                ${(activeWallet.amount + totalCryptoValue + totalInvestmentValue + totalSavings).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
              <View style={styles.netWorthBreakdown}>
                {[
                  { label: 'Cash', value: activeWallet.amount, color: '#FFFFFF' },
                  { label: 'Crypto', value: totalCryptoValue, color: '#F7931A' },
                  { label: 'Stocks', value: totalInvestmentValue, color: '#627EEA' },
                  { label: 'Savings', value: totalSavings, color: '#2ECC71' },
                ].map(item => (
                  <View key={item.label} style={styles.netWorthItem}>
                    <View style={[styles.netWorthDot, { backgroundColor: item.color }]} />
                    <Text style={styles.netWorthItemLabel}>{item.label}</Text>
                    <Text style={styles.netWorthItemValue}>${item.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Wallets</Text>
            {wallets.map((w, i) => (
              <Pressable
                key={w.currency}
                style={[styles.walletRow, { backgroundColor: colors.surface, borderColor: i === activeWalletIndex ? colors.mint : 'transparent' }]}
                onPress={() => { setActiveWalletIndex(i); showAlert(`${w.currency} Wallet`, `Balance: ${w.symbol}${w.amount.toLocaleString()}`); }}
              >
                <View style={[styles.walletIcon, { backgroundColor: i === 0 ? colors.primary : i === 1 ? '#627EEA' : i === 2 ? colors.info : '#F7931A' }]}>
                  <Text style={styles.walletIconText}>{w.currency.slice(0, 1)}</Text>
                </View>
                <View style={styles.walletInfo}>
                  <Text style={[styles.walletCurrency, { color: colors.textPrimary }]}>{w.currency} Wallet</Text>
                  <Text style={[styles.walletRate, { color: colors.textMuted }]}>1 {w.currency} = {w.exchangeRate.toFixed(2)} USD</Text>
                </View>
                <View style={styles.walletRight}>
                  <Text style={[styles.walletBalance, { color: colors.textPrimary }]}>{w.symbol}{w.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
                  <View style={[styles.walletChangePill, { backgroundColor: w.weeklyChange >= 0 ? colors.successBg : colors.errorBg }]}>
                    <Text style={[styles.walletChangeText, { color: w.weeklyChange >= 0 ? colors.success : colors.error }]}>
                      {w.weeklyChange >= 0 ? '+' : ''}{w.weeklyChangePercent.toFixed(2)}%
                    </Text>
                  </View>
                </View>
                {i === activeWalletIndex && <MaterialIcons name="check-circle" size={16} color={colors.success} style={{ marginLeft: 8 }} />}
              </Pressable>
            ))}
          </>
        )}

        {activeTab === 'Crypto' && (
          <>
            <View style={[styles.portfolioHeader, { backgroundColor: colors.surface }]}>
              <View>
                <Text style={[styles.portfolioLabel, { color: colors.textMuted }]}>Crypto Portfolio</Text>
                <Text style={[styles.portfolioValue, { color: colors.textPrimary }]}>${totalCryptoValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
              </View>
              <Pressable style={[styles.tradeBtn, { backgroundColor: colors.primary }]} onPress={() => showAlert('Trade', 'Buy or sell crypto assets.')}>
                <Text style={styles.tradeBtnText}>Trade</Text>
              </Pressable>
            </View>
            {crypto.map(c => (
              <Pressable
                key={c.id}
                style={[styles.assetRow, { backgroundColor: colors.surface }]}
                onPress={() => router.push({ pathname: '/crypto-detail', params: { id: c.id } })}
              >
                <View style={[styles.assetIcon, { backgroundColor: c.color + '22' }]}>
                  <MaterialIcons name={c.icon as any} size={22} color={c.color} />
                </View>
                <View style={styles.assetInfo}>
                  <Text style={[styles.assetName, { color: colors.textPrimary }]}>{c.name}</Text>
                  <Text style={[styles.assetSub, { color: colors.textMuted }]}>{c.amount} {c.symbol}</Text>
                </View>
                <View style={styles.assetRight}>
                  <Text style={[styles.assetValue, { color: colors.textPrimary }]}>${c.valueUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
                  <Text style={[styles.assetChange, { color: c.change24hPercent >= 0 ? colors.success : colors.error }]}>
                    {c.change24hPercent >= 0 ? '+' : ''}{c.change24hPercent.toFixed(2)}%
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {activeTab === 'Invest' && (
          <>
            <View style={[styles.portfolioHeader, { backgroundColor: colors.surface }]}>
              <View>
                <Text style={[styles.portfolioLabel, { color: colors.textMuted }]}>Investment Portfolio</Text>
                <Text style={[styles.portfolioValue, { color: colors.textPrimary }]}>${totalInvestmentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
              </View>
              <Pressable style={[styles.tradeBtn, { backgroundColor: colors.primary }]} onPress={() => showAlert('Invest', 'Buy stocks, ETFs, and funds.')}>
                <Text style={styles.tradeBtnText}>Invest</Text>
              </Pressable>
            </View>
            {investments.map(inv => (
              <Pressable
                key={inv.id}
                style={[styles.assetRow, { backgroundColor: colors.surface }]}
                onPress={() => showAlert(inv.name, `Ticker: ${inv.ticker}\nValue: $${inv.currentValue.toLocaleString()}\nGain/Loss: $${inv.gainLoss.toFixed(2)} (${inv.gainLossPercent.toFixed(2)}%)`)}
              >
                <View style={[styles.assetIcon, { backgroundColor: colors.background }]}>
                  <MaterialIcons name={inv.icon as any} size={22} color={colors.primary} />
                </View>
                <View style={styles.assetInfo}>
                  <Text style={[styles.assetName, { color: colors.textPrimary }]}>{inv.ticker}</Text>
                  <Text style={[styles.assetSub, { color: colors.textMuted }]}>{inv.amount} shares · {inv.type.toUpperCase()}</Text>
                </View>
                <View style={styles.assetRight}>
                  <Text style={[styles.assetValue, { color: colors.textPrimary }]}>${inv.currentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
                  <Text style={[styles.assetChange, { color: inv.gainLoss >= 0 ? colors.success : colors.error }]}>
                    {inv.gainLoss >= 0 ? '+' : ''}${inv.gainLoss.toFixed(2)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {activeTab === 'Savings' && (
          <>
            <View style={[styles.portfolioHeader, { backgroundColor: colors.surface }]}>
              <View>
                <Text style={[styles.portfolioLabel, { color: colors.textMuted }]}>Total Savings</Text>
                <Text style={[styles.portfolioValue, { color: colors.textPrimary }]}>${totalSavings.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
              </View>
              <Pressable style={[styles.tradeBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/auto-save')}>
                <MaterialIcons name="autorenew" size={16} color={colors.textOnDark} />
                <Text style={styles.tradeBtnText}>Auto-Save</Text>
              </Pressable>
            </View>
            {savings.map(goal => {
              const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              return (
                <Pressable
                  key={goal.id}
                  style={[styles.savingsCard, { backgroundColor: colors.surface }]}
                  onPress={() => showAlert(goal.name, `Saved: $${goal.currentAmount.toLocaleString()} / $${goal.targetAmount.toLocaleString()}\nDeadline: ${goal.deadline}\nAuto-save: ${goal.autoSave ? `$${goal.autoSaveAmount}/month` : 'Off'}`)}
                >
                  <View style={styles.savingsCardTop}>
                    <View style={[styles.savingsIcon, { backgroundColor: goal.color + '22' }]}>
                      <MaterialIcons name={goal.icon as any} size={20} color={goal.color} />
                    </View>
                    <View style={styles.savingsInfo}>
                      <Text style={[styles.savingsName, { color: colors.textPrimary }]}>{goal.name}</Text>
                      <Text style={[styles.savingsDeadline, { color: colors.textMuted }]}>by {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <View style={styles.savingsRight}>
                      <Text style={[styles.savingsAmount, { color: colors.textPrimary }]}>${goal.currentAmount.toLocaleString()}</Text>
                      <Text style={[styles.savingsTarget, { color: colors.textMuted }]}>of ${goal.targetAmount.toLocaleString()}</Text>
                    </View>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
                    <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: goal.color }]} />
                  </View>
                  <View style={styles.savingsFooter}>
                    <Text style={[styles.savingsPct, { color: colors.textMuted }]}>{pct.toFixed(0)}% reached</Text>
                    {goal.autoSave && (
                      <Pressable
                        style={[styles.autoSavePill, { backgroundColor: colors.successBg }]}
                        onPress={() => router.push('/auto-save')}
                      >
                        <MaterialIcons name="autorenew" size={11} color={colors.success} />
                        <Text style={[styles.autoSaveText, { color: colors.success }]}>${goal.autoSaveAmount}/mo</Text>
                      </Pressable>
                    )}
                    {!goal.autoSave && (
                      <Pressable
                        style={[styles.autoSavePill, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                        onPress={() => router.push('/auto-save')}
                      >
                        <MaterialIcons name="add" size={11} color={colors.textMuted} />
                        <Text style={[styles.autoSaveText, { color: colors.textMuted }]}>Add auto-save</Text>
                      </Pressable>
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
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  headerBtn: { width: 40, height: 40, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  tabBar: { paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  tab: { paddingHorizontal: Spacing.base, paddingVertical: 9, borderRadius: Radius.pill, marginRight: Spacing.sm, borderWidth: 1 },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  content: { paddingHorizontal: Spacing.base },
  netWorthCard: { borderRadius: Radius.xxl, padding: Spacing.lg, marginBottom: Spacing.base, ...Shadow.md },
  netWorthLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  netWorthAmount: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: '#FFFFFF', marginBottom: Spacing.base },
  netWorthBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  netWorthItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: '40%' },
  netWorthDot: { width: 8, height: 8, borderRadius: 4 },
  netWorthItemLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', flex: 1 },
  netWorthItemValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  walletRow: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm, borderWidth: 1.5 },
  walletIcon: { width: 44, height: 44, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  walletIconText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  walletInfo: { flex: 1 },
  walletCurrency: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  walletRate: { fontSize: FontSize.xs, marginTop: 2 },
  walletRight: { alignItems: 'flex-end' },
  walletBalance: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  walletChangePill: { borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  walletChangeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  portfolioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.sm },
  portfolioLabel: { fontSize: FontSize.sm, marginBottom: 2 },
  portfolioValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  tradeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.pill, paddingHorizontal: Spacing.base, paddingVertical: 9 },
  tradeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  assetRow: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm },
  assetIcon: { width: 44, height: 44, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  assetInfo: { flex: 1 },
  assetName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  assetSub: { fontSize: FontSize.xs, marginTop: 2 },
  assetRight: { alignItems: 'flex-end' },
  assetValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  assetChange: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginTop: 2 },
  savingsCard: { borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.sm },
  savingsCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  savingsIcon: { width: 44, height: 44, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  savingsInfo: { flex: 1 },
  savingsName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  savingsDeadline: { fontSize: FontSize.xs, marginTop: 2 },
  savingsRight: { alignItems: 'flex-end' },
  savingsAmount: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  savingsTarget: { fontSize: FontSize.xs, marginTop: 2 },
  progressTrack: { height: 6, borderRadius: Radius.pill, marginBottom: Spacing.sm, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.pill },
  savingsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savingsPct: { fontSize: FontSize.xs },
  autoSavePill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  autoSaveText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
});
