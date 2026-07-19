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
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../../constants/theme';
import { formatCurrency, formatDate, formatTime } from '../../services/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Quick Action Button ─────────────────────────────────────────────
interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
  highlight?: boolean;
}
const QuickAction = memo(({ icon, label, onPress, highlight }: QuickActionProps) => (
  <Pressable
    style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}
    onPress={onPress}
    accessibilityLabel={label}
    hitSlop={8}
  >
    <View style={[styles.quickActionIcon, highlight && styles.quickActionIconHighlight]}>
      <MaterialIcons name={icon as any} size={22} color={highlight ? Colors.textOnDark : Colors.primary} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </Pressable>
));

// ─── Transaction Row ─────────────────────────────────────────────────
interface TxRowProps {
  type: string;
  title: string;
  subtitle: string;
  amount: number;
  currency: string;
  timestamp: string;
  icon: string;
  status: string;
  recipientAvatar?: string;
}
const TxRow = memo(({ type, title, subtitle, amount, currency, timestamp, icon, status, recipientAvatar }: TxRowProps) => {
  const isCredit = amount > 0;
  const walletSymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconWrap, isCredit ? styles.txIconCredit : styles.txIconDebit]}>
        {recipientAvatar ? (
          <Image source={{ uri: recipientAvatar }} style={styles.txAvatar} contentFit="cover" />
        ) : (
          <MaterialIcons name={icon as any} size={18} color={isCredit ? Colors.success : Colors.primary} />
        )}
      </View>
      <View style={styles.txMeta}>
        <Text style={styles.txTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.txSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, isCredit ? styles.txAmountCredit : styles.txAmountDebit]}>
          {isCredit ? '+' : ''}{formatCurrency(amount, walletSymbol)}
        </Text>
        <Text style={styles.txTime}>{formatDate(timestamp)}</Text>
        {status === 'pending' && (
          <View style={styles.txPendingBadge}>
            <Text style={styles.txPendingText}>Pending</Text>
          </View>
        )}
      </View>
    </View>
  );
});

// ─── Home Screen ─────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const {
    user, wallets, activeWallet, activeWalletIndex, setActiveWalletIndex,
    transactions, notifications, unreadCount, balanceHidden, toggleBalanceHidden,
    totalCryptoValue, totalInvestmentValue,
  } = useWallet();

  const router = useRouter();
  const [spendingInsightVisible] = useState(true);

  const handleQuickAction = useCallback((action: string) => {
    if (action === 'Send') { router.push('/send-money'); return; }
    if (action === 'Notifications') { router.push('/notifications'); return; }
    if (action === 'Scan QR') { router.push('/scan-qr'); return; }
    if (action === 'Receive') { router.push('/receive-qr'); return; }
    if (action === 'Pay Bills') { router.push('/pay-bills'); return; }
    showAlert(action, `${action} — feature available in full build.`, [
      { text: 'OK', style: 'default' },
    ]);
  }, [showAlert, router]);

  const balanceDisplay = balanceHidden
    ? '••••••'
    : formatCurrency(activeWallet.amount, activeWallet.symbol);

  const changePositive = activeWallet.weeklyChange >= 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <Image
          source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/Q4JchbpdQ8eur9GkT4Bqa9/Logo_3600%C3%971100_(3800_x_1400_px)_(6500_x_1400_px)_(7800_x_1800_px)_-_1.svg' }}
          style={styles.logoImg}
          contentFit="contain"
        />
        <View style={styles.topActions}>
          <Pressable
            style={({ pressed }) => [styles.topIconBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/ai-chat')}
            accessibilityLabel="AI Assistant"
            hitSlop={8}
          >
            <MaterialIcons name="headset-mic" size={22} color={Colors.primary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.topIconBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/notifications')}
            accessibilityLabel="Notifications"
            hitSlop={8}
          >
            <MaterialIcons name="notifications" size={22} color={Colors.primary} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Welcome Card ── */}
        <View style={styles.welcomeCard}>
          <Image
            source={{ uri: user.avatar }}
            style={styles.avatarImg}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeLabel}>Welcome back,</Text>
            <Text style={styles.welcomeName}>{user.firstName}</Text>
          </View>
          <View style={styles.premiumBadge}>
            <MaterialIcons name="workspace-premium" size={13} color={Colors.primary} />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        </View>

        {/* ── Balance Card ── */}
        <View style={styles.balanceCard}>
          {/* Currency Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyBar}>
            {wallets.map((w, i) => (
              <Pressable
                key={w.currency}
                style={[styles.currencyPill, i === activeWalletIndex && styles.currencyPillActive]}
                onPress={() => setActiveWalletIndex(i)}
              >
                <Text style={[styles.currencyPillText, i === activeWalletIndex && styles.currencyPillTextActive]}>
                  {w.currency}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.hideBtn} onPress={toggleBalanceHidden} hitSlop={12}>
            <MaterialIcons
              name={balanceHidden ? 'visibility' : 'visibility-off'}
              size={20}
              color={Colors.textMuted}
            />
          </Pressable>

          <Text style={styles.rateLabel}>
            1 {activeWallet.currency} = {activeWallet.exchangeRate.toFixed(2)} {activeWallet.currency}
          </Text>

          <Text style={styles.balanceAmount}>{balanceDisplay}</Text>

          <View style={[styles.changePill, changePositive ? styles.changePillUp : styles.changePillDown]}>
            <MaterialIcons
              name={changePositive ? 'trending-up' : 'trending-down'}
              size={14}
              color={changePositive ? Colors.success : Colors.error}
            />
            <Text style={[styles.changeText, { color: changePositive ? Colors.success : Colors.error }]}>
              {changePositive ? '+' : ''}{formatCurrency(activeWallet.weeklyChange, activeWallet.symbol)}
            </Text>
            <Text style={styles.changeLabel}>this week</Text>
          </View>

          {/* Portfolio Insight */}
          <View style={styles.portfolioRow}>
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioItemLabel}>Crypto</Text>
              <Text style={styles.portfolioItemValue}>${totalCryptoValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
            </View>
            <View style={styles.portfolioSep} />
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioItemLabel}>Investments</Text>
              <Text style={styles.portfolioItemValue}>${totalInvestmentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
            </View>
            <View style={styles.portfolioSep} />
            <View style={styles.portfolioItem}>
              <Text style={styles.portfolioItemLabel}>Savings</Text>
              <Text style={styles.portfolioItemValue}>$15,740</Text>
            </View>
          </View>
        </View>

        {/* ── Primary Quick Actions ── */}
        <View style={styles.actionsRow}>
          {[
            { icon: 'send', label: 'Send' },
            { icon: 'download', label: 'Receive' },
            { icon: 'qr-code-scanner', label: 'Scan QR' },
            { icon: 'receipt-long', label: 'Pay Bills' },
          ].map(a => (
            <QuickAction key={a.label} icon={a.icon} label={a.label} onPress={() => handleQuickAction(a.label)} />
          ))}
        </View>

        {/* ── Secondary Actions ── */}
        <View style={styles.actionsRow}>
          {[
            { icon: 'credit-card', label: 'Cards' },
            { icon: 'trending-up', label: 'Invest' },
            { icon: 'currency-bitcoin', label: 'Crypto' },
            { icon: 'history', label: 'History' },
          ].map(a => (
            <QuickAction key={a.label} icon={a.icon} label={a.label} onPress={() => handleQuickAction(a.label)} />
          ))}
        </View>

        {/* ── Spending Insight Banner ── */}
        {spendingInsightVisible && (
          <Pressable
            style={styles.insightBanner}
            onPress={() => router.push('/analytics')}
          >
            <MaterialIcons name="smart-toy" size={20} color={Colors.primary} />
            <Text style={styles.insightText}>
              Your spending is <Text style={{ fontWeight: FontWeight.bold }}>12% below average</Text> this month
            </Text>
            <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
          </Pressable>
        )}

        {/* ── Recent Transactions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Pressable onPress={() => handleQuickAction('All Transactions')} hitSlop={12}>
            <Text style={styles.sectionAction}>See All</Text>
          </Pressable>
        </View>

        <View style={styles.txList}>
          {transactions.slice(0, 6).map(tx => (
            <TxRow key={tx.id} {...tx} />
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── AI Bot FAB ── */}
      <Pressable
        style={[styles.aiFab, { bottom: insets.bottom + 80 }]}
        onPress={() => router.push('/ai-chat')}
        accessibilityLabel="AI Banking Assistant"
      >
        <MaterialIcons name="smart-toy" size={24} color={Colors.textOnDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  logoImg: {
    width: 120,
    height: 36,
  },
  topActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.circle,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: Radius.circle,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: Colors.textOnDark,
    fontSize: 9,
    fontWeight: FontWeight.bold,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: Radius.circle,
    marginRight: Spacing.md,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.regular,
  },
  welcomeName: {
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  premiumText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.md,
    position: 'relative',
    overflow: 'hidden',
  },
  currencyBar: {
    marginBottom: Spacing.md,
  },
  currencyPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.background,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  currencyPillText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  currencyPillTextActive: {
    color: Colors.textOnDark,
  },
  hideBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    padding: 4,
  },
  rateLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -1,
    marginBottom: Spacing.sm,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    marginBottom: Spacing.lg,
  },
  changePillUp: {
    backgroundColor: Colors.successBg,
  },
  changePillDown: {
    backgroundColor: Colors.errorBg,
  },
  changeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  changeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  portfolioRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingTop: Spacing.md,
    gap: 0,
  },
  portfolioItem: {
    flex: 1,
    alignItems: 'center',
  },
  portfolioItemLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  portfolioItemValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  portfolioSep: {
    width: 1,
    backgroundColor: Colors.divider,
    marginVertical: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quickActionPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.circle,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconHighlight: {
    backgroundColor: Colors.primary,
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.cardMint,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  insightText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionAction: {
    fontSize: FontSize.sm,
    color: Colors.mint,
    fontWeight: FontWeight.semibold,
  },
  txList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  txIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  txIconCredit: {
    backgroundColor: Colors.successBg,
  },
  txIconDebit: {
    backgroundColor: Colors.background,
  },
  txAvatar: {
    width: 42,
    height: 42,
    borderRadius: Radius.circle,
  },
  txMeta: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  txTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  txSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  txAmountCredit: {
    color: Colors.success,
  },
  txAmountDebit: {
    color: Colors.textPrimary,
  },
  txTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txPendingBadge: {
    backgroundColor: Colors.warningBg,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  txPendingText: {
    fontSize: 9,
    color: Colors.warning,
    fontWeight: FontWeight.bold,
  },
  aiFab: {
    position: 'absolute',
    right: Spacing.base,
    width: 52,
    height: 52,
    borderRadius: Radius.circle,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
});
