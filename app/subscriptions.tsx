import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

const { width: W } = Dimensions.get('window');

interface Subscription {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'annual' | 'weekly';
  nextBilling: string;
  icon: string;
  color: string;
  status: 'active' | 'paused' | 'cancelled';
  lastCharged: string;
}

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', name: 'Netflix', category: 'Entertainment', amount: 18.99, currency: 'USD', billingCycle: 'monthly', nextBilling: '2026-08-11', icon: 'tv', color: '#E50914', status: 'active', lastCharged: '2026-07-11' },
  { id: 's2', name: 'Spotify', category: 'Music', amount: 10.99, currency: 'USD', billingCycle: 'monthly', nextBilling: '2026-08-05', icon: 'music-note', color: '#1DB954', status: 'active', lastCharged: '2026-07-05' },
  { id: 's3', name: 'iCloud Storage', category: 'Cloud Storage', amount: 2.99, currency: 'USD', billingCycle: 'monthly', nextBilling: '2026-08-15', icon: 'cloud', color: '#007AFF', status: 'active', lastCharged: '2026-07-15' },
  { id: 's4', name: 'Adobe Creative', category: 'Productivity', amount: 54.99, currency: 'USD', billingCycle: 'monthly', nextBilling: '2026-08-01', icon: 'brush', color: '#FF0000', status: 'active', lastCharged: '2026-07-01' },
  { id: 's5', name: 'Hulu', category: 'Entertainment', amount: 17.99, currency: 'USD', billingCycle: 'monthly', nextBilling: '2026-08-18', icon: 'play-circle', color: '#1CE783', status: 'paused', lastCharged: '2026-06-18' },
  { id: 's6', name: 'GitHub Pro', category: 'Developer Tools', amount: 4.00, currency: 'USD', billingCycle: 'monthly', nextBilling: '2026-08-07', icon: 'code', color: '#333333', status: 'active', lastCharged: '2026-07-07' },
  { id: 's7', name: 'NYT Digital', category: 'News', amount: 4.25, currency: 'USD', billingCycle: 'monthly', nextBilling: '2026-08-20', icon: 'article', color: '#000000', status: 'active', lastCharged: '2026-07-20' },
  { id: 's8', name: 'Notion Pro', category: 'Productivity', amount: 16.00, currency: 'USD', billingCycle: 'monthly', nextBilling: '2026-08-10', icon: 'notes', color: '#000000', status: 'active', lastCharged: '2026-07-10' },
];

const CATEGORIES = ['All', 'Entertainment', 'Music', 'Productivity', 'Cloud Storage', 'Developer Tools', 'News'];
const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: '#E50914',
  Music: '#1DB954',
  Productivity: '#FF0000',
  'Cloud Storage': '#007AFF',
  'Developer Tools': '#333333',
  News: '#666666',
};

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { colors } = useTheme();

  const [subs, setSubs] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');

  const filtered = useMemo(() => {
    return subs.filter(s => {
      const catMatch = selectedCategory === 'All' || s.category === selectedCategory;
      const tabMatch = activeTab === 'active' ? s.status === 'active' : true;
      return catMatch && tabMatch;
    });
  }, [subs, selectedCategory, activeTab]);

  const activeCount = subs.filter(s => s.status === 'active').length;
  const monthlyTotal = subs.filter(s => s.status === 'active').reduce((sum, s) => {
    if (s.billingCycle === 'monthly') return sum + s.amount;
    if (s.billingCycle === 'annual') return sum + s.amount / 12;
    if (s.billingCycle === 'weekly') return sum + s.amount * 4.33;
    return sum;
  }, 0);
  const annualTotal = monthlyTotal * 12;

  // Category totals for pie
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    subs.filter(s => s.status === 'active').forEach(s => {
      map[s.category] = (map[s.category] || 0) + s.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [subs]);

  const handlePause = (sub: Subscription) => {
    showAlert(
      sub.status === 'paused' ? `Resume ${sub.name}` : `Pause ${sub.name}`,
      sub.status === 'paused'
        ? `Resume billing for ${sub.name}? Next charge: $${sub.amount} on ${sub.nextBilling}.`
        : `Pause ${sub.name}? No charges will occur while paused.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: sub.status === 'paused' ? 'Resume' : 'Pause',
          style: 'default',
          onPress: () => setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status: s.status === 'paused' ? 'active' : 'paused' } : s)),
        },
      ]
    );
  };

  const handleCancel = (sub: Subscription) => {
    showAlert(
      `Cancel ${sub.name}?`,
      `You will lose access immediately. ${sub.amount > 0 ? `No refund for the current billing period.` : ''}`,
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: () => setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'cancelled' } : s)),
        },
      ]
    );
  };

  const styles = makeStyles(colors);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <Pressable style={styles.backBtn} onPress={() => showAlert('Subscription Manager', 'Recurring charges detected from your transaction history. Manage and cancel subscriptions here.')} hitSlop={8}>
          <MaterialIcons name="info-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <View style={styles.summaryGlow} />
          <Text style={styles.summaryLabel}>Monthly Subscriptions</Text>
          <Text style={styles.summaryAmount}>${monthlyTotal.toFixed(2)}</Text>
          <Text style={styles.summaryAnnual}>≈ ${annualTotal.toFixed(0)}/year</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{activeCount}</Text>
              <Text style={styles.summaryStatLabel}>Active</Text>
            </View>
            <View style={styles.summaryStatSep} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{subs.filter(s => s.status === 'paused').length}</Text>
              <Text style={styles.summaryStatLabel}>Paused</Text>
            </View>
            <View style={styles.summaryStatSep} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{subs.filter(s => s.status === 'cancelled').length}</Text>
              <Text style={styles.summaryStatLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        {/* Category Pie (stacked bar) */}
        <View style={styles.categoryChart}>
          <Text style={styles.sectionTitle}>By Category</Text>
          <View style={styles.stackedBar}>
            {categoryTotals.map(([cat, val]) => (
              <View
                key={cat}
                style={[styles.stackedSegment, {
                  flex: val,
                  backgroundColor: CATEGORY_COLORS[cat] ?? colors.primary,
                }]}
              />
            ))}
          </View>
          <View style={styles.chartLegend}>
            {categoryTotals.map(([cat, val]) => (
              <View key={cat} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[cat] ?? colors.primary }]} />
                <Text style={styles.legendLabel}>{cat}</Text>
                <Text style={styles.legendValue}>${val.toFixed(2)}/mo</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {(['active', 'all'] as const).map(t => (
            <Pressable key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === 'active' ? `Active (${activeCount})` : `All (${subs.length})`}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Category Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catBar}>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat}
              style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Subscription List */}
        <Text style={styles.sectionTitle}>
          {filtered.length} subscription{filtered.length !== 1 ? 's' : ''}
        </Text>
        {filtered.map(sub => {
          const daysUntil = Math.ceil((new Date(sub.nextBilling).getTime() - Date.now()) / 86400000);
          return (
            <View key={sub.id} style={[styles.subCard, sub.status !== 'active' && styles.subCardDimmed]}>
              <View style={[styles.subIcon, { backgroundColor: sub.color + '22' }]}>
                <MaterialIcons name={sub.icon as any} size={22} color={sub.color} />
              </View>
              <View style={styles.subInfo}>
                <View style={styles.subNameRow}>
                  <Text style={styles.subName}>{sub.name}</Text>
                  <View style={[styles.subStatusBadge, {
                    backgroundColor: sub.status === 'active' ? colors.successBg : sub.status === 'paused' ? colors.warningBg : colors.errorBg,
                  }]}>
                    <Text style={[styles.subStatusText, {
                      color: sub.status === 'active' ? colors.success : sub.status === 'paused' ? colors.warning : colors.error,
                    }]}>{sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}</Text>
                  </View>
                </View>
                <Text style={styles.subCategory}>{sub.category}</Text>
                <Text style={styles.subBilling}>
                  ${sub.amount}/{sub.billingCycle} · Next: {sub.status === 'active' ? `${daysUntil}d` : 'Paused'}
                </Text>
              </View>
              <View style={styles.subActions}>
                <Text style={styles.subAmount}>${sub.amount}</Text>
                <View style={styles.subBtns}>
                  {sub.status !== 'cancelled' && (
                    <Pressable
                      style={[styles.subBtn, { backgroundColor: sub.status === 'paused' ? colors.successBg : colors.warningBg }]}
                      onPress={() => handlePause(sub)}
                      hitSlop={4}
                    >
                      <MaterialIcons
                        name={sub.status === 'paused' ? 'play-arrow' : 'pause'}
                        size={14}
                        color={sub.status === 'paused' ? colors.success : colors.warning}
                      />
                    </Pressable>
                  )}
                  {sub.status !== 'cancelled' && (
                    <Pressable
                      style={[styles.subBtn, { backgroundColor: colors.errorBg }]}
                      onPress={() => handleCancel(sub)}
                      hitSlop={4}
                    >
                      <MaterialIcons name="close" size={14} color={colors.error} />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="subscriptions" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No subscriptions found</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
    headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: colors.textPrimary },
    content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
    summaryCard: { borderRadius: Radius.xxl, padding: Spacing.lg, marginBottom: Spacing.base, overflow: 'hidden', ...Shadow.md },
    summaryGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)' },
    summaryLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: Spacing.xs },
    summaryAmount: { fontSize: 44, fontWeight: FontWeight.extrabold, color: '#FFFFFF', lineHeight: 48 },
    summaryAnnual: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)', marginBottom: Spacing.lg },
    summaryStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: Spacing.md },
    summaryStatItem: { flex: 1, alignItems: 'center' },
    summaryStatValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#FFFFFF' },
    summaryStatLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)' },
    summaryStatSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
    categoryChart: { backgroundColor: colors.surface, borderRadius: Radius.xxl, padding: Spacing.lg, marginBottom: Spacing.base, ...Shadow.sm },
    sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.md },
    stackedBar: { height: 12, flexDirection: 'row', borderRadius: Radius.pill, overflow: 'hidden', marginBottom: Spacing.md },
    stackedSegment: { height: '100%' },
    chartLegend: { gap: Spacing.sm },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.sm },
    legendLabel: { flex: 1, fontSize: FontSize.sm, color: colors.textSecondary },
    legendValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textPrimary },
    tabBar: {
      flexDirection: 'row', backgroundColor: colors.surface, borderRadius: Radius.xl,
      padding: 4, marginBottom: Spacing.md, ...Shadow.sm,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: Radius.lg },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    tabTextActive: { color: colors.textOnDark },
    catBar: { marginBottom: Spacing.base },
    catChip: {
      paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.pill,
      backgroundColor: colors.surface, marginRight: Spacing.sm, borderWidth: 1, borderColor: colors.border,
    },
    catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catChipText: { fontSize: FontSize.sm, color: colors.textSecondary, fontWeight: FontWeight.medium },
    catChipTextActive: { color: colors.textOnDark },
    subCard: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
    },
    subCardDimmed: { opacity: 0.65 },
    subIcon: { width: 48, height: 48, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    subInfo: { flex: 1 },
    subNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
    subName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary },
    subStatusBadge: { borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
    subStatusText: { fontSize: 10, fontWeight: FontWeight.bold },
    subCategory: { fontSize: FontSize.xs, color: colors.textMuted, marginBottom: 2 },
    subBilling: { fontSize: FontSize.xs, color: colors.textSecondary },
    subActions: { alignItems: 'flex-end', gap: Spacing.sm },
    subAmount: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary },
    subBtns: { flexDirection: 'row', gap: Spacing.xs },
    subBtn: { width: 28, height: 28, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center' },
    emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
    emptyText: { fontSize: FontSize.base, color: colors.textMuted },
  });
}
