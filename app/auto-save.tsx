import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

const { width: W } = Dimensions.get('window');

const TRIGGERS = [
  { id: 'weekly', label: 'Weekly', icon: 'date-range', desc: 'Every week on Monday' },
  { id: 'monthly', label: 'Monthly', icon: 'calendar-today', desc: '1st of every month' },
  { id: 'payday', label: 'On Payday', icon: 'payments', desc: 'When salary arrives' },
  { id: 'roundup', label: 'Round-Up', icon: 'add-circle-outline', desc: 'Round up each transaction' },
];

const AMOUNT_TYPES = [
  { id: 'fixed', label: 'Fixed Amount', icon: 'attach-money' },
  { id: 'percent', label: '% of Income', icon: 'percent' },
];

type Step = 'goal' | 'trigger' | 'amount' | 'wallet' | 'preview' | 'success';

const PROJECTION_MONTHS = 12;

export default function AutoSaveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { savings, wallets } = useWallet();
  const { colors } = useTheme();

  const [step, setStep] = useState<Step>('goal');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState('monthly');
  const [amountType, setAmountType] = useState('fixed');
  const [fixedAmount, setFixedAmount] = useState('200');
  const [percentage, setPercentage] = useState('10');
  const [selectedWallet, setSelectedWallet] = useState(0);

  const goal = savings.find(s => s.id === selectedGoal);
  const wallet = wallets[selectedWallet];

  const monthlySave = useMemo(() => {
    if (amountType === 'fixed') {
      const base = parseFloat(fixedAmount) || 0;
      if (selectedTrigger === 'weekly') return base * 4.33;
      return base;
    } else {
      return (wallet?.amount ?? 0) * ((parseFloat(percentage) || 0) / 100);
    }
  }, [amountType, fixedAmount, percentage, selectedTrigger, wallet]);

  const projectionData = useMemo(() => {
    if (!goal) return [];
    let accumulated = goal.currentAmount;
    return Array.from({ length: PROJECTION_MONTHS }, (_, i) => {
      accumulated = Math.min(accumulated + monthlySave, goal.targetAmount);
      return { month: i + 1, amount: accumulated };
    });
  }, [goal, monthlySave]);

  const reachMonth = useMemo(() => {
    if (!goal) return null;
    if (monthlySave <= 0) return null;
    const remaining = goal.targetAmount - goal.currentAmount;
    const months = Math.ceil(remaining / monthlySave);
    return months;
  }, [goal, monthlySave]);

  const maxProjection = goal ? goal.targetAmount : 1;

  const styles = makeStyles(colors);

  const handleNext = useCallback(() => {
    if (step === 'goal' && !selectedGoal) { showAlert('Select a Goal', 'Please choose a savings goal.'); return; }
    const steps: Step[] = ['goal', 'trigger', 'amount', 'wallet', 'preview', 'success'];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  }, [step, selectedGoal, showAlert]);

  const handleBack = useCallback(() => {
    const steps: Step[] = ['goal', 'trigger', 'amount', 'wallet', 'preview', 'success'];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
    else router.back();
  }, [step, router]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12}>
          <MaterialIcons name={step === 'goal' ? 'close' : 'arrow-back'} size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Auto-Save Rules</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Progress */}
      {step !== 'success' && (
        <View style={styles.stepProgress}>
          {(['goal', 'trigger', 'amount', 'wallet', 'preview'] as Step[]).map((s, i) => {
            const steps: Step[] = ['goal', 'trigger', 'amount', 'wallet', 'preview'];
            const current = steps.indexOf(step);
            const isDone = i < current;
            const isActive = i === current;
            return (
              <View key={s} style={styles.stepDotWrap}>
                <View style={[styles.stepDot, isActive && styles.stepDotActive, isDone && styles.stepDotDone]}>
                  {isDone && <MaterialIcons name="check" size={10} color={colors.textOnDark} />}
                </View>
                {i < 4 && <View style={[styles.stepLine, isDone && styles.stepLineDone]} />}
              </View>
            );
          })}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── STEP 1: Select Goal ── */}
        {step === 'goal' && (
          <>
            <Text style={styles.stepTitle}>Which goal to save for?</Text>
            {savings.map(s => {
              const pct = Math.min((s.currentAmount / s.targetAmount) * 100, 100);
              const isSelected = selectedGoal === s.id;
              return (
                <Pressable
                  key={s.id}
                  style={[styles.goalCard, isSelected && styles.goalCardActive]}
                  onPress={() => setSelectedGoal(s.id)}
                >
                  <View style={[styles.goalIcon, { backgroundColor: s.color + '22' }]}>
                    <MaterialIcons name={s.icon as any} size={22} color={s.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.goalTop}>
                      <Text style={styles.goalName}>{s.name}</Text>
                      <Text style={styles.goalPct}>{pct.toFixed(0)}%</Text>
                    </View>
                    <View style={styles.goalBar}>
                      <View style={[styles.goalBarFill, { width: `${pct}%` as any, backgroundColor: s.color }]} />
                    </View>
                    <Text style={styles.goalSub}>${s.currentAmount.toLocaleString()} / ${s.targetAmount.toLocaleString()}</Text>
                  </View>
                  {isSelected && <MaterialIcons name="check-circle" size={22} color={colors.primary} style={{ marginLeft: Spacing.sm }} />}
                </Pressable>
              );
            })}
          </>
        )}

        {/* ── STEP 2: Trigger ── */}
        {step === 'trigger' && (
          <>
            <Text style={styles.stepTitle}>When should we save?</Text>
            {TRIGGERS.map(t => (
              <Pressable
                key={t.id}
                style={[styles.optionRow, selectedTrigger === t.id && styles.optionRowActive]}
                onPress={() => setSelectedTrigger(t.id)}
              >
                <View style={[styles.optionIcon, { backgroundColor: selectedTrigger === t.id ? colors.primary + '22' : colors.background }]}>
                  <MaterialIcons name={t.icon as any} size={22} color={selectedTrigger === t.id ? colors.primary : colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{t.label}</Text>
                  <Text style={styles.optionSub}>{t.desc}</Text>
                </View>
                <MaterialIcons
                  name={selectedTrigger === t.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={22}
                  color={colors.primary}
                />
              </Pressable>
            ))}
          </>
        )}

        {/* ── STEP 3: Amount ── */}
        {step === 'amount' && (
          <>
            <Text style={styles.stepTitle}>How much to save?</Text>
            <View style={styles.amountTypeSwitcher}>
              {AMOUNT_TYPES.map(t => (
                <Pressable
                  key={t.id}
                  style={[styles.typeBtn, amountType === t.id && styles.typeBtnActive]}
                  onPress={() => setAmountType(t.id)}
                >
                  <MaterialIcons name={t.icon as any} size={16} color={amountType === t.id ? colors.textOnDark : colors.textSecondary} />
                  <Text style={[styles.typeBtnText, amountType === t.id && styles.typeBtnTextActive]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            {amountType === 'fixed' ? (
              <View style={styles.amountInputCard}>
                <Text style={styles.inputHint}>Save this amount each {selectedTrigger === 'weekly' ? 'week' : 'month'}</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.amountSymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={fixedAmount}
                    onChangeText={setFixedAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    accessibilityLabel="Auto-save amount"
                  />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
                  {['50', '100', '200', '500', '1000'].map(v => (
                    <Pressable
                      key={v}
                      style={[styles.quickChip, fixedAmount === v && styles.quickChipActive]}
                      onPress={() => setFixedAmount(v)}
                    >
                      <Text style={[styles.quickChipText, fixedAmount === v && styles.quickChipTextActive]}>${v}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.amountInputCard}>
                <Text style={styles.inputHint}>Save this % of incoming funds</Text>
                <View style={styles.amountRow}>
                  <TextInput
                    style={styles.amountInput}
                    value={percentage}
                    onChangeText={setPercentage}
                    keyboardType="decimal-pad"
                    placeholder="10"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    accessibilityLabel="Auto-save percentage"
                  />
                  <Text style={styles.amountSymbol}>%</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
                  {['5', '10', '15', '20', '25'].map(v => (
                    <Pressable
                      key={v}
                      style={[styles.quickChip, percentage === v && styles.quickChipActive]}
                      onPress={() => setPercentage(v)}
                    >
                      <Text style={[styles.quickChipText, percentage === v && styles.quickChipTextActive]}>{v}%</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {monthlySave > 0 && (
              <View style={styles.savingSummary}>
                <MaterialIcons name="info-outline" size={16} color={colors.primary} />
                <Text style={styles.savingSummaryText}>
                  You will save approx. <Text style={{ fontWeight: FontWeight.bold }}>${monthlySave.toFixed(0)}/month</Text>
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── STEP 4: Source Wallet ── */}
        {step === 'wallet' && (
          <>
            <Text style={styles.stepTitle}>Which wallet to save from?</Text>
            {wallets.map((w, i) => (
              <Pressable
                key={w.currency}
                style={[styles.optionRow, selectedWallet === i && styles.optionRowActive]}
                onPress={() => setSelectedWallet(i)}
              >
                <View style={[styles.walletBadge, { backgroundColor: colors.primary + '22' }]}>
                  <Text style={styles.walletBadgeText}>{w.currency.slice(0, 1)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{w.currency} Wallet</Text>
                  <Text style={styles.optionSub}>{w.symbol}{w.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} available</Text>
                </View>
                <MaterialIcons
                  name={selectedWallet === i ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={22}
                  color={colors.primary}
                />
              </Pressable>
            ))}
          </>
        )}

        {/* ── STEP 5: Preview ── */}
        {step === 'preview' && goal && (
          <>
            <Text style={styles.stepTitle}>Your Savings Plan</Text>

            {/* Summary Card */}
            <View style={styles.summaryCard}>
              {[
                { label: 'Goal', value: goal.name },
                { label: 'Trigger', value: TRIGGERS.find(t => t.id === selectedTrigger)?.label ?? '' },
                { label: 'Amount', value: amountType === 'fixed' ? `$${fixedAmount}` : `${percentage}% of income` },
                { label: 'Monthly Saving', value: `~$${monthlySave.toFixed(0)}` },
                { label: 'Source Wallet', value: `${wallet.currency} Wallet` },
                { label: 'Goal Reached In', value: reachMonth ? `~${reachMonth} months` : 'Calculating…' },
              ].map((row, i, arr) => (
                <React.Fragment key={row.label}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{row.label}</Text>
                    <Text style={[styles.summaryValue, row.label === 'Goal Reached In' && { color: colors.success }]}>{row.value}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>

            {/* Projection Chart */}
            <Text style={styles.chartTitle}>12-Month Projection</Text>
            <View style={styles.projectionChart}>
              {projectionData.map((d, i) => {
                const barH = Math.max(4, (d.amount / maxProjection) * 100);
                const isGoalMet = d.amount >= goal.targetAmount;
                return (
                  <View key={i} style={styles.projBar}>
                    <View style={[styles.projBarFill, {
                      height: barH,
                      backgroundColor: isGoalMet ? colors.success : colors.primary,
                    }]} />
                    {(i + 1) % 3 === 0 && <Text style={styles.projLabel}>M{i + 1}</Text>}
                  </View>
                );
              })}
            </View>
            <View style={styles.projLegend}>
              <View style={[styles.projLegendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.projLegendText}>Progress</Text>
              <View style={[styles.projLegendDot, { backgroundColor: colors.success, marginLeft: Spacing.md }]} />
              <Text style={styles.projLegendText}>Goal Reached</Text>
            </View>

            {reachMonth && (
              <View style={styles.achieveBanner}>
                <MaterialIcons name="emoji-events" size={20} color={colors.warning} />
                <Text style={styles.achieveText}>
                  You could reach <Text style={{ fontWeight: FontWeight.bold }}>{goal.name}</Text> in{' '}
                  <Text style={{ fontWeight: FontWeight.bold }}>{reachMonth} month{reachMonth > 1 ? 's' : ''}</Text>!
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── STEP 6: Success ── */}
        {step === 'success' && goal && (
          <View style={styles.successWrap}>
            <View style={styles.successCircle}>
              <MaterialIcons name="autorenew" size={44} color={colors.textOnDark} />
            </View>
            <Text style={styles.successTitle}>Auto-Save Activated!</Text>
            <Text style={styles.successSub}>
              {amountType === 'fixed' ? `$${fixedAmount}` : `${percentage}% of income`} will be saved {selectedTrigger === 'weekly' ? 'every week' : selectedTrigger === 'payday' ? 'on payday' : 'monthly'} to your{' '}
              <Text style={{ fontWeight: FontWeight.bold }}>{goal.name}</Text> goal.
            </Text>
            {reachMonth && (
              <View style={styles.successPill}>
                <MaterialIcons name="flag" size={14} color={colors.primary} />
                <Text style={styles.successPillText}>Goal in ~{reachMonth} months</Text>
              </View>
            )}
            <Pressable style={[styles.primaryBtn, { marginTop: Spacing.xl }]} onPress={() => router.back()}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Continue Button */}
      {step !== 'success' && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
          <Pressable style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryBtnText}>
              {step === 'preview' ? 'Activate Auto-Save' : 'Continue'}
            </Text>
            {step !== 'preview' && <MaterialIcons name="arrow-forward" size={20} color={colors.textOnDark} />}
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
    headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: colors.textPrimary },
    stepProgress: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.base,
    },
    stepDotWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    stepDot: {
      width: 22, height: 22, borderRadius: 11, backgroundColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    stepDotActive: { backgroundColor: colors.primary },
    stepDotDone: { backgroundColor: colors.success },
    stepLine: { flex: 1, height: 2, backgroundColor: colors.border },
    stepLineDone: { backgroundColor: colors.success },
    content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
    stepTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.lg, marginTop: Spacing.xs },
    goalCard: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.sm, borderWidth: 1.5, borderColor: 'transparent', ...Shadow.sm,
    },
    goalCardActive: { borderColor: colors.primary },
    goalIcon: { width: 48, height: 48, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center' },
    goalTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    goalName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    goalPct: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.primary },
    goalBar: { height: 4, backgroundColor: colors.background, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
    goalBarFill: { height: '100%', borderRadius: 2 },
    goalSub: { fontSize: FontSize.xs, color: colors.textMuted },
    optionRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.sm, borderWidth: 1.5, borderColor: 'transparent', ...Shadow.sm,
    },
    optionRowActive: { borderColor: colors.primary },
    optionIcon: { width: 48, height: 48, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center' },
    optionLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    optionSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    amountTypeSwitcher: {
      flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md,
    },
    typeBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
      backgroundColor: colors.surface, borderRadius: Radius.lg, paddingVertical: Spacing.md,
      borderWidth: 1, borderColor: colors.border,
    },
    typeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    typeBtnTextActive: { color: colors.textOnDark },
    amountInputCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    inputHint: { fontSize: FontSize.sm, color: colors.textMuted, marginBottom: Spacing.sm },
    amountRow: { flexDirection: 'row', alignItems: 'center' },
    amountSymbol: { fontSize: 38, fontWeight: FontWeight.bold, color: colors.textPrimary, marginRight: 4 },
    amountInput: { flex: 1, fontSize: 38, fontWeight: FontWeight.bold, color: colors.textPrimary, includeFontPadding: false },
    quickChip: {
      paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill,
      backgroundColor: colors.background, marginRight: Spacing.sm, borderWidth: 1, borderColor: colors.border,
    },
    quickChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    quickChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    quickChipTextActive: { color: colors.textOnDark },
    savingSummary: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.cardMint, borderRadius: Radius.lg, padding: Spacing.md,
      borderWidth: 1, borderColor: colors.border,
    },
    savingSummaryText: { fontSize: FontSize.sm, color: colors.textSecondary, flex: 1 },
    walletBadge: {
      width: 48, height: 48, borderRadius: Radius.circle,
      alignItems: 'center', justifyContent: 'center',
    },
    walletBadgeText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: colors.primary },
    summaryCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl,
      marginBottom: Spacing.md, ...Shadow.sm, overflow: 'hidden',
    },
    summaryRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    },
    summaryLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    summaryValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textPrimary },
    divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: Spacing.base },
    chartTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.md },
    projectionChart: {
      flexDirection: 'row', alignItems: 'flex-end', height: 110,
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.md,
      paddingBottom: 24, gap: 2, marginBottom: Spacing.sm, ...Shadow.sm,
    },
    projBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    projBarFill: { width: '70%', borderRadius: 3, minHeight: 4 },
    projLabel: { fontSize: 9, color: colors.textMuted, marginTop: 4 },
    projLegend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md },
    projLegendDot: { width: 8, height: 8, borderRadius: 4 },
    projLegendText: { fontSize: FontSize.xs, color: colors.textMuted },
    achieveBanner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.warningBg, borderRadius: Radius.lg, padding: Spacing.md,
      borderWidth: 1, borderColor: colors.warning + '44',
    },
    achieveText: { flex: 1, fontSize: FontSize.sm, color: colors.textSecondary, lineHeight: 18 },
    successWrap: { alignItems: 'center', paddingVertical: Spacing.xxxl },
    successCircle: {
      width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, ...Shadow.lg,
    },
    successTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.sm },
    successSub: { fontSize: FontSize.base, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.base },
    successPill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.cardMint, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 7,
      borderWidth: 1, borderColor: colors.border,
    },
    successPillText: { fontSize: FontSize.sm, color: colors.primary, fontWeight: FontWeight.semibold },
    footer: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.divider },
    primaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      backgroundColor: colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg, ...Shadow.md,
    },
    primaryBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textOnDark },
  });
}
