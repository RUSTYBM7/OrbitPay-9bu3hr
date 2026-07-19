import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../../hooks/useWallet';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../../constants/theme';
import { Card } from '../../services/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.base * 2;

function CardVisual({ card, isSelected }: { card: Card; isSelected: boolean }) {
  return (
    <View style={[styles.cardVisual, { backgroundColor: card.color }, isSelected && styles.cardVisualSelected]}>
      {/* Card Shine */}
      <View style={styles.cardShine} />

      <View style={styles.cardTop}>
        <Text style={styles.cardTierLabel}>{card.tier.toUpperCase()} · ORBITPAY</Text>
        <MaterialIcons
          name={card.network === 'visa' ? 'credit-card' : 'credit-card'}
          size={28}
          color="rgba(255,255,255,0.9)"
        />
      </View>

      <View style={styles.cardChipRow}>
        <View style={styles.cardChip}>
          <View style={styles.cardChipInner} />
        </View>
        <Text style={styles.cardTypeLabel}>{card.type.toUpperCase()}</Text>
      </View>

      <Text style={styles.cardNumber}>
        •••• •••• •••• {card.last4}
      </Text>

      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.cardLabel}>Card Holder</Text>
          <Text style={styles.cardValue}>{card.holderName}</Text>
        </View>
        <View>
          <Text style={styles.cardLabel}>Expires</Text>
          <Text style={styles.cardValue}>{card.expiry}</Text>
        </View>
        <View>
          <Text style={styles.cardLabel}>Network</Text>
          <Text style={styles.cardValue}>{card.network.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { cards } = useWallet();
  const [selectedCard, setSelectedCard] = useState(0);

  const card = cards[selectedCard];

  const spentPct = Math.min((card.spentThisMonth / card.limitMonthly) * 100, 100);

  const CARD_ACTIONS = [
    { icon: 'lock', label: card.status === 'frozen' ? 'Unfreeze' : 'Freeze', color: Colors.warning },
    { icon: 'visibility', label: 'Show PIN', color: Colors.primary },
    { icon: 'credit-card-off', label: 'Block', color: Colors.error },
    { icon: 'swap-horiz', label: 'Limit', color: Colors.info },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cards</Text>
        <Pressable
          style={styles.headerBtn}
          onPress={() => showAlert('Add Card', 'Apply for a new physical or virtual OrbitPay card.')}
          hitSlop={8}
        >
          <MaterialIcons name="add" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Card Selector */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
            setSelectedCard(Math.min(idx, cards.length - 1));
          }}
          style={styles.cardScroller}
        >
          {cards.map((c, i) => (
            <View key={c.id} style={{ width: CARD_WIDTH, paddingRight: i < cards.length - 1 ? 0 : 0 }}>
              <CardVisual card={c} isSelected={i === selectedCard} />
            </View>
          ))}
        </ScrollView>

        {/* Page Dots */}
        <View style={styles.dotRow}>
          {cards.map((_, i) => (
            <Pressable key={i} onPress={() => setSelectedCard(i)}>
              <View style={[styles.dot, i === selectedCard && styles.dotActive]} />
            </Pressable>
          ))}
        </View>

        {/* Status Banner */}
        <View style={[styles.statusBanner, card.status === 'active' ? styles.statusActive : styles.statusFrozen]}>
          <MaterialIcons
            name={card.status === 'active' ? 'check-circle' : 'pause-circle-filled'}
            size={18}
            color={card.status === 'active' ? Colors.success : Colors.warning}
          />
          <Text style={[styles.statusText, { color: card.status === 'active' ? Colors.success : Colors.warning }]}>
            Card is {card.status === 'active' ? 'Active' : 'Frozen'}
          </Text>
          {card.cashbackPercent > 0 && (
            <View style={styles.cashbackBadge}>
              <MaterialIcons name="stars" size={12} color={Colors.primary} />
              <Text style={styles.cashbackText}>{card.cashbackPercent}% cashback</Text>
            </View>
          )}
        </View>

        {/* Spend Limit */}
        <View style={styles.spendCard}>
          <View style={styles.spendHeader}>
            <Text style={styles.spendLabel}>Monthly Spend</Text>
            <Text style={styles.spendAmount}>
              ${card.spentThisMonth.toLocaleString()} / ${card.limitMonthly.toLocaleString()}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${spentPct}%` as any, backgroundColor: spentPct > 80 ? Colors.error : Colors.primary }]} />
          </View>
          <Text style={styles.spendRemaining}>
            ${(card.limitMonthly - card.spentThisMonth).toLocaleString()} remaining this month
          </Text>
        </View>

        {/* Card Actions */}
        <View style={styles.actionsGrid}>
          {CARD_ACTIONS.map(action => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [styles.actionItem, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
              onPress={() => showAlert(action.label, `${action.label} card ending in ${card.last4}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', style: 'default', onPress: () => showAlert('Done', `${action.label} action applied.`) },
              ])}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
                <MaterialIcons name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Transactions on Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Card Transactions</Text>
          <Pressable onPress={() => showAlert('All Card Transactions', 'View full card statement.')} hitSlop={8}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        {[
          { title: 'Whole Foods', amount: -94.37, date: 'Today' },
          { title: 'Netflix', amount: -18.99, date: 'Yesterday' },
          { title: 'Amazon', amount: -67.50, date: 'Jul 10' },
          { title: 'Cashback Reward', amount: +2.34, date: 'Jul 9' },
        ].map((tx, i) => (
          <View key={i} style={styles.txRow}>
            <View style={[styles.txIcon, tx.amount > 0 ? styles.txIconCredit : styles.txIconDebit]}>
              <MaterialIcons
                name={tx.amount > 0 ? 'stars' : 'shopping-cart'}
                size={18}
                color={tx.amount > 0 ? Colors.success : Colors.primary}
              />
            </View>
            <Text style={styles.txTitle}>{tx.title}</Text>
            <View style={styles.txRight}>
              <Text style={[styles.txAmount, { color: tx.amount > 0 ? Colors.success : Colors.textPrimary }]}>
                {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
              </Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>
          </View>
        ))}

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
  content: { paddingHorizontal: Spacing.base },
  cardScroller: { marginBottom: Spacing.md },
  cardVisual: {
    width: CARD_WIDTH, height: 200, borderRadius: Radius.xxl,
    padding: Spacing.lg, justifyContent: 'space-between', overflow: 'hidden', ...Shadow.lg,
  },
  cardVisualSelected: { transform: [{ scale: 1.01 }] },
  cardShine: {
    position: 'absolute', top: -40, right: -40, width: 180, height: 180,
    borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.07)',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTierLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeight.bold, letterSpacing: 1 },
  cardChipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardChip: {
    width: 36, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,215,0,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardChipInner: {
    width: 28, height: 20, borderRadius: 3,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)',
  },
  cardTypeLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', letterSpacing: 2 },
  cardNumber: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.95)', letterSpacing: 3, fontWeight: FontWeight.medium },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
  cardValue: { fontSize: FontSize.xs, color: Colors.textOnDark, fontWeight: FontWeight.bold, marginTop: 2 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs, marginBottom: Spacing.base },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { width: 20, backgroundColor: Colors.primary },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1,
  },
  statusActive: { backgroundColor: Colors.successBg, borderColor: Colors.success + '44' },
  statusFrozen: { backgroundColor: Colors.warningBg, borderColor: Colors.warning + '44' },
  statusText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  cashbackBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.background, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 4,
  },
  cashbackText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.bold },
  spendCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.sm },
  spendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  spendLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  spendAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  progressTrack: { height: 8, backgroundColor: Colors.background, borderRadius: Radius.pill, marginBottom: Spacing.sm, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.pill },
  spendRemaining: { fontSize: FontSize.xs, color: Colors.textMuted },
  actionsGrid: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.md, marginBottom: Spacing.base, ...Shadow.sm,
  },
  actionItem: { flex: 1, alignItems: 'center', gap: Spacing.xs, padding: Spacing.xs },
  actionIcon: { width: 48, height: 48, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium, textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  seeAll: { fontSize: FontSize.sm, color: Colors.mint, fontWeight: FontWeight.semibold },
  txRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  txIcon: {
    width: 40, height: 40, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  txIconCredit: { backgroundColor: Colors.successBg },
  txIconDebit: { backgroundColor: Colors.background },
  txTitle: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  txDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
});
