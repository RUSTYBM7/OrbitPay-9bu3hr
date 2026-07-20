import React, { useState, useCallback, memo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  StatusBar, Platform, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useRouter } from 'expo-router';
import { useWallet } from '../../hooks/useWallet';
import { useTheme } from '../../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../../constants/theme';
import { formatCurrency, formatDate } from '../../services/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Quick Action Button ──────────────────────────────────────────────
interface QuickActionProps { icon: string; label: string; onPress: () => void; highlight?: boolean; colors: any; }
const QuickAction = memo(({ icon, label, onPress, highlight, colors }: QuickActionProps) => (
  <Pressable style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]} onPress={onPress} accessibilityLabel={label} hitSlop={8}>
    <View style={[styles.quickActionIcon, { backgroundColor: highlight ? colors.primary : colors.background }]}>
      <MaterialIcons name={icon as any} size={22} color={highlight ? colors.textOnDark : colors.primary} />
    </View>
    <Text style={[styles.quickActionLabel, { color: colors.textSecondary }]}>{label}</Text>
  </Pressable>
));

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { colors, isDark } = useTheme();
  const {
    user, wallets, activeWallet, activeWalletIndex, setActiveWalletIndex,
    transactions, unreadCount, balanceHidden, toggleBalanceHidden,
    totalCryptoValue, totalInvestmentValue,
  } = useWallet();
  const router = useRouter();

  const handleQuickAction = useCallback((action: string) => {
    if (action === 'Send') { router.push('/send-money'); return; }
    if (action === 'Notifications') { router.push('/notifications'); return; }
    if (action === 'Scan QR') { router.push('/scan-qr'); return; }
    if (action === 'Receive') { router.push('/receive-qr'); return; }
    if (action === 'Pay Bills') { router.push('/pay-bills'); return; }
    if (action === 'History' || action === 'All Transactions') { router.push('/transactions'); return; }
    if (action === 'Invest') { router.push('/(tabs)/accounts'); return; }
    if (action === 'Crypto') { router.push('/(tabs)/accounts'); return; }
    if (action === 'Cards') { router.push('/(tabs)/cards'); return; }
    if (action === 'Trade') { router.push('/crypto-trade'); return; }
    if (action === 'Rewards') { router.push('/rewards'); return; }
    if (action === 'Wire') { router.push('/wire-transfer'); return; }
    showAlert(action, `${action} — feature available in full build.`, [{ text: 'OK', style: 'default' }]);
  }, [showAlert, router]);

  const balanceDisplay = balanceHidden
    ? '••••••'
    : formatCurrency(activeWallet.amount, activeWallet.symbol);
  const changePositive = activeWallet.weeklyChange >= 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Image
          source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/Q4JchbpdQ8eur9GkT4Bqa9/Logo_3600%C3%971100_(3800_x_1400_px)_(6500_x_1400_px)_(7800_x_1800_px)_-_1.svg' }}
          style={styles.logoImg}
          contentFit="contain"
        />
        <View style={styles.topActions}>
          <Pressable style={[styles.topIconBtn, { backgroundColor: colors.surface }]} onPress={() => router.push('/ai-chat')} accessibilityLabel="AI Assistant" hitSlop={8}>
            <MaterialIcons name="headset-mic" size={22} color={colors.primary} />
          </Pressable>
          <Pressable style={[styles.topIconBtn, { backgroundColor: colors.surface }]} onPress={() => router.push('/notifications')} accessibilityLabel="Notifications" hitSlop={8}>
            <MaterialIcons name="notifications" size={22} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Welcome Card ── */}
        <View style={[styles.welcomeCard, { backgroundColor: colors.surface }]}>
          <Image source={{ uri: user.avatar }} style={styles.avatarImg} contentFit="cover" transition={200} />
          <View style={styles.welcomeText}>
            <Text style={[styles.welcomeLabel, { color: colors.textMuted }]}>Welcome back,</Text>
            <Text style={[styles.welcomeName, { color: colors.textPrimary }]}>{user.firstName}</Text>
          </View>
          <View style={[styles.premiumBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <MaterialIcons name="workspace-premium" size={13} color={colors.primary} />
            <Text style={[styles.premiumText, { color: colors.primary }]}>PREMIUM</Text>
          </View>
        </View>

        {/* ── Balance Card ── */}
        <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyBar}>
            {wallets.map((w, i) => (
              <Pressable
                key={w.currency}
                style={[styles.currencyPill, { backgroundColor: colors.background, borderColor: colors.border }, i === activeWalletIndex && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setActiveWalletIndex(i)}
              >
                <Text style={[styles.currencyPillText, { color: colors.textSecondary }, i === activeWalletIndex && { color: colors.textOnDark }]}>{w.currency}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.hideBtn} onPress={toggleBalanceHidden} hitSlop={12}>
            <MaterialIcons name={balanceHidden ? 'visibility' : 'visibility-off'} size={20} color={colors.textMuted} />
          </Pressable>

          <Text style={[styles.rateLabel, { color: colors.textMuted }]}>1 {activeWallet.currency} = {activeWallet.exchangeRate.toFixed(2)} {activeWallet.currency}</Text>
          <Text style={[styles.balanceAmount, { color: colors.textPrimary }]}>{balanceDisplay}</Text>

          <View style={[styles.changePill, changePositive ? { backgroundColor: colors.successBg } : { backgroundColor: colors.errorBg }]}>
            <MaterialIcons name={changePositive ? 'trending-up' : 'trending-down'} size={14} color={changePositive ? colors.success : colors.error} />
            <Text style={[styles.changeText, { color: changePositive ? colors.success : colors.error }]}>
              {changePositive ? '+' : ''}{formatCurrency(activeWallet.weeklyChange, activeWallet.symbol)}
            </Text>
            <Text style={[styles.changeLabel, { color: colors.textMuted }]}>this week</Text>
          </View>

          <View style={styles.portfolioRow}>
            {[
              { label: 'Crypto', value: `$${totalCryptoValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
              { label: 'Investments', value: `$${totalInvestmentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
              { label: 'Savings', value: '$15,740' },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && <View style={[styles.portfolioSep, { backgroundColor: colors.divider }]} />}
                <View style={styles.portfolioItem}>
                  <Text style={[styles.portfolioItemLabel, { color: colors.textMuted }]}>{item.label}</Text>
                  <Text style={[styles.portfolioItemValue, { color: colors.textPrimary }]}>{item.value}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Primary Quick Actions ── */}
        <View style={[styles.actionsRow, { backgroundColor: colors.surface }]}>
          {[
            { icon: 'send', label: 'Send' },
            { icon: 'download', label: 'Receive' },
            { icon: 'qr-code-scanner', label: 'Scan QR' },
            { icon: 'receipt-long', label: 'Pay Bills' },
          ].map(a => (
            <QuickAction key={a.label} icon={a.icon} label={a.label} onPress={() => handleQuickAction(a.label)} colors={colors} />
          ))}
        </View>

        {/* ── Secondary Actions ── */}
        <View style={[styles.actionsRow, { backgroundColor: colors.surface }]}>
          {[
            { icon: 'credit-card', label: 'Cards' },
            { icon: 'trending-up', label: 'Invest' },
            { icon: 'currency-bitcoin', label: 'Crypto' },
            { icon: 'history', label: 'History' },
          ].map(a => (
            <QuickAction key={a.label} icon={a.icon} label={a.label} onPress={() => handleQuickAction(a.label)} colors={colors} />
          ))}
        </View>

        {/* ── Due Soon Bills Strip ── */}
        <View style={styles.dueSoonWrap}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Due Soon</Text>
            <Pressable onPress={() => router.push('/pay-bills')} hitSlop={12}>
              <Text style={[styles.sectionAction, { color: colors.mint }]}>Pay Bills</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { name: 'PG&E Electric', icon: 'bolt', color: '#F59E0B', amount: 94.20, dueIn: 2 },
              { name: 'Comcast', icon: 'wifi', color: '#3B82F6', amount: 79.99, dueIn: 5 },
              { name: 'T-Mobile', icon: 'smartphone', color: '#E5007D', amount: 55.00, dueIn: 7 },
              { name: 'Netflix', icon: 'tv', color: '#E50914', amount: 18.99, dueIn: 12 },
            ].map((bill, i) => (
              <Pressable
                key={i}
                style={[styles.dueSoonCard, { backgroundColor: colors.surface, borderColor: bill.dueIn <= 3 ? colors.warning : colors.border }]}
                onPress={() => router.push('/pay-bills')}
              >
                <View style={[styles.dueSoonIcon, { backgroundColor: bill.color + '22' }]}>
                  <MaterialIcons name={bill.icon as any} size={18} color={bill.color} />
                </View>
                <Text style={[styles.dueSoonName, { color: colors.textPrimary }]} numberOfLines={1}>{bill.name}</Text>
                <Text style={[styles.dueSoonAmount, { color: colors.textPrimary }]}>${bill.amount.toFixed(2)}</Text>
                <View style={[styles.dueSoonBadge, { backgroundColor: bill.dueIn <= 3 ? colors.warningBg : colors.background }]}>
                  <MaterialIcons name="schedule" size={10} color={bill.dueIn <= 3 ? colors.warning : colors.textMuted} />
                  <Text style={[styles.dueSoonDays, { color: bill.dueIn <= 3 ? colors.warning : colors.textMuted }]}>
                    {bill.dueIn === 1 ? 'Tomorrow' : `${bill.dueIn}d`}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Spending Insight ── */}
        <Pressable style={[styles.insightBanner, { backgroundColor: colors.cardMint, borderColor: colors.border }]} onPress={() => router.push('/analytics')}>
          <MaterialIcons name="smart-toy" size={20} color={colors.primary} />
          <Text style={[styles.insightText, { color: colors.textSecondary }]}>
            Your spending is <Text style={{ fontWeight: FontWeight.bold }}>12% below average</Text> this month
          </Text>
          <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
        </Pressable>

        {/* ── Recent Transactions ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
          <Pressable onPress={() => router.push('/transactions')} hitSlop={12}>
            <Text style={[styles.sectionAction, { color: colors.mint }]}>See All</Text>
          </Pressable>
        </View>

        <View style={[styles.txList, { backgroundColor: colors.surface }]}>
          {transactions.slice(0, 6).map((tx, txIdx) => {
            const isCredit = tx.amount > 0;
            const sym = tx.currency === 'USD' ? '$' : tx.currency === 'EUR' ? '€' : tx.currency === 'GBP' ? '£' : '';
            return (
              <Pressable key={tx.id} style={[styles.txRow, { borderBottomColor: colors.divider }]} onPress={() => router.push({ pathname: '/transaction-detail', params: { id: tx.id } })}>
                <View style={[styles.txIconWrap, isCredit ? { backgroundColor: colors.successBg } : { backgroundColor: colors.background }]}>
                  {tx.recipientAvatar ? (
                    <Image source={{ uri: tx.recipientAvatar }} style={styles.txAvatar} contentFit="cover" />
                  ) : (
                    <MaterialIcons name={tx.icon as any} size={18} color={isCredit ? colors.success : colors.primary} />
                  )}
                </View>
                <View style={styles.txMeta}>
                  <Text style={[styles.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>{tx.title}</Text>
                  <Text style={[styles.txSubtitle, { color: colors.textMuted }]} numberOfLines={1}>{tx.subtitle}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, isCredit ? { color: colors.success } : { color: colors.textPrimary }]}>
                    {isCredit ? '+' : ''}{formatCurrency(tx.amount, sym)}
                  </Text>
                  <Text style={[styles.txTime, { color: colors.textMuted }]}>{formatDate(tx.timestamp)}</Text>
                  {tx.status === 'pending' && (
                    <View style={[styles.txPendingBadge, { backgroundColor: colors.warningBg }]}>
                      <Text style={[styles.txPendingText, { color: colors.warning }]}>Pending</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── AI Bot FAB ── */}
      <Pressable
        style={[styles.aiFab, { bottom: insets.bottom + 80, backgroundColor: colors.primary }]}
        onPress={() => router.push('/ai-chat')}
        accessibilityLabel="AI Banking Assistant"
      >
        <MaterialIcons name="smart-toy" size={24} color={colors.textOnDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  logoImg: { width: 160, height: 46 },
  topActions: { flexDirection: 'row', gap: Spacing.sm },
  topIconBtn: { width: 40, height: 40, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  notifBadge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: Radius.circle, backgroundColor: '#E74C3C', alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: FontWeight.bold },
  scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
  welcomeCard: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.sm },
  avatarImg: { width: 48, height: 48, borderRadius: Radius.circle, marginRight: Spacing.md },
  welcomeText: { flex: 1 },
  welcomeLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.regular },
  welcomeName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 6, borderWidth: 1 },
  premiumText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  balanceCard: { borderRadius: Radius.xxl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.md, position: 'relative', overflow: 'hidden' },
  currencyBar: { marginBottom: Spacing.md },
  currencyPill: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.pill, marginRight: Spacing.sm, borderWidth: 1 },
  currencyPillText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  hideBtn: { position: 'absolute', top: Spacing.lg, right: Spacing.lg, padding: 4 },
  rateLabel: { fontSize: FontSize.sm, marginBottom: Spacing.xs },
  balanceAmount: { fontSize: 38, fontWeight: FontWeight.extrabold, letterSpacing: -1, marginBottom: Spacing.sm },
  changePill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 5, marginBottom: Spacing.lg },
  changeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  changeLabel: { fontSize: FontSize.sm },
  portfolioRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: Spacing.md },
  portfolioItem: { flex: 1, alignItems: 'center' },
  portfolioItemLabel: { fontSize: FontSize.xs, marginBottom: 2 },
  portfolioItemValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  portfolioSep: { width: 1, marginVertical: 2 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: Radius.xl, paddingVertical: Spacing.base, paddingHorizontal: Spacing.sm, marginBottom: Spacing.md, ...Shadow.sm },
  quickAction: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  quickActionPressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  quickActionIcon: { width: 48, height: 48, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, textAlign: 'center' },
  insightBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1 },
  insightText: { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  sectionAction: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  txList: { borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.sm },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1 },
  txIconWrap: { width: 42, height: 42, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  txAvatar: { width: 42, height: 42, borderRadius: Radius.circle },
  txMeta: { flex: 1, marginRight: Spacing.sm },
  txTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  txSubtitle: { fontSize: FontSize.xs, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  txTime: { fontSize: FontSize.xs, marginTop: 2 },
  txPendingBadge: { borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  txPendingText: { fontSize: 9, fontWeight: FontWeight.bold },
  dueSoonWrap: { marginBottom: Spacing.base },
  dueSoonCard: {
    width: 110, borderRadius: Radius.xl, padding: Spacing.md, marginRight: Spacing.sm,
    borderWidth: 1.5, alignItems: 'center',
  },
  dueSoonIcon: { width: 38, height: 38, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  dueSoonName: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textAlign: 'center', marginBottom: 2 },
  dueSoonAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 4 },
  dueSoonBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: Radius.pill, paddingHorizontal: 5, paddingVertical: 2 },
  dueSoonDays: { fontSize: 9, fontWeight: FontWeight.bold },
  aiFab: { position: 'absolute', right: Spacing.base, width: 52, height: 52, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', ...Shadow.lg },
});
