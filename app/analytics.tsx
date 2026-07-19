import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '../hooks/useWallet';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

const { width: W } = Dimensions.get('window');
const CHART_W = W - Spacing.base * 2 - Spacing.lg * 2;
const BAR_MAX_H = 120;

const PERIODS = ['1W', '1M', '3M', '6M', '1Y'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Category config
const CATEGORIES: { id: string; label: string; icon: string; color: string }[] = [
  { id: 'food', label: 'Food & Dining', icon: 'restaurant', color: '#F59E0B' },
  { id: 'entertainment', label: 'Entertainment', icon: 'movie', color: '#8B5CF6' },
  { id: 'transfer', label: 'Transfers', icon: 'swap-horiz', color: Colors.primary },
  { id: 'crypto', label: 'Crypto', icon: 'currency-bitcoin', color: Colors.bitcoin },
  { id: 'bills', label: 'Bills', icon: 'receipt', color: Colors.info },
  { id: 'shopping', label: 'Shopping', icon: 'shopping-bag', color: '#EC4899' },
  { id: 'transport', label: 'Transport', icon: 'directions-car', color: Colors.success },
  { id: 'other', label: 'Other', icon: 'more-horiz', color: Colors.textMuted },
];

interface BarData { month: string; amount: number; prev: number; }
interface CategoryData { id: string; label: string; icon: string; color: string; amount: number; percent: number; }

// Generate deterministic chart data
function generateMonthlyData(seed: number): BarData[] {
  return MONTHS_SHORT.slice(0, 7).map((m, i) => ({
    month: m,
    amount: 1200 + Math.abs(Math.sin(seed + i * 1.3)) * 1800,
    prev: 1000 + Math.abs(Math.cos(seed + i * 0.7)) * 1600,
  }));
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, activeWallet } = useWallet();

  const [period, setPeriod] = useState('1M');
  const [selectedMonth, setSelectedMonth] = useState(6); // current month index in chart

  // Compute spending by category from transactions
  const categoryData: CategoryData[] = useMemo(() => {
    const debitTx = transactions.filter(t => t.amount < 0);
    const totalSpend = debitTx.reduce((s, t) => s + Math.abs(t.amount), 0) || 1;

    const catAmounts: Record<string, number> = {};
    debitTx.forEach(t => {
      const cat = (t.category ?? 'other').toLowerCase();
      const matchCat = CATEGORIES.find(c =>
        cat.includes(c.id) || (c.id === 'transfer' && t.type === 'send') ||
        (c.id === 'crypto' && t.type === 'crypto') ||
        (c.id === 'bills' && t.type === 'bill')
      );
      const key = matchCat?.id ?? 'other';
      catAmounts[key] = (catAmounts[key] ?? 0) + Math.abs(t.amount);
    });

    // Ensure we have data for demo
    if (Object.keys(catAmounts).length === 0) {
      return [
        { ...CATEGORIES[0], amount: 842, percent: 28 },
        { ...CATEGORIES[1], amount: 465, percent: 15 },
        { ...CATEGORIES[2], amount: 1250, percent: 41 },
        { ...CATEGORIES[3], amount: 380, percent: 12 },
        { ...CATEGORIES[4], amount: 125, percent: 4 },
      ];
    }

    return CATEGORIES
      .map(c => ({
        ...c,
        amount: catAmounts[c.id] ?? 0,
        percent: Math.round(((catAmounts[c.id] ?? 0) / totalSpend) * 100),
      }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const monthlyData = useMemo(() => generateMonthlyData(42), []);
  const maxBar = Math.max(...monthlyData.map(d => d.amount));

  const selectedData = monthlyData[selectedMonth];
  const trend = selectedData
    ? ((selectedData.amount - selectedData.prev) / selectedData.prev) * 100
    : 0;
  const trendUp = trend >= 0;

  const totalSpend = categoryData.reduce((s, c) => s + c.amount, 0);
  const lastMonthSpend = totalSpend * 0.88; // mock comparison

  // Top merchants (mock)
  const topMerchants = [
    { name: 'Netflix', icon: 'tv', amount: 15.99, category: 'entertainment', color: '#E50914', count: 1 },
    { name: 'Whole Foods', icon: 'shopping-cart', amount: 127.45, category: 'food', color: '#F59E0B', count: 3 },
    { name: 'Uber', icon: 'directions-car', amount: 89.20, category: 'transport', color: '#000', count: 5 },
    { name: 'Amazon', icon: 'shopping-bag', amount: 234.67, category: 'shopping', color: '#FF9900', count: 4 },
    { name: 'Coinbase', icon: 'currency-bitcoin', amount: 500.00, category: 'crypto', color: Colors.bitcoin, count: 2 },
  ].sort((a, b) => b.amount - a.amount);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Spending Analytics</Text>
        <Pressable
          style={styles.exportBtn}
          onPress={() => {}}
          hitSlop={8}
        >
          <MaterialIcons name="download" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <Pressable
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Summary Banner */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>Total Spent ({period})</Text>
            <Text style={styles.summaryAmount}>
              {activeWallet.symbol}{totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <View style={[styles.trendPill, trendUp ? styles.trendPillUp : styles.trendPillDown]}>
              <MaterialIcons name={trendUp ? 'trending-up' : 'trending-down'} size={12} color={trendUp ? Colors.error : Colors.success} />
              <Text style={[styles.trendText, { color: trendUp ? Colors.error : Colors.success }]}>
                {trendUp ? '+' : ''}{trend.toFixed(1)}% vs last period
              </Text>
            </View>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryRightLabel}>Budget Used</Text>
            <Text style={styles.summaryRightValue}>73%</Text>
            <View style={styles.budgetBar}>
              <View style={[styles.budgetFill, { width: '73%' }]} />
            </View>
          </View>
        </View>

        {/* Monthly Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Monthly Spending</Text>
            {selectedData && (
              <View style={styles.chartSelected}>
                <Text style={styles.chartSelectedMonth}>{monthlyData[selectedMonth].month}</Text>
                <Text style={styles.chartSelectedAmount}>
                  {activeWallet.symbol}{selectedData.amount.toFixed(0)}
                </Text>
              </View>
            )}
          </View>

          {/* Bar Chart */}
          <View style={[styles.barChart, { width: CHART_W }]}>
            {monthlyData.map((d, i) => {
              const barH = Math.max(4, (d.amount / maxBar) * BAR_MAX_H);
              const prevH = Math.max(4, (d.prev / maxBar) * BAR_MAX_H);
              const isSelected = i === selectedMonth;
              return (
                <Pressable
                  key={d.month}
                  style={styles.barGroup}
                  onPress={() => setSelectedMonth(i)}
                >
                  {/* Prev month bar (lighter) */}
                  <View style={[styles.barPrev, { height: prevH }]} />
                  {/* Current bar */}
                  <View style={[
                    styles.bar,
                    { height: barH, backgroundColor: isSelected ? Colors.primary : Colors.primary + '66' },
                  ]} />
                  <Text style={[styles.barLabel, isSelected && styles.barLabelActive]}>{d.month}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>This period</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary + '44' }]} />
              <Text style={styles.legendText}>Last period</Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.categoryCard}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>

          {/* Inline Pie Chart (simplified bar visualization) */}
          <View style={styles.pieRow}>
            {categoryData.slice(0, 5).map(c => (
              <View key={c.id} style={[styles.pieSegment, {
                flex: c.percent,
                backgroundColor: c.color,
                height: 12,
              }]} />
            ))}
          </View>
          <View style={styles.pieLegend}>
            {categoryData.slice(0, 5).map(c => (
              <View key={c.id} style={styles.pieLegendItem}>
                <View style={[styles.pieLegendDot, { backgroundColor: c.color }]} />
                <Text style={styles.pieLegendLabel}>{c.percent}%</Text>
              </View>
            ))}
          </View>

          {/* Category list */}
          {categoryData.slice(0, 6).map((c, i) => (
            <View key={c.id} style={styles.categoryRow}>
              <View style={styles.categoryRank}>
                <Text style={styles.categoryRankText}>{i + 1}</Text>
              </View>
              <View style={[styles.categoryIcon, { backgroundColor: c.color + '22' }]}>
                <MaterialIcons name={c.icon as any} size={18} color={c.color} />
              </View>
              <View style={styles.categoryInfo}>
                <View style={styles.categoryInfoTop}>
                  <Text style={styles.categoryName}>{c.label}</Text>
                  <Text style={styles.categoryAmount}>
                    {activeWallet.symbol}{c.amount.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.categoryBar}>
                  <View style={[styles.categoryBarFill, { width: `${c.percent}%` as any, backgroundColor: c.color }]} />
                </View>
                <Text style={styles.categoryPct}>{c.percent}% of spending</Text>
              </View>
            </View>
          ))}
        </View>

        {/* vs Last Month Comparison */}
        <View style={styles.compareCard}>
          <Text style={styles.sectionTitle}>vs Last Month</Text>
          <View style={styles.compareRow}>
            <View style={styles.compareItem}>
              <Text style={styles.compareLabel}>This Month</Text>
              <Text style={styles.compareValue}>
                {activeWallet.symbol}{totalSpend.toFixed(2)}
              </Text>
            </View>
            <View style={styles.compareDivider} />
            <View style={styles.compareItem}>
              <Text style={styles.compareLabel}>Last Month</Text>
              <Text style={styles.compareValue}>
                {activeWallet.symbol}{lastMonthSpend.toFixed(2)}
              </Text>
            </View>
            <View style={styles.compareDivider} />
            <View style={styles.compareItem}>
              <Text style={styles.compareLabel}>Difference</Text>
              <Text style={[styles.compareValue, { color: Colors.success }]}>
                -{activeWallet.symbol}{(totalSpend - lastMonthSpend).toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.aiInsightRow}>
            <MaterialIcons name="smart-toy" size={16} color={Colors.primary} />
            <Text style={styles.aiInsightText}>
              You spent <Text style={{ fontWeight: FontWeight.bold }}>12% less</Text> than last month. Great progress on your savings goal!
            </Text>
          </View>
        </View>

        {/* Top Merchants */}
        <View style={styles.merchantsCard}>
          <Text style={styles.sectionTitle}>Top Merchants</Text>
          {topMerchants.map((m, i) => (
            <View key={m.name} style={styles.merchantRow}>
              <Text style={styles.merchantRank}>#{i + 1}</Text>
              <View style={[styles.merchantIcon, { backgroundColor: m.color + '22' }]}>
                <MaterialIcons name={m.icon as any} size={18} color={m.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.merchantName}>{m.name}</Text>
                <Text style={styles.merchantMeta}>{m.count} transaction{m.count > 1 ? 's' : ''} · {m.category}</Text>
              </View>
              <Text style={styles.merchantAmount}>
                {activeWallet.symbol}{m.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  headerTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  exportBtn: {
    width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  periodRow: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.base, marginBottom: Spacing.md,
  },
  periodBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.pill,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  periodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  periodTextActive: { color: Colors.textOnDark },
  content: { paddingHorizontal: Spacing.base },
  summaryCard: {
    backgroundColor: Colors.primary, borderRadius: Radius.xxl, padding: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md, ...Shadow.md,
  },
  summaryLeft: { flex: 1 },
  summaryLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  summaryAmount: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textOnDark, marginBottom: Spacing.sm, letterSpacing: -1 },
  trendPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start',
    borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 4,
  },
  trendPillUp: { backgroundColor: 'rgba(239,68,68,0.2)' },
  trendPillDown: { backgroundColor: 'rgba(34,197,94,0.2)' },
  trendText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  summaryRight: { alignItems: 'flex-end' },
  summaryRightLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  summaryRightValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  budgetBar: { width: 80, height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  budgetFill: { height: '100%', backgroundColor: Colors.textOnDark, borderRadius: 3 },
  chartCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    marginBottom: Spacing.md, ...Shadow.sm, overflow: 'hidden',
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  chartTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  chartSelected: { alignItems: 'flex-end' },
  chartSelectedMonth: { fontSize: FontSize.xs, color: Colors.textMuted },
  chartSelectedAmount: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  barChart: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    height: BAR_MAX_H + 24, paddingBottom: 24,
  },
  barGroup: { flex: 1, alignItems: 'center', gap: 2 },
  barPrev: { width: 6, borderRadius: 3, backgroundColor: Colors.primary + '33', marginBottom: 2 },
  bar: { width: '55%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.medium, marginTop: 4 },
  barLabelActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  chartLegend: { flexDirection: 'row', gap: Spacing.base, marginTop: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FontSize.xs, color: Colors.textMuted },
  categoryCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
    marginBottom: Spacing.md, ...Shadow.sm,
  },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  pieRow: {
    flexDirection: 'row', height: 12, borderRadius: Radius.pill, overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  pieSegment: {},
  pieLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  pieLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pieLegendDot: { width: 8, height: 8, borderRadius: 4 },
  pieLegendLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  categoryRank: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryRankText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted },
  categoryIcon: { width: 38, height: 38, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center' },
  categoryInfo: { flex: 1 },
  categoryInfoTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoryName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  categoryAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  categoryBar: { height: 4, backgroundColor: Colors.background, borderRadius: 2, overflow: 'hidden', marginBottom: 2 },
  categoryBarFill: { height: '100%', borderRadius: 2 },
  categoryPct: { fontSize: FontSize.xs, color: Colors.textMuted },
  compareCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
    marginBottom: Spacing.md, ...Shadow.sm,
  },
  compareRow: { flexDirection: 'row', marginBottom: Spacing.md },
  compareItem: { flex: 1, alignItems: 'center' },
  compareLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  compareValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  compareDivider: { width: 1, backgroundColor: Colors.divider, marginVertical: 4 },
  aiInsightRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing.sm,
  },
  aiInsightText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  merchantsCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
    ...Shadow.sm,
  },
  merchantRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  merchantRank: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, width: 24, textAlign: 'center' },
  merchantIcon: { width: 38, height: 38, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center' },
  merchantName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  merchantMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  merchantAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
});
