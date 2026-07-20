import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, FlatList, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

const { width: W } = Dimensions.get('window');

const MERCHANT_OFFERS = [
  { id: '1', name: 'Whole Foods', category: 'Groceries', multiplier: '3x', cashback: 7.5, icon: 'local-grocery-store', color: '#27AE60', expires: 'Jul 31' },
  { id: '2', name: 'Delta Airlines', category: 'Travel', multiplier: '5x', cashback: 12.5, icon: 'flight', color: '#1D4ED8', expires: 'Aug 15' },
  { id: '3', name: 'Uber Eats', category: 'Food & Drink', multiplier: '2x', cashback: 5.0, icon: 'delivery-dining', color: '#000000', expires: 'Jul 28' },
  { id: '4', name: 'Amazon', category: 'Shopping', multiplier: '2x', cashback: 5.0, icon: 'shopping-bag', color: '#FF9900', expires: 'Aug 1' },
  { id: '5', name: 'Marriott Hotels', category: 'Travel', multiplier: '4x', cashback: 10.0, icon: 'hotel', color: '#B8860B', expires: 'Aug 31' },
  { id: '6', name: 'Apple Store', category: 'Electronics', multiplier: '3x', cashback: 7.5, icon: 'phone-iphone', color: '#555555', expires: 'Jul 30' },
];

const REWARD_TIERS = [
  { name: 'Bronze', min: 0, max: 5000, icon: 'emoji-events', color: '#CD7F32' },
  { name: 'Silver', min: 5000, max: 15000, icon: 'workspace-premium', color: '#C0C0C0' },
  { name: 'Gold', min: 15000, max: 50000, icon: 'star', color: '#FFD700' },
  { name: 'Platinum', min: 50000, max: Infinity, icon: 'diamond', color: '#A8C0D6' },
];

const REWARD_HISTORY = [
  { id: 'r1', title: 'Whole Foods Purchase', date: 'Jul 12', points: 234, cashback: 5.85, icon: 'local-grocery-store', color: '#27AE60' },
  { id: 'r2', title: 'Netflix (2x Weekend)', date: 'Jul 11', points: 38, cashback: 0.95, icon: 'tv', color: '#E50914' },
  { id: 'r3', title: 'Amazon Purchase', date: 'Jul 10', points: 135, cashback: 3.37, icon: 'shopping-bag', color: '#FF9900' },
  { id: 'r4', title: 'Cashback Redemption', date: 'Jul 9', points: -2500, cashback: -25.00, icon: 'account-balance-wallet', color: '#27AE60', isRedemption: true },
  { id: 'r5', title: 'Dining Bonus Weekend', date: 'Jul 7', points: 420, cashback: 10.50, icon: 'restaurant', color: '#EC4899' },
  { id: 'r6', title: 'Stripe Subscription', date: 'Jul 5', points: 19, cashback: 0.48, icon: 'subscriptions', color: '#6772E5' },
];

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const { activeWallet } = useWallet();

  const [activeTab, setActiveTab] = useState<'overview' | 'offers' | 'history'>('overview');
  const [redeemLoading, setRedeemLoading] = useState(false);

  const totalPoints = 18_420;
  const totalCashback = 184.20;
  const pointsToExpire = 3200;
  const expireDate = 'Aug 31, 2026';
  const cashbackRate = 2.5;

  const currentTier = useMemo(() => {
    return REWARD_TIERS.find(t => totalPoints >= t.min && totalPoints < t.max) ?? REWARD_TIERS[2];
  }, []);

  const nextTier = useMemo(() => {
    const idx = REWARD_TIERS.indexOf(currentTier);
    return idx < REWARD_TIERS.length - 1 ? REWARD_TIERS[idx + 1] : null;
  }, [currentTier]);

  const tierProgress = nextTier
    ? ((totalPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  const handleRedeem = async (amount: number, points: number) => {
    showAlert(
      `Redeem ${points.toLocaleString()} Points`,
      `Convert ${points.toLocaleString()} points to $${amount.toFixed(2)} in your wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          style: 'default',
          onPress: async () => {
            setRedeemLoading(true);
            await new Promise(r => setTimeout(r, 1200));
            setRedeemLoading(false);
            showAlert('Redeemed!', `$${amount.toFixed(2)} has been added to your USD wallet.`);
          },
        },
      ]
    );
  };

  const styles = makeStyles(colors);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Rewards & Cashback</Text>
        <Pressable style={styles.infoBtn} onPress={() => showAlert('Rewards Program', 'Earn points on every purchase. 100 points = $1. Tier upgrades unlock higher cashback rates.')} hitSlop={8}>
          <MaterialIcons name="info-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['overview', 'offers', 'history'] as const).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <>
            {/* Hero Stats */}
            <View style={styles.heroCard}>
              <View style={styles.heroGlow} />
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>Total Points</Text>
                  <Text style={styles.heroPoints}>{totalPoints.toLocaleString()}</Text>
                  <Text style={styles.heroSubLabel}>pts</Text>
                </View>
                <View style={[styles.tierBadge, { backgroundColor: currentTier.color + '33', borderColor: currentTier.color + '66' }]}>
                  <MaterialIcons name={currentTier.icon as any} size={18} color={currentTier.color} />
                  <Text style={[styles.tierBadgeText, { color: currentTier.color }]}>{currentTier.name}</Text>
                </View>
              </View>

              <View style={styles.heroStats}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>${totalCashback.toFixed(2)}</Text>
                  <Text style={styles.heroStatLabel}>Total Cashback</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>{cashbackRate}%</Text>
                  <Text style={styles.heroStatLabel}>Base Rate</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>{(totalPoints / 100).toFixed(0)}</Text>
                  <Text style={styles.heroStatLabel}>Cash Value $</Text>
                </View>
              </View>
            </View>

            {/* Expiry Warning */}
            <View style={styles.expiryCard}>
              <MaterialIcons name="timer" size={18} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={styles.expiryTitle}>{pointsToExpire.toLocaleString()} points expiring</Text>
                <Text style={styles.expirySub}>Expires {expireDate} · worth ${(pointsToExpire / 100).toFixed(2)}</Text>
              </View>
              <Pressable
                style={styles.useNowBtn}
                onPress={() => handleRedeem(pointsToExpire / 100, pointsToExpire)}
              >
                <Text style={styles.useNowText}>Use Now</Text>
              </Pressable>
            </View>

            {/* Tier Progress */}
            {nextTier && (
              <View style={styles.tierCard}>
                <View style={styles.tierRow}>
                  <View>
                    <Text style={styles.tierLabel}>Current: {currentTier.name}</Text>
                    <Text style={styles.tierPoints}>{totalPoints.toLocaleString()} pts</Text>
                  </View>
                  <View style={styles.tierArrow}>
                    <MaterialIcons name="arrow-forward" size={16} color={colors.textMuted} />
                  </View>
                  <View>
                    <Text style={[styles.tierLabel, { color: nextTier.color }]}>Next: {nextTier.name}</Text>
                    <Text style={styles.tierPoints}>{nextTier.min.toLocaleString()} pts</Text>
                  </View>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
                  <View style={[styles.progressFill, { width: `${Math.min(tierProgress, 100)}%` as any, backgroundColor: nextTier.color }]} />
                </View>
                <Text style={styles.tierGap}>
                  {(nextTier.min - totalPoints).toLocaleString()} points to {nextTier.name}
                </Text>
              </View>
            )}

            {/* Redeem Options */}
            <Text style={styles.sectionTitle}>Redeem Points</Text>
            {[
              { points: 1000, value: 10, label: 'Redeem to Wallet', icon: 'account-balance-wallet', color: colors.success },
              { points: 2500, value: 25, label: 'Gift Card Credit', icon: 'card-giftcard', color: '#EC4899' },
              { points: 5000, value: 55, label: 'Premium Upgrade', icon: 'workspace-premium', color: colors.primary },
            ].map(option => (
              <Pressable
                key={option.points}
                style={styles.redeemRow}
                onPress={() => handleRedeem(option.value, option.points)}
              >
                <View style={[styles.redeemIcon, { backgroundColor: option.color + '22' }]}>
                  <MaterialIcons name={option.icon as any} size={22} color={option.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.redeemLabel}>{option.label}</Text>
                  <Text style={styles.redeemSub}>{option.points.toLocaleString()} pts → ${option.value}</Text>
                </View>
                <View style={[styles.redeemBtn, { backgroundColor: option.color }]}>
                  <Text style={styles.redeemBtnText}>Redeem</Text>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {/* ── Offers ── */}
        {activeTab === 'offers' && (
          <>
            <Text style={styles.offersHint}>Tap a merchant to activate the offer on your next purchase</Text>
            <View style={styles.offersGrid}>
              {MERCHANT_OFFERS.map(offer => (
                <Pressable
                  key={offer.id}
                  style={styles.offerCard}
                  onPress={() => showAlert(
                    `${offer.multiplier} Points at ${offer.name}`,
                    `Earn ${offer.multiplier} points on your next purchase at ${offer.name}. Offer expires ${offer.expires}.`,
                    [{ text: 'Activate', style: 'default' }, { text: 'Cancel', style: 'cancel' }]
                  )}
                >
                  <View style={[styles.offerMultiplier, { backgroundColor: offer.color }]}>
                    <Text style={styles.offerMultiplierText}>{offer.multiplier}</Text>
                  </View>
                  <View style={[styles.offerIcon, { backgroundColor: offer.color + '22' }]}>
                    <MaterialIcons name={offer.icon as any} size={24} color={offer.color} />
                  </View>
                  <Text style={styles.offerName} numberOfLines={1}>{offer.name}</Text>
                  <Text style={styles.offerCategory}>{offer.category}</Text>
                  <View style={styles.offerFooter}>
                    <MaterialIcons name="stars" size={12} color={colors.primary} />
                    <Text style={styles.offerCashback}>{offer.cashback}% back</Text>
                  </View>
                  <Text style={styles.offerExpires}>Exp. {offer.expires}</Text>
                </Pressable>
              ))}
            </View>

            {/* Featured / Large Offer */}
            <View style={[styles.featuredOffer, { backgroundColor: colors.primary }]}>
              <View style={styles.featuredLeft}>
                <Text style={styles.featuredBadge}>LIMITED TIME</Text>
                <Text style={styles.featuredTitle}>10x Points Weekend</Text>
                <Text style={styles.featuredSub}>Earn 10x points on all dining & entertainment this weekend only</Text>
                <Pressable
                  style={styles.featuredBtn}
                  onPress={() => showAlert('Activated!', '10x Weekend offer is now active on your card.')}
                >
                  <Text style={styles.featuredBtnText}>Activate Offer</Text>
                </Pressable>
              </View>
              <MaterialIcons name="celebration" size={60} color="rgba(255,255,255,0.2)" />
            </View>
          </>
        )}

        {/* ── History ── */}
        {activeTab === 'history' && (
          <>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTotal}>Total Earned: {totalPoints.toLocaleString()} pts</Text>
              <Text style={styles.historyTotalCash}>${totalCashback.toFixed(2)} cashback</Text>
            </View>

            {REWARD_HISTORY.map(item => {
              const isPositive = item.points > 0;
              return (
                <View key={item.id} style={styles.historyRow}>
                  <View style={[styles.historyIcon, { backgroundColor: item.color + '22' }]}>
                    <MaterialIcons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle}>{item.title}</Text>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyPoints, { color: isPositive ? colors.success : colors.error }]}>
                      {isPositive ? '+' : ''}{item.points.toLocaleString()} pts
                    </Text>
                    <Text style={[styles.historyCashback, { color: isPositive ? colors.success : colors.error }]}>
                      {isPositive ? '+' : ''}${Math.abs(item.cashback).toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Sticky Redeem CTA (overview) */}
      {activeTab === 'overview' && (
        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <Pressable
            style={[styles.redeemAllBtn, redeemLoading && { opacity: 0.7 }]}
            onPress={() => handleRedeem(totalPoints / 100, totalPoints)}
            disabled={redeemLoading}
          >
            <MaterialIcons name="account-balance-wallet" size={20} color={colors.textOnDark} />
            <Text style={styles.redeemAllText}>
              Redeem All {totalPoints.toLocaleString()} pts → ${(totalPoints / 100).toFixed(2)}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof import('../contexts/ThemeContext').useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
    },
    infoBtn: {
      width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
    },
    headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: colors.textPrimary },
    tabBar: {
      flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: Spacing.base,
      borderRadius: Radius.xl, padding: 4, marginBottom: Spacing.base, ...Shadow.sm,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: Radius.lg },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    tabTextActive: { color: colors.textOnDark },
    content: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
    heroCard: {
      backgroundColor: colors.primary, borderRadius: Radius.xxl, padding: Spacing.lg,
      marginBottom: Spacing.md, overflow: 'hidden', ...Shadow.lg,
    },
    heroGlow: {
      position: 'absolute', top: -50, right: -50, width: 200, height: 200,
      borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)',
    },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
    heroLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
    heroPoints: { fontSize: 44, fontWeight: FontWeight.extrabold, color: '#FFFFFF', lineHeight: 48 },
    heroSubLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)' },
    tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 7, borderWidth: 1 },
    tierBadgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
    heroStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: Spacing.md },
    heroStatItem: { flex: 1, alignItems: 'center' },
    heroStatValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
    heroStatLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
    heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 2 },
    expiryCard: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.warningBg, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.warning + '44',
    },
    expiryTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.warning },
    expirySub: { fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 },
    useNowBtn: { backgroundColor: colors.warning, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 7 },
    useNowText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: colors.textOnDark },
    tierCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    tierRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
    tierLabel: { fontSize: FontSize.xs, color: colors.textMuted, fontWeight: FontWeight.semibold },
    tierPoints: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary },
    tierArrow: { padding: Spacing.sm },
    progressTrack: { height: 8, borderRadius: Radius.pill, overflow: 'hidden', marginBottom: Spacing.sm },
    progressFill: { height: '100%', borderRadius: Radius.pill },
    tierGap: { fontSize: FontSize.xs, color: colors.textMuted, textAlign: 'center' },
    sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
    redeemRow: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
    },
    redeemIcon: { width: 48, height: 48, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    redeemLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    redeemSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    redeemBtn: { borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 8 },
    redeemBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textOnDark },
    offersHint: { fontSize: FontSize.sm, color: colors.textMuted, textAlign: 'center', marginBottom: Spacing.base },
    offersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
    offerCard: {
      width: (W - Spacing.base * 2 - Spacing.sm) / 2,
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base, ...Shadow.sm,
      position: 'relative', overflow: 'hidden',
    },
    offerMultiplier: {
      position: 'absolute', top: Spacing.sm, right: Spacing.sm,
      borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 3,
    },
    offerMultiplierText: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
    offerIcon: { width: 52, height: 52, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
    offerName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: 2 },
    offerCategory: { fontSize: FontSize.xs, color: colors.textMuted, marginBottom: Spacing.sm },
    offerFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
    offerCashback: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: colors.primary },
    offerExpires: { fontSize: 10, color: colors.textMuted },
    featuredOffer: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      borderRadius: Radius.xxl, padding: Spacing.lg, marginBottom: Spacing.base, overflow: 'hidden', ...Shadow.md,
    },
    featuredLeft: { flex: 1 },
    featuredBadge: {
      fontSize: 10, fontWeight: FontWeight.extrabold, color: 'rgba(255,255,255,0.8)',
      backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.pill,
      paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: Spacing.sm,
      letterSpacing: 1,
    },
    featuredTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: '#FFFFFF', marginBottom: Spacing.xs },
    featuredSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', lineHeight: 18, marginBottom: Spacing.md },
    featuredBtn: { backgroundColor: '#FFFFFF', borderRadius: Radius.pill, paddingHorizontal: Spacing.base, paddingVertical: 9, alignSelf: 'flex-start' },
    featuredBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.primary },
    historyHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    historyTotal: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    historyTotalCash: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.success },
    historyRow: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
    },
    historyIcon: { width: 44, height: 44, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    historyInfo: { flex: 1 },
    historyTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    historyDate: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    historyRight: { alignItems: 'flex-end' },
    historyPoints: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
    historyCashback: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, marginTop: 2 },
    stickyFooter: {
      paddingHorizontal: Spacing.base, paddingTop: Spacing.sm,
      borderTopWidth: 1, borderTopColor: colors.divider,
      backgroundColor: colors.background,
    },
    redeemAllBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      backgroundColor: colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg, ...Shadow.md,
    },
    redeemAllText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textOnDark },
  });
}
