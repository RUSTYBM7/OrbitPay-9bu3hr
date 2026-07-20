import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

const { width: W } = Dimensions.get('window');

interface BudgetCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  budget: number;
  spent: number;
}

const INITIAL_CATEGORIES: BudgetCategory[] = [
  { id: 'food', label: 'Food & Dining', icon: 'restaurant', color: '#EC4899', budget: 600, spent: 312.47 },
  { id: 'transport', label: 'Transport', icon: 'directions-car', color: '#3B82F6', budget: 250, spent: 87.20 },
  { id: 'entertainment', label: 'Entertainment', icon: 'movie', color: '#8B5CF6', budget: 150, spent: 18.99 },
  { id: 'shopping', label: 'Shopping', icon: 'shopping-bag', color: '#F59E0B', budget: 400, spent: 427.60 },
  { id: 'groceries', label: 'Groceries', icon: 'local-grocery-store', color: '#27AE60', budget: 500, spent: 94.37 },
  { id: 'bills', label: 'Bills & Utilities', icon: 'receipt-long', color: '#14B8A6', budget: 300, spent: 248.18 },
  { id: 'health', label: 'Health & Fitness', icon: 'fitness-center', color: '#EF4444', budget: 100, spent: 45.00 },
  { id: 'travel', label: 'Travel', icon: 'flight', color: '#1D4ED8', budget: 500, spent: 0 },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CURRENT_MONTH = new Date().getMonth();

function BudgetBar({ spent, budget, color, alert80 }: { spent: number; budget: number; color: string; alert80: boolean }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over = spent > budget;
  const barColor = over ? '#E74C3C' : alert80 ? '#F59E0B' : color;
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
      {pct >= 80 && !over && (
        <View style={[barStyles.marker, { left: '80%' as any }]} />
      )}
    </View>
  );
}
const barStyles = StyleSheet.create({
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'visible' },
  fill: { height: '100%', borderRadius: 4 },
  marker: { position: 'absolute', top: -2, width: 2, height: 12, backgroundColor: '#F59E0B', borderRadius: 1 },
});

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const { transactions } = useWallet();

  const [categories, setCategories] = useState<BudgetCategory[]>(INITIAL_CATEGORIES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown'>('overview');

  const totalBudget = useMemo(() => categories.reduce((s, c) => s + c.budget, 0), [categories]);
  const totalSpent = useMemo(() => categories.reduce((s, c) => s + c.spent, 0), [categories]);
  const totalRemaining = totalBudget - totalSpent;
  const overCategories = categories.filter(c => c.spent > c.budget);
  const nearLimitCategories = categories.filter(c => {
    const pct = c.budget > 0 ? (c.spent / c.budget) * 100 : 0;
    return pct >= 80 && pct < 100;
  });

  const handleEditBudget = useCallback((cat: BudgetCategory) => {
    setEditingId(cat.id);
    setEditValue(cat.budget.toString());
  }, []);

  const handleSaveBudget = useCallback(() => {
    const newBudget = parseFloat(editValue);
    if (!editingId || isNaN(newBudget) || newBudget < 0) { setEditingId(null); return; }
    setCategories(prev => prev.map(c => c.id === editingId ? { ...c, budget: newBudget } : c));
    setEditingId(null);
  }, [editingId, editValue]);

  const styles = makeStyles(colors);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Budget Planner</Text>
        <Pressable style={styles.backBtn} onPress={() => showAlert('Budget Tips', 'Aim to keep each category under 80% of budget. The 50/30/20 rule: 50% needs, 30% wants, 20% savings.')} hitSlop={8}>
          <MaterialIcons name="info-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['overview', 'breakdown'] as const).map(t => (
          <Pressable key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'overview' ? 'Overview' : 'Breakdown'}
            </Text>
          </Pressable>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Month Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
            <View style={styles.summaryGlow} />
            <Text style={styles.summaryMonth}>{MONTHS[CURRENT_MONTH]} 2026 Budget</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>${totalBudget.toLocaleString()}</Text>
                <Text style={styles.summaryItemLabel}>Total Budget</Text>
              </View>
              <View style={styles.summarySep} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, totalSpent > totalBudget && { color: '#FFB3B3' }]}>
                  ${totalSpent.toFixed(0)}
                </Text>
                <Text style={styles.summaryItemLabel}>Spent</Text>
              </View>
              <View style={styles.summarySep} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, totalRemaining < 0 && { color: '#FFB3B3' }]}>
                  {totalRemaining < 0 ? '-' : ''}${Math.abs(totalRemaining).toFixed(0)}
                </Text>
                <Text style={styles.summaryItemLabel}>{totalRemaining < 0 ? 'Over Budget' : 'Remaining'}</Text>
              </View>
            </View>

            {/* Overall progress */}
            <View style={styles.overallBar}>
              <View style={[styles.overallFill, {
                width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` as any,
                backgroundColor: totalSpent > totalBudget ? '#EF4444' : totalSpent / totalBudget > 0.8 ? '#F59E0B' : '#FFFFFF',
              }]} />
            </View>
            <Text style={styles.overallPct}>
              {((totalSpent / totalBudget) * 100).toFixed(0)}% of budget used
            </Text>
          </View>

          {/* Alerts */}
          {overCategories.length > 0 && (
            <View style={[styles.alertCard, { backgroundColor: colors.errorBg, borderColor: colors.error + '44' }]}>
              <MaterialIcons name="warning" size={18} color={colors.error} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: colors.error }]}>Over Budget!</Text>
                <Text style={[styles.alertSub, { color: colors.textSecondary }]}>
                  {overCategories.map(c => c.label).join(', ')} exceeded budget limits.
                </Text>
              </View>
            </View>
          )}
          {nearLimitCategories.length > 0 && (
            <View style={[styles.alertCard, { backgroundColor: colors.warningBg, borderColor: colors.warning + '44' }]}>
              <MaterialIcons name="notifications" size={18} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: colors.warning }]}>Nearing Limit</Text>
                <Text style={[styles.alertSub, { color: colors.textSecondary }]}>
                  {nearLimitCategories.map(c => c.label).join(', ')} at 80%+ of budget.
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'overview' && (
            <>
              {/* Category Bars */}
              <Text style={styles.sectionTitle}>Category Budgets</Text>
              {categories.map(cat => {
                const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
                const isOver = cat.spent > cat.budget;
                const isNear = pct >= 80 && !isOver;
                return (
                  <View key={cat.id} style={styles.categoryCard}>
                    <View style={styles.categoryTop}>
                      <View style={[styles.categoryIcon, { backgroundColor: cat.color + '22' }]}>
                        <MaterialIcons name={cat.icon as any} size={18} color={cat.color} />
                      </View>
                      <View style={styles.categoryInfo}>
                        <View style={styles.categoryNameRow}>
                          <Text style={styles.categoryName}>{cat.label}</Text>
                          {isOver && (
                            <View style={[styles.statusPill, { backgroundColor: colors.errorBg }]}>
                              <Text style={[styles.statusPillText, { color: colors.error }]}>Over</Text>
                            </View>
                          )}
                          {isNear && !isOver && (
                            <View style={[styles.statusPill, { backgroundColor: colors.warningBg }]}>
                              <Text style={[styles.statusPillText, { color: colors.warning }]}>80%+</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.categoryAmounts}>
                          <Text style={[styles.spentText, isOver && { color: colors.error }]}>${cat.spent.toFixed(2)}</Text>
                          <Text style={styles.ofText}> of </Text>
                          {editingId === cat.id ? (
                            <TextInput
                              style={styles.budgetInput}
                              value={editValue}
                              onChangeText={setEditValue}
                              keyboardType="decimal-pad"
                              autoFocus
                              onBlur={handleSaveBudget}
                              onSubmitEditing={handleSaveBudget}
                            />
                          ) : (
                            <Pressable onPress={() => handleEditBudget(cat)} hitSlop={8}>
                              <Text style={[styles.budgetText, { color: colors.primary }]}>${cat.budget.toFixed(0)}</Text>
                            </Pressable>
                          )}
                          <MaterialIcons name="edit" size={12} color={colors.textMuted} style={{ marginLeft: 2 }} />
                        </View>
                      </View>
                      <Text style={[styles.pctText, isOver ? { color: colors.error } : isNear ? { color: colors.warning } : { color: colors.textMuted }]}>
                        {pct.toFixed(0)}%
                      </Text>
                    </View>
                    <BudgetBar spent={cat.spent} budget={cat.budget} color={cat.color} alert80={isNear} />
                  </View>
                );
              })}
            </>
          )}

          {activeTab === 'breakdown' && (
            <>
              <Text style={styles.sectionTitle}>Spending Breakdown</Text>
              {/* Pie visual (horizontal stacked bar) */}
              <View style={styles.pieCard}>
                <Text style={styles.pieTitle}>Allocation by Category</Text>
                <View style={styles.stackedBar}>
                  {categories.filter(c => c.spent > 0).map(cat => {
                    const pct = totalSpent > 0 ? (cat.spent / totalSpent) * 100 : 0;
                    return (
                      <View key={cat.id} style={[styles.stackedBarSegment, { flex: cat.spent, backgroundColor: cat.color }]} />
                    );
                  })}
                </View>
                <View style={styles.pieLegend}>
                  {categories.filter(c => c.spent > 0).map(cat => {
                    const pct = totalSpent > 0 ? ((cat.spent / totalSpent) * 100).toFixed(0) : '0';
                    return (
                      <View key={cat.id} style={styles.pieLegendItem}>
                        <View style={[styles.pieDot, { backgroundColor: cat.color }]} />
                        <Text style={styles.pieLegendLabel}>{cat.label}</Text>
                        <Text style={styles.pieLegendPct}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Over/Under summary */}
              <View style={styles.overUnderCard}>
                <Text style={styles.sectionTitle}>Monthly Summary</Text>
                {categories.map(cat => {
                  const diff = cat.budget - cat.spent;
                  const isOver = diff < 0;
                  return (
                    <View key={cat.id} style={styles.overUnderRow}>
                      <View style={[styles.overUnderDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.overUnderLabel}>{cat.label}</Text>
                      <Text style={[styles.overUnderValue, { color: isOver ? colors.error : colors.success }]}>
                        {isOver ? '-' : '+'}${Math.abs(diff).toFixed(2)}
                        {isOver ? ' over' : ' under'}
                      </Text>
                    </View>
                  );
                })}
                <View style={[styles.overUnderTotal, { borderTopColor: colors.divider }]}>
                  <Text style={styles.overUnderTotalLabel}>Net Position</Text>
                  <Text style={[styles.overUnderTotalValue, { color: totalRemaining >= 0 ? colors.success : colors.error }]}>
                    {totalRemaining >= 0 ? '+' : '-'}${Math.abs(totalRemaining).toFixed(2)}
                  </Text>
                </View>
              </View>
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    tabBar: {
      flexDirection: 'row', backgroundColor: colors.surface, marginHorizontal: Spacing.base,
      borderRadius: Radius.xl, padding: 4, marginBottom: Spacing.base, ...Shadow.sm,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: Radius.lg },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    tabTextActive: { color: colors.textOnDark },
    content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
    summaryCard: { borderRadius: Radius.xxl, padding: Spacing.lg, marginBottom: Spacing.md, overflow: 'hidden', ...Shadow.md },
    summaryGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)' },
    summaryMonth: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginBottom: Spacing.md },
    summaryRow: { flexDirection: 'row', marginBottom: Spacing.lg },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#FFFFFF' },
    summaryItemLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
    summarySep: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
    overallBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginBottom: Spacing.xs },
    overallFill: { height: '100%', borderRadius: 3 },
    overallPct: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)' },
    alertCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
      borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1,
    },
    alertTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 2 },
    alertSub: { fontSize: FontSize.xs, lineHeight: 16 },
    sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
    categoryCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.sm, ...Shadow.sm,
    },
    categoryTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
    categoryIcon: { width: 40, height: 40, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    categoryInfo: { flex: 1 },
    categoryNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
    categoryName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    statusPill: { borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
    statusPillText: { fontSize: 10, fontWeight: FontWeight.bold },
    categoryAmounts: { flexDirection: 'row', alignItems: 'center' },
    spentText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textPrimary },
    ofText: { fontSize: FontSize.sm, color: colors.textMuted },
    budgetText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
    budgetInput: {
      fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.primary,
      borderBottomWidth: 1, borderBottomColor: colors.primary, minWidth: 48,
      padding: 0, includeFontPadding: false,
    },
    pctText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, minWidth: 36, textAlign: 'right' },
    pieCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xxl, padding: Spacing.lg,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    pieTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textMuted, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
    stackedBar: { height: 16, flexDirection: 'row', borderRadius: Radius.pill, overflow: 'hidden', marginBottom: Spacing.lg },
    stackedBarSegment: { height: '100%' },
    pieLegend: { gap: Spacing.sm },
    pieLegendItem: { flexDirection: 'row', alignItems: 'center' },
    pieDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.sm },
    pieLegendLabel: { flex: 1, fontSize: FontSize.sm, color: colors.textSecondary },
    pieLegendPct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textPrimary },
    overUnderCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xxl, padding: Spacing.lg,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    overUnderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
    overUnderDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
    overUnderLabel: { flex: 1, fontSize: FontSize.sm, color: colors.textSecondary },
    overUnderValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
    overUnderTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.md, marginTop: Spacing.md, borderTopWidth: 1 },
    overUnderTotalLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary },
    overUnderTotalValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  });
}
