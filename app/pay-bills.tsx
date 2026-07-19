import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

// ── Types ──────────────────────────────────────────────────────────────
interface BillCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface BillProvider {
  id: string;
  name: string;
  icon: string;
  category: string;
  color: string;
  accountMask?: string;
}

// ── Data ───────────────────────────────────────────────────────────────
const CATEGORIES: BillCategory[] = [
  { id: 'all', label: 'All', icon: 'apps', color: Colors.primary },
  { id: 'utilities', label: 'Utilities', icon: 'bolt', color: '#F59E0B' },
  { id: 'internet', label: 'Internet', icon: 'wifi', color: Colors.info },
  { id: 'mobile', label: 'Mobile', icon: 'smartphone', color: Colors.success },
  { id: 'tv', label: 'TV & Media', icon: 'tv', color: '#8B5CF6' },
  { id: 'rent', label: 'Rent', icon: 'home', color: '#EC4899' },
  { id: 'insurance', label: 'Insurance', icon: 'security', color: '#14B8A6' },
  { id: 'water', label: 'Water', icon: 'water-drop', color: '#3B82F6' },
];

const PROVIDERS: BillProvider[] = [
  { id: 'pg_electric', name: 'Pacific Gas & Electric', icon: 'bolt', category: 'utilities', color: '#F59E0B' },
  { id: 'con_electric', name: 'ConEdison', icon: 'bolt', category: 'utilities', color: '#EF4444' },
  { id: 'duke_energy', name: 'Duke Energy', icon: 'bolt', category: 'utilities', color: '#F97316' },
  { id: 'comcast', name: 'Comcast Xfinity', icon: 'wifi', category: 'internet', color: Colors.info },
  { id: 'att_internet', name: 'AT&T Internet', icon: 'wifi', category: 'internet', color: '#1D4ED8' },
  { id: 'verizon_home', name: 'Verizon Fios', icon: 'wifi', category: 'internet', color: '#EF4444' },
  { id: 'tmobile', name: 'T-Mobile', icon: 'smartphone', category: 'mobile', color: '#E5007D' },
  { id: 'att_mobile', name: 'AT&T Mobile', icon: 'smartphone', category: 'mobile', color: '#1D4ED8' },
  { id: 'verizon_mobile', name: 'Verizon Wireless', icon: 'smartphone', category: 'mobile', color: '#EF4444' },
  { id: 'netflix', name: 'Netflix', icon: 'tv', category: 'tv', color: '#E50914' },
  { id: 'hulu', name: 'Hulu', icon: 'tv', category: 'tv', color: '#1CE783' },
  { id: 'youtube_tv', name: 'YouTube TV', icon: 'play-circle', category: 'tv', color: '#FF0000' },
  { id: 'rent_generic', name: 'Rent Payment', icon: 'home', category: 'rent', color: '#EC4899' },
  { id: 'mortgage', name: 'Mortgage', icon: 'account-balance', category: 'rent', color: '#7C3AED' },
  { id: 'geico', name: 'GEICO Insurance', icon: 'security', category: 'insurance', color: '#14B8A6' },
  { id: 'water_generic', name: 'Water Utility', icon: 'water-drop', category: 'water', color: '#3B82F6' },
];

type Step = 'category' | 'provider' | 'details' | 'confirm' | 'success';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PayBillsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { activeWallet, addTransaction } = useWallet();

  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState<BillProvider | null>(null);
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Generate next 30 days for scheduling
  const scheduleDates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      label: `${MONTHS[d.getMonth()]} ${d.getDate()}`,
      value: d.toISOString().split('T')[0],
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
    };
  });

  const filteredProviders = selectedCategory === 'all'
    ? PROVIDERS
    : PROVIDERS.filter(p => p.category === selectedCategory);

  const handleSelectProvider = useCallback((provider: BillProvider) => {
    setSelectedProvider(provider);
    setStep('details');
  }, []);

  const handleDetails = useCallback(() => {
    if (!reference.trim()) { showAlert('Required', 'Enter your account or reference number.'); return; }
    if (!amount || parseFloat(amount) <= 0) { showAlert('Invalid Amount', 'Enter a valid payment amount.'); return; }
    if (parseFloat(amount) > activeWallet.amount) {
      showAlert('Insufficient Funds', `Your balance is ${activeWallet.symbol}${activeWallet.amount.toLocaleString()}.`);
      return;
    }
    setStep('confirm');
  }, [reference, amount, activeWallet, showAlert]);

  const handlePay = useCallback(async () => {
    if (!selectedProvider) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    await addTransaction({
      type: 'bill',
      title: `${selectedProvider.name}`,
      subtitle: isScheduled ? `Scheduled · ${scheduledDate}` : 'Paid instantly',
      amount: -parseFloat(amount),
      currency: activeWallet.currency,
      status: isScheduled ? 'pending' : 'completed',
      icon: selectedProvider.icon,
      category: 'Bills',
    });
    setLoading(false);
    setStep('success');
  }, [selectedProvider, amount, isScheduled, scheduledDate, activeWallet, addTransaction]);

  const stepBack = () => {
    if (step === 'details') setStep('provider');
    else if (step === 'provider') setStep('category');
    else if (step === 'confirm') setStep('details');
    else router.back();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      {step !== 'success' && (
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={stepBack} hitSlop={12}>
            <MaterialIcons name={step === 'category' ? 'close' : 'arrow-back'} size={22} color={Colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Pay Bills</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* ── STEP 1: Category ── */}
        {step === 'category' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.stepTitle}>What type of bill?</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat.id}
                  style={[styles.categoryCard, selectedCategory === cat.id && styles.categoryCardActive]}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setStep('provider');
                  }}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: cat.color + '22' }]}>
                    <MaterialIcons name={cat.icon as any} size={26} color={cat.color} />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Recent Bills */}
            <Text style={styles.sectionTitle}>Recent Bills</Text>
            {PROVIDERS.slice(0, 3).map(p => (
              <Pressable
                key={p.id}
                style={styles.recentRow}
                onPress={() => { setSelectedProvider(p); setStep('details'); }}
              >
                <View style={[styles.recentIcon, { backgroundColor: p.color + '22' }]}>
                  <MaterialIcons name={p.icon as any} size={20} color={p.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentName}>{p.name}</Text>
                  <Text style={styles.recentMeta}>Due in 5 days · Est. $85.00</Text>
                </View>
                <Pressable
                  style={styles.quickPayBtn}
                  onPress={() => { setSelectedProvider(p); setStep('details'); }}
                >
                  <Text style={styles.quickPayText}>Pay</Text>
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── STEP 2: Provider ── */}
        {step === 'provider' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.stepTitle}>Choose provider</Text>
            {/* Category Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
              {CATEGORIES.map(cat => (
                <Pressable
                  key={cat.id}
                  style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.catChipText, selectedCategory === cat.id && styles.catChipTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.providerGrid}>
              {filteredProviders.map(p => (
                <Pressable
                  key={p.id}
                  style={styles.providerCard}
                  onPress={() => handleSelectProvider(p)}
                >
                  <View style={[styles.providerIcon, { backgroundColor: p.color + '22' }]}>
                    <MaterialIcons name={p.icon as any} size={28} color={p.color} />
                  </View>
                  <Text style={styles.providerName} numberOfLines={2}>{p.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ── STEP 3: Details ── */}
        {step === 'details' && selectedProvider && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Provider Summary */}
            <View style={styles.providerSummary}>
              <View style={[styles.providerSummaryIcon, { backgroundColor: selectedProvider.color + '22' }]}>
                <MaterialIcons name={selectedProvider.icon as any} size={28} color={selectedProvider.color} />
              </View>
              <View>
                <Text style={styles.providerSummaryName}>{selectedProvider.name}</Text>
                <Text style={styles.providerSummaryCategory}>
                  {CATEGORIES.find(c => c.id === selectedProvider.category)?.label ?? 'Bill'}
                </Text>
              </View>
            </View>

            {/* Account Reference */}
            <Text style={styles.inputLabel}>Account / Reference Number *</Text>
            <View style={styles.inputWrap}>
              <MaterialIcons name="tag" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                value={reference}
                onChangeText={setReference}
                placeholder="e.g. ACC-123456789"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                accessibilityLabel="Account reference"
              />
            </View>

            {/* Amount */}
            <Text style={styles.inputLabel}>Payment Amount</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputCurrency}>{activeWallet.symbol}</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
                accessibilityLabel="Payment amount"
              />
            </View>
            {/* Quick Amounts */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
              {['50', '100', '150', '200', '500'].map(v => (
                <Pressable
                  key={v}
                  style={[styles.quickChip, amount === v && styles.quickChipActive]}
                  onPress={() => setAmount(v)}
                >
                  <Text style={[styles.quickChipText, amount === v && styles.quickChipTextActive]}>
                    {activeWallet.symbol}{v}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Schedule Payment Toggle */}
            <View style={styles.scheduleToggleRow}>
              <MaterialIcons name="schedule" size={20} color={Colors.primary} />
              <Text style={styles.scheduleToggleLabel}>Schedule for later</Text>
              <Pressable
                style={[styles.toggleSwitch, isScheduled && styles.toggleSwitchOn]}
                onPress={() => { setIsScheduled(v => !v); setShowDatePicker(true); }}
              >
                <View style={[styles.toggleThumb, isScheduled && styles.toggleThumbOn]} />
              </Pressable>
            </View>

            {/* Date Picker */}
            {isScheduled && (
              <View>
                <Text style={styles.inputLabel}>Payment Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datePicker}>
                  {scheduleDates.map(d => (
                    <Pressable
                      key={d.value}
                      style={[styles.dateCard, scheduledDate === d.value && styles.dateCardActive]}
                      onPress={() => setScheduledDate(d.value)}
                    >
                      <Text style={[styles.dateDayName, scheduledDate === d.value && { color: Colors.textOnDark }]}>
                        {d.dayName}
                      </Text>
                      <Text style={[styles.dateLabel, scheduledDate === d.value && { color: Colors.textOnDark }]}>
                        {d.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <Pressable style={styles.continueBtn} onPress={handleDetails}>
              <Text style={styles.continueBtnText}>Review Payment</Text>
              <MaterialIcons name="arrow-forward" size={20} color={Colors.textOnDark} />
            </Pressable>
          </ScrollView>
        )}

        {/* ── STEP 4: Confirm ── */}
        {step === 'confirm' && selectedProvider && (
          <View style={styles.content}>
            <Text style={styles.stepTitle}>Confirm Payment</Text>
            <View style={styles.confirmCard}>
              {[
                { label: 'Provider', value: selectedProvider.name },
                { label: 'Account Ref', value: reference },
                { label: 'Amount', value: `${activeWallet.symbol}${parseFloat(amount).toFixed(2)}` },
                { label: isScheduled ? 'Scheduled Date' : 'Payment', value: isScheduled ? scheduledDate : 'Instant' },
                { label: 'From Wallet', value: `${activeWallet.currency} Wallet` },
                { label: 'Fee', value: 'Free' },
              ].map((row, i) => (
                <View key={row.label}>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>{row.label}</Text>
                    <Text style={[styles.confirmValue, row.label === 'Amount' && styles.confirmValueBig]}>
                      {row.value}
                    </Text>
                  </View>
                  {i < 5 && <View style={styles.confirmDivider} />}
                </View>
              ))}
            </View>

            {isScheduled && (
              <View style={styles.scheduleBanner}>
                <MaterialIcons name="event" size={18} color={Colors.primary} />
                <Text style={styles.scheduleBannerText}>
                  Payment will be automatically processed on {scheduledDate}
                </Text>
              </View>
            )}

            <Pressable
              style={[styles.continueBtn, loading && { opacity: 0.7 }]}
              onPress={handlePay}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Colors.textOnDark} /> : (
                <>
                  <MaterialIcons name={isScheduled ? 'event' : 'payment'} size={20} color={Colors.textOnDark} />
                  <Text style={styles.continueBtnText}>{isScheduled ? 'Schedule Payment' : 'Pay Now'}</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* ── STEP 5: Success ── */}
        {step === 'success' && selectedProvider && (
          <View style={styles.successContent}>
            <View style={styles.successCircle}>
              <MaterialIcons name="check" size={52} color={Colors.textOnDark} />
            </View>
            <Text style={styles.successTitle}>
              {isScheduled ? 'Payment Scheduled!' : 'Payment Sent!'}
            </Text>
            <Text style={styles.successSub}>
              {activeWallet.symbol}{parseFloat(amount).toFixed(2)} to {selectedProvider.name}
            </Text>
            {isScheduled && (
              <View style={styles.schedulePill}>
                <MaterialIcons name="schedule" size={14} color={Colors.primary} />
                <Text style={styles.schedulePillText}>Scheduled for {scheduledDate}</Text>
              </View>
            )}
            <View style={styles.receiptCard}>
              <Text style={styles.receiptTitle}>Receipt</Text>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Reference</Text>
                <Text style={styles.receiptValue}>ORB{Date.now().toString().slice(-8)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Status</Text>
                <Text style={[styles.receiptValue, { color: Colors.success }]}>
                  {isScheduled ? 'Scheduled' : 'Completed'}
                </Text>
              </View>
            </View>
            <Pressable style={styles.continueBtn} onPress={() => router.back()}>
              <Text style={styles.continueBtnText}>Done</Text>
            </Pressable>
          </View>
        )}

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
  stepTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg, marginTop: Spacing.sm },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  categoryCard: {
    width: '22%', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.md, ...Shadow.sm, borderWidth: 1.5, borderColor: 'transparent',
  },
  categoryCardActive: { borderColor: Colors.primary },
  categoryIcon: { width: 52, height: 52, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  categoryLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'center' },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  recentIcon: { width: 44, height: 44, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  recentName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  recentMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  quickPayBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.base, paddingVertical: 7,
  },
  quickPayText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  catChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.pill,
    backgroundColor: Colors.surface, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  catChipTextActive: { color: Colors.textOnDark },
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  providerCard: {
    width: '30%', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.md, ...Shadow.sm,
  },
  providerIcon: { width: 56, height: 56, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  providerName: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'center' },
  providerSummary: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
    marginBottom: Spacing.base, ...Shadow.sm,
  },
  providerSummaryIcon: { width: 56, height: 56, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center' },
  providerSummaryName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  providerSummaryCategory: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  inputLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  input: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, includeFontPadding: false },
  inputCurrency: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  amountInput: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  quickChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill,
    backgroundColor: Colors.surface, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  quickChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  quickChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  quickChipTextActive: { color: Colors.textOnDark },
  scheduleToggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.base,
    marginVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  scheduleToggleLabel: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  toggleSwitch: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.border,
    justifyContent: 'center', padding: 2,
  },
  toggleSwitchOn: { backgroundColor: Colors.primary },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.surface },
  toggleThumbOn: { alignSelf: 'flex-end' },
  datePicker: { marginBottom: Spacing.base },
  dateCard: {
    width: 68, height: 72, borderRadius: Radius.lg, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  dateCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateDayName: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  dateLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 4 },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg,
    marginTop: Spacing.base, ...Shadow.md,
  },
  continueBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  confirmCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.base, ...Shadow.sm },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  confirmLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  confirmValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  confirmValueBig: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  confirmDivider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: Spacing.base },
  scheduleBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.cardMint, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border,
  },
  scheduleBannerText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  successContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  successCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, ...Shadow.lg,
  },
  successTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  successSub: { fontSize: FontSize.base, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.md },
  schedulePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.cardMint, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 6,
    marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border,
  },
  schedulePillText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  receiptCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    width: '100%', marginBottom: Spacing.xl, ...Shadow.sm,
  },
  receiptTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.md },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  receiptLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  receiptValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
});
