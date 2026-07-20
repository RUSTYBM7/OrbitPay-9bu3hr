import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  Modal, FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';
import { Transaction, formatDate } from '../services/mockData';

const TX_TYPES = ['All', 'Send', 'Receive', 'Bills', 'Crypto'] as const;
const TX_STATUSES = ['All', 'Completed', 'Pending', 'Failed'] as const;
const TX_CATEGORIES = ['All', 'Transfer', 'Food', 'Entertainment', 'Shopping', 'Transport', 'Crypto', 'Investment', 'Bills'];

interface FilterState {
  type: string;
  status: string;
  category: string;
  amountMin: string;
  amountMax: string;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTER: FilterState = {
  type: 'All', status: 'All', category: 'All',
  amountMin: '', amountMax: '', dateFrom: '', dateTo: '',
};

interface FilterSheetProps {
  visible: boolean;
  filter: FilterState;
  onChange: (f: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
  colors: ReturnType<typeof import('../contexts/ThemeContext').useTheme>['colors'];
}

function FilterSheet({ visible, filter, onChange, onApply, onReset, colors }: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent={false}>
      <View style={[styles.sheetRoot, { paddingTop: insets.top + Spacing.base }]}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filter Transactions</Text>
          <Pressable onPress={onReset} hitSlop={8}>
            <Text style={styles.resetText}>Reset All</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>

          {/* Type */}
          <Text style={styles.filterLabel}>Transaction Type</Text>
          <View style={styles.chipRow}>
            {TX_TYPES.map(t => (
              <Pressable
                key={t}
                style={[styles.chip, filter.type === t && styles.chipActive]}
                onPress={() => onChange({ ...filter, type: t })}
              >
                <Text style={[styles.chipText, filter.type === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {/* Status */}
          <Text style={styles.filterLabel}>Status</Text>
          <View style={styles.chipRow}>
            {TX_STATUSES.map(s => (
              <Pressable
                key={s}
                style={[styles.chip, filter.status === s && styles.chipActive]}
                onPress={() => onChange({ ...filter, status: s })}
              >
                <Text style={[styles.chipText, filter.status === s && styles.chipTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          {/* Category */}
          <Text style={styles.filterLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
            {TX_CATEGORIES.map(c => (
              <Pressable
                key={c}
                style={[styles.chip, { marginRight: Spacing.xs }, filter.category === c && styles.chipActive]}
                onPress={() => onChange({ ...filter, category: c })}
              >
                <Text style={[styles.chipText, filter.category === c && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Amount Range */}
          <Text style={styles.filterLabel}>Amount Range</Text>
          <View style={styles.rangeRow}>
            <View style={styles.rangeInput}>
              <Text style={styles.rangeSymbol}>$</Text>
              <TextInput
                style={styles.rangeField}
                value={filter.amountMin}
                onChangeText={v => onChange({ ...filter, amountMin: v })}
                placeholder="Min"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.rangeSep}>–</Text>
            <View style={styles.rangeInput}>
              <Text style={styles.rangeSymbol}>$</Text>
              <TextInput
                style={styles.rangeField}
                value={filter.amountMax}
                onChangeText={v => onChange({ ...filter, amountMax: v })}
                placeholder="Max"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Date Range */}
          <Text style={styles.filterLabel}>Date Range</Text>
          <View style={styles.dateRow}>
            {[
              { label: 'From', key: 'dateFrom' as const, placeholder: 'YYYY-MM-DD' },
              { label: 'To', key: 'dateTo' as const, placeholder: 'YYYY-MM-DD' },
            ].map(d => (
              <View key={d.key} style={styles.dateInput}>
                <Text style={styles.dateLabel}>{d.label}</Text>
                <TextInput
                  style={styles.dateField}
                  value={filter[d.key]}
                  onChangeText={v => onChange({ ...filter, [d.key]: v })}
                  placeholder={d.placeholder}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ))}
          </View>

          {/* Quick Date Presets */}
          <View style={styles.chipRow}>
            {['Today', 'This Week', 'This Month', 'Last 3M'].map(preset => {
              const now = new Date();
              const from = new Date();
              if (preset === 'Today') from.setHours(0, 0, 0, 0);
              else if (preset === 'This Week') from.setDate(now.getDate() - 7);
              else if (preset === 'This Month') from.setDate(1);
              else from.setMonth(now.getMonth() - 3);
              const fromStr = from.toISOString().split('T')[0];
              const toStr = now.toISOString().split('T')[0];
              const isActive = filter.dateFrom === fromStr && filter.dateTo === toStr;
              return (
                <Pressable
                  key={preset}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => onChange({ ...filter, dateFrom: fromStr, dateTo: toStr })}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{preset}</Text>
                </Pressable>
              );
            })}
          </View>

        </ScrollView>

        <View style={[styles.sheetFooter, { paddingBottom: insets.bottom + Spacing.base }]}>
          <Pressable style={styles.applyBtn} onPress={onApply}>
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

interface TransactionFilterProps {
  onClose?: () => void;
}

export default function TransactionFilterScreen({ onClose }: TransactionFilterProps) {
  const insets = useSafeAreaInsets();
  const { transactions, activeWallet } = useWallet();
  const { colors } = useTheme();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(DEFAULT_FILTER);

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (appliedFilter.type !== 'All') c++;
    if (appliedFilter.status !== 'All') c++;
    if (appliedFilter.category !== 'All') c++;
    if (appliedFilter.amountMin || appliedFilter.amountMax) c++;
    if (appliedFilter.dateFrom || appliedFilter.dateTo) c++;
    return c;
  }, [appliedFilter]);

  const filteredTx = useMemo(() => {
    let result = [...transactions];

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.subtitle?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (appliedFilter.type !== 'All') {
      const typeMap: Record<string, string[]> = {
        Send: ['send'],
        Receive: ['receive', 'topup'],
        Bills: ['payment', 'bill'],
        Crypto: ['crypto'],
      };
      const allowed = typeMap[appliedFilter.type] ?? [];
      result = result.filter(t => allowed.includes(t.type));
    }

    // Status
    if (appliedFilter.status !== 'All') {
      result = result.filter(t => t.status.toLowerCase() === appliedFilter.status.toLowerCase());
    }

    // Category
    if (appliedFilter.category !== 'All') {
      result = result.filter(t => t.category?.toLowerCase().includes(appliedFilter.category.toLowerCase()));
    }

    // Amount
    if (appliedFilter.amountMin) {
      result = result.filter(t => Math.abs(t.amount) >= parseFloat(appliedFilter.amountMin));
    }
    if (appliedFilter.amountMax) {
      result = result.filter(t => Math.abs(t.amount) <= parseFloat(appliedFilter.amountMax));
    }

    // Date
    if (appliedFilter.dateFrom) {
      result = result.filter(t => t.timestamp >= appliedFilter.dateFrom);
    }
    if (appliedFilter.dateTo) {
      result = result.filter(t => t.timestamp <= appliedFilter.dateTo + 'T23:59:59Z');
    }

    return result;
  }, [transactions, search, appliedFilter]);

  const styles = makeStyles(colors);

  const renderTx = ({ item: tx }: { item: Transaction }) => {
    const isCredit = tx.amount > 0;
    const walletSymbol = tx.currency === 'USD' ? '$' : tx.currency === 'EUR' ? '€' : tx.currency === 'GBP' ? '£' : '';
    return (
      <View style={styles.txRow}>
        <View style={[styles.txIcon, isCredit ? styles.txIconCredit : styles.txIconDebit]}>
          <MaterialIcons name={tx.icon as any} size={18} color={isCredit ? colors.success : colors.primary} />
        </View>
        <View style={styles.txMeta}>
          <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
          <Text style={styles.txSub} numberOfLines={1}>{tx.subtitle}</Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isCredit ? colors.success : colors.textPrimary }]}>
            {isCredit ? '+' : ''}{walletSymbol}{Math.abs(tx.amount).toFixed(2)}
          </Text>
          <Text style={styles.txDate}>{formatDate(tx.timestamp)}</Text>
          {tx.status === 'pending' && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Transactions</Text>
        <Pressable
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setSheetVisible(true)}
          hitSlop={8}
        >
          <MaterialIcons name="tune" size={18} color={activeFilterCount > 0 ? colors.textOnDark : colors.primary} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search transactions…"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          accessibilityLabel="Search transactions"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activePills}>
          {appliedFilter.type !== 'All' && (
            <Pressable style={styles.activePill} onPress={() => setAppliedFilter(p => ({ ...p, type: 'All' }))}>
              <Text style={styles.activePillText}>{appliedFilter.type}</Text>
              <MaterialIcons name="close" size={12} color={colors.primary} />
            </Pressable>
          )}
          {appliedFilter.status !== 'All' && (
            <Pressable style={styles.activePill} onPress={() => setAppliedFilter(p => ({ ...p, status: 'All' }))}>
              <Text style={styles.activePillText}>{appliedFilter.status}</Text>
              <MaterialIcons name="close" size={12} color={colors.primary} />
            </Pressable>
          )}
          {appliedFilter.category !== 'All' && (
            <Pressable style={styles.activePill} onPress={() => setAppliedFilter(p => ({ ...p, category: 'All' }))}>
              <Text style={styles.activePillText}>{appliedFilter.category}</Text>
              <MaterialIcons name="close" size={12} color={colors.primary} />
            </Pressable>
          )}
          {(appliedFilter.amountMin || appliedFilter.amountMax) && (
            <Pressable style={styles.activePill} onPress={() => setAppliedFilter(p => ({ ...p, amountMin: '', amountMax: '' }))}>
              <Text style={styles.activePillText}>
                ${appliedFilter.amountMin || '0'}–${appliedFilter.amountMax || '∞'}
              </Text>
              <MaterialIcons name="close" size={12} color={colors.primary} />
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* Results Count */}
      <Text style={styles.resultCount}>
        {filteredTx.length} transaction{filteredTx.length !== 1 ? 's' : ''}
        {activeFilterCount > 0 || search ? ' found' : ''}
      </Text>

      <FlatList
        data={filteredTx}
        renderItem={renderTx}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialIcons name="receipt-long" size={52} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySub}>Try adjusting your search or filters</Text>
          </View>
        }
      />

      <FilterSheet
        visible={sheetVisible}
        filter={filter}
        onChange={setFilter}
        onApply={() => { setAppliedFilter(filter); setSheetVisible(false); }}
        onReset={() => { setFilter(DEFAULT_FILTER); setAppliedFilter(DEFAULT_FILTER); }}
        colors={colors}
      />
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
    headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: colors.textPrimary },
    filterBtn: {
      width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: colors.surface,
      alignItems: 'center', justifyContent: 'center', ...Shadow.sm, position: 'relative',
    },
    filterBtnActive: { backgroundColor: colors.primary },
    filterBadge: {
      position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8,
      backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center',
    },
    filterBadgeText: { fontSize: 9, color: colors.textOnDark, fontWeight: FontWeight.bold },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.surface, borderRadius: Radius.xl,
      marginHorizontal: Spacing.base, marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      borderWidth: 1, borderColor: colors.border, ...Shadow.sm,
    },
    searchInput: { flex: 1, fontSize: FontSize.base, color: colors.textPrimary, includeFontPadding: false },
    activePills: { paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
    activePill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.cardMint, borderRadius: Radius.pill,
      paddingHorizontal: Spacing.sm, paddingVertical: 5, marginRight: Spacing.xs,
      borderWidth: 1, borderColor: colors.border,
    },
    activePillText: { fontSize: FontSize.xs, color: colors.primary, fontWeight: FontWeight.semibold },
    resultCount: {
      fontSize: FontSize.xs, color: colors.textMuted, fontWeight: FontWeight.medium,
      paddingHorizontal: Spacing.base, marginBottom: Spacing.sm,
    },
    listContent: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
    txRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: Radius.lg,
      padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
    },
    txIcon: { width: 42, height: 42, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    txIconCredit: { backgroundColor: colors.successBg },
    txIconDebit: { backgroundColor: colors.background },
    txMeta: { flex: 1, marginRight: Spacing.sm },
    txTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    txSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    txRight: { alignItems: 'flex-end' },
    txAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
    txDate: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    pendingBadge: { backgroundColor: colors.warningBg, borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
    pendingText: { fontSize: 9, color: colors.warning, fontWeight: FontWeight.bold },
    emptyWrap: { alignItems: 'center', paddingVertical: Spacing.xxxl },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: colors.textPrimary, marginTop: Spacing.md },
    emptySub: { fontSize: FontSize.sm, color: colors.textMuted, marginTop: Spacing.xs },
    // Sheet styles
    sheetRoot: { flex: 1, backgroundColor: colors.background },
    sheetHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.base, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    sheetTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: colors.textPrimary },
    resetText: { fontSize: FontSize.sm, color: colors.error, fontWeight: FontWeight.semibold },
    sheetContent: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.base },
    filterLabel: {
      fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.sm, marginTop: Spacing.md,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
    chip: {
      paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.pill,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    chipTextActive: { color: colors.textOnDark },
    rangeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
    rangeInput: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      backgroundColor: colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
      borderWidth: 1, borderColor: colors.border,
    },
    rangeSymbol: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary },
    rangeField: { flex: 1, fontSize: FontSize.base, color: colors.textPrimary, includeFontPadding: false },
    rangeSep: { fontSize: FontSize.lg, color: colors.textMuted, fontWeight: FontWeight.bold },
    dateRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
    dateInput: { flex: 1 },
    dateLabel: { fontSize: FontSize.xs, color: colors.textMuted, marginBottom: 4 },
    dateField: {
      backgroundColor: colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
      borderWidth: 1, borderColor: colors.border, fontSize: FontSize.sm, color: colors.textPrimary,
    },
    sheetFooter: {
      paddingHorizontal: Spacing.base, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: Spacing.md,
    },
    applyBtn: {
      backgroundColor: colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg,
      alignItems: 'center', ...Shadow.md,
    },
    applyBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textOnDark },
  });
}
