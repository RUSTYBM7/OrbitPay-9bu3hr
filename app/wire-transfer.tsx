import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

type Step = 'country' | 'account' | 'amount' | 'review' | 'success';
type NetworkType = 'SWIFT' | 'SEPA' | 'LOCAL';

interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  network: NetworkType;
  arrivalDays: string;
  feeFlat: number;
  feePct: number;
}

const COUNTRIES: Country[] = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£', network: 'SWIFT', arrivalDays: '1-2', feeFlat: 5, feePct: 0.005 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', currencySymbol: '€', network: 'SEPA', arrivalDays: '1', feeFlat: 0, feePct: 0.003 },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', currencySymbol: '€', network: 'SEPA', arrivalDays: '1', feeFlat: 0, feePct: 0.003 },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', currencySymbol: '₦', network: 'SWIFT', arrivalDays: '2-3', feeFlat: 15, feePct: 0.01 },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', currency: 'GHS', currencySymbol: 'GH₵', network: 'SWIFT', arrivalDays: '2-3', feeFlat: 12, feePct: 0.01 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', currencySymbol: 'CA$', network: 'SWIFT', arrivalDays: '1-2', feeFlat: 8, feePct: 0.005 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', currencySymbol: '¥', network: 'SWIFT', arrivalDays: '2-3', feeFlat: 10, feePct: 0.007 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', currencySymbol: 'A$', network: 'SWIFT', arrivalDays: '1-2', feeFlat: 8, feePct: 0.005 },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹', network: 'SWIFT', arrivalDays: '1-2', feeFlat: 5, feePct: 0.005 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', currencySymbol: 'R$', network: 'LOCAL', arrivalDays: 'Same day', feeFlat: 3, feePct: 0.004 },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', currencySymbol: 'MX$', network: 'LOCAL', arrivalDays: 'Same day', feeFlat: 3, feePct: 0.004 },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', currencySymbol: 'R', network: 'SWIFT', arrivalDays: '2-3', feeFlat: 12, feePct: 0.008 },
];

const PURPOSES = [
  'Family Support', 'Business Payment', 'Invoice Settlement',
  'Property Purchase', 'Educational Fees', 'Medical Expenses', 'Other',
];

const FX_RATES: Record<string, number> = {
  GBP: 0.79, EUR: 0.92, NGN: 1580, GHS: 15.2, CAD: 1.36,
  JPY: 157.8, AUD: 1.52, INR: 83.4, BRL: 5.12, MXN: 17.3, ZAR: 18.6,
};

const NETWORK_COLORS: Record<NetworkType, string> = {
  SWIFT: '#627EEA',
  SEPA: '#27AE60',
  LOCAL: '#F59E0B',
};

const NETWORK_ICONS: Record<NetworkType, string> = {
  SWIFT: 'public',
  SEPA: 'euro',
  LOCAL: 'location-on',
};

export default function WireTransferScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const { activeWallet, addTransaction } = useWallet();

  const [step, setStep] = useState<Step>('country');
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [bankName, setBankName] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingRef, setTrackingRef] = useState('');

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.currency.toLowerCase().includes(q));
  }, [search]);

  const fxRate = selectedCountry ? (FX_RATES[selectedCountry.currency] ?? 1) : 1;
  const usdAmount = parseFloat(amount) || 0;
  const destAmount = usdAmount * fxRate;
  const feeFlat = selectedCountry?.feeFlat ?? 0;
  const feePct = selectedCountry ? usdAmount * selectedCountry.feePct : 0;
  const totalFee = feeFlat + feePct;
  const totalDeducted = usdAmount + totalFee;

  const handleSend = useCallback(async () => {
    if (!selectedCountry || !usdAmount) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1600));
    const ref = `ORB-WIRE-${Date.now().toString().slice(-8)}`;
    setTrackingRef(ref);
    await addTransaction({
      type: 'send',
      title: `Wire to ${selectedCountry.name}`,
      subtitle: `${beneficiaryName} · ${selectedCountry.network}`,
      amount: -totalDeducted,
      currency: 'USD',
      status: 'pending',
      icon: 'public',
      category: 'Transfer',
    });
    setLoading(false);
    setStep('success');
  }, [selectedCountry, usdAmount, totalDeducted, beneficiaryName, addTransaction]);

  const stepBack = useCallback(() => {
    if (step === 'account') setStep('country');
    else if (step === 'amount') setStep('account');
    else if (step === 'review') setStep('amount');
    else router.back();
  }, [step, router]);

  const styles = makeStyles(colors);

  const STEPS: Step[] = ['country', 'account', 'amount', 'review'];
  const stepIdx = STEPS.indexOf(step);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {step !== 'success' && (
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={stepBack} hitSlop={12}>
            <MaterialIcons name={step === 'country' ? 'close' : 'arrow-back'} size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>International Wire</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      {/* Step Progress */}
      {step !== 'success' && (
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, i <= stepIdx && styles.stepDotActive]} />
              {i < STEPS.length - 1 && <View style={[styles.stepLine, i < stepIdx && styles.stepLineDone]} />}
            </React.Fragment>
          ))}
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* ── STEP 1: Country ── */}
        {step === 'country' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.stepTitle}>Where are you sending?</Text>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search country or currency…"
                placeholderTextColor={colors.textMuted}
                autoFocus
                accessibilityLabel="Country search"
              />
            </View>

            {filteredCountries.map(country => {
              const netColor = NETWORK_COLORS[country.network];
              const netIcon = NETWORK_ICONS[country.network];
              return (
                <Pressable
                  key={country.code}
                  style={({ pressed }) => [styles.countryRow, pressed && { opacity: 0.8 }]}
                  onPress={() => { setSelectedCountry(country); setStep('account'); }}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <View style={styles.countryInfo}>
                    <Text style={styles.countryName}>{country.name}</Text>
                    <Text style={styles.countryCurrency}>{country.currency} · {country.currencySymbol}</Text>
                  </View>
                  <View style={styles.countryRight}>
                    <View style={[styles.networkBadge, { backgroundColor: netColor + '22' }]}>
                      <MaterialIcons name={netIcon as any} size={10} color={netColor} />
                      <Text style={[styles.networkBadgeText, { color: netColor }]}>{country.network}</Text>
                    </View>
                    <Text style={styles.arrivalText}>{country.arrivalDays} day{country.arrivalDays !== '1' && country.arrivalDays !== 'Same day' ? 's' : ''}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* ── STEP 2: Account Details ── */}
        {step === 'account' && selectedCountry && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Destination Banner */}
            <View style={styles.destBanner}>
              <Text style={styles.destFlag}>{selectedCountry.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.destName}>{selectedCountry.name}</Text>
                <Text style={styles.destCurrency}>{selectedCountry.currency} · {selectedCountry.network} Network</Text>
              </View>
              <View style={[styles.networkBadge, { backgroundColor: NETWORK_COLORS[selectedCountry.network] + '22' }]}>
                <Text style={[styles.networkBadgeText, { color: NETWORK_COLORS[selectedCountry.network] }]}>
                  {selectedCountry.network}
                </Text>
              </View>
            </View>

            {/* Fields */}
            {[
              { label: 'Beneficiary Name *', value: beneficiaryName, onChange: setBeneficiaryName, placeholder: 'Full legal name', icon: 'person' },
              { label: 'Bank Name', value: bankName, onChange: setBankName, placeholder: 'Receiving bank name', icon: 'account-balance' },
              {
                label: selectedCountry.network === 'SEPA' ? 'IBAN *' : 'Account Number *',
                value: accountNumber, onChange: setAccountNumber,
                placeholder: selectedCountry.network === 'SEPA' ? 'DE89370400440532013000' : 'Enter account number', icon: 'tag'
              },
              ...(selectedCountry.network === 'SWIFT' ? [{ label: 'SWIFT / BIC Code *', value: swiftCode, onChange: setSwiftCode, placeholder: 'e.g. BARCGB22', icon: 'vpn-key' }] : []),
              ...(selectedCountry.network === 'LOCAL' ? [{ label: 'Routing Number', value: routingNumber, onChange: setRoutingNumber, placeholder: '9-digit routing number', icon: 'route' }] : []),
            ].map(field => (
              <View key={field.label}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <View style={styles.inputWrap}>
                  <MaterialIcons name={field.icon as any} size={18} color={colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    accessibilityLabel={field.label}
                  />
                </View>
              </View>
            ))}

            <Pressable
              style={[styles.primaryBtn, (!beneficiaryName || !accountNumber) && { opacity: 0.5 }]}
              onPress={() => {
                if (!beneficiaryName.trim()) { showAlert('Required', 'Enter the beneficiary name.'); return; }
                if (!accountNumber.trim()) { showAlert('Required', 'Enter the account or IBAN number.'); return; }
                if (selectedCountry.network === 'SWIFT' && !swiftCode.trim()) { showAlert('Required', 'Enter the SWIFT/BIC code.'); return; }
                setStep('amount');
              }}
              disabled={!beneficiaryName || !accountNumber}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.textOnDark} />
            </Pressable>
          </ScrollView>
        )}

        {/* ── STEP 3: Amount ── */}
        {step === 'amount' && selectedCountry && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.stepTitle}>How much to send?</Text>

            {/* Live FX Card */}
            <View style={styles.fxCard}>
              <View style={styles.fxRow}>
                <View style={styles.fxFlag}><Text style={{ fontSize: 20 }}>🇺🇸</Text></View>
                <Text style={styles.fxCurrencyLabel}>USD</Text>
                <View style={styles.fxArrow}>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.textMuted} />
                </View>
                <View style={styles.fxFlag}><Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text></View>
                <Text style={styles.fxCurrencyLabel}>{selectedCountry.currency}</Text>
              </View>
              <View style={styles.fxRateRow}>
                <Text style={styles.fxRateText}>1 USD = {fxRate.toLocaleString()} {selectedCountry.currency}</Text>
                <View style={[styles.networkBadge, { backgroundColor: NETWORK_COLORS[selectedCountry.network] + '22' }]}>
                  <Text style={[styles.networkBadgeText, { color: NETWORK_COLORS[selectedCountry.network] }]}>
                    {selectedCountry.network}
                  </Text>
                </View>
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.amountCard}>
              <Text style={styles.inputLabel}>Amount (USD)</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountSymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  accessibilityLabel="Wire transfer amount"
                />
              </View>
              {usdAmount > 0 && (
                <View style={styles.convertRow}>
                  <MaterialIcons name="swap-horiz" size={16} color={colors.textMuted} />
                  <Text style={styles.convertText}>
                    Recipient gets ≈ {selectedCountry.currencySymbol}{destAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} {selectedCountry.currency}
                  </Text>
                </View>
              )}
              {/* Quick amounts */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
                {['100', '250', '500', '1000', '2500', '5000'].map(v => (
                  <Pressable
                    key={v}
                    style={[styles.quickChip, amount === v && styles.quickChipActive]}
                    onPress={() => setAmount(v)}
                  >
                    <Text style={[styles.quickChipText, amount === v && styles.quickChipTextActive]}>${v}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Fee Breakdown */}
            {usdAmount > 0 && (
              <View style={styles.feeCard}>
                <Text style={styles.feeTitle}>Fee Breakdown</Text>
                {[
                  { label: 'Transfer Amount', value: `$${usdAmount.toFixed(2)}` },
                  { label: `Flat Fee (${selectedCountry.network})`, value: `$${feeFlat.toFixed(2)}` },
                  { label: `Processing (${(selectedCountry.feePct * 100).toFixed(1)}%)`, value: `$${feePct.toFixed(2)}` },
                  { label: 'Total Fees', value: `$${totalFee.toFixed(2)}` },
                  { label: 'Total Deducted', value: `$${totalDeducted.toFixed(2)}`, highlight: true },
                ].map((row, i) => (
                  <React.Fragment key={row.label}>
                    {i === 4 && <View style={[styles.feeDivider, { backgroundColor: colors.divider }]} />}
                    <View style={styles.feeRow}>
                      <Text style={[styles.feeLabel, row.highlight && { color: colors.textPrimary, fontWeight: FontWeight.bold }]}>
                        {row.label}
                      </Text>
                      <Text style={[styles.feeValue, row.highlight && { color: colors.error, fontWeight: FontWeight.bold }]}>
                        {row.value}
                      </Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}

            {/* Arrival Time */}
            <View style={[styles.arrivalCard, { backgroundColor: NETWORK_COLORS[selectedCountry.network] + '18', borderColor: NETWORK_COLORS[selectedCountry.network] + '44' }]}>
              <MaterialIcons name="schedule" size={18} color={NETWORK_COLORS[selectedCountry.network]} />
              <Text style={[styles.arrivalText2, { color: NETWORK_COLORS[selectedCountry.network] }]}>
                Estimated arrival: <Text style={{ fontWeight: FontWeight.bold }}>
                  {selectedCountry.arrivalDays} {selectedCountry.arrivalDays === 'Same day' ? '' : 'business day' + (selectedCountry.arrivalDays !== '1' ? 's' : '')}
                </Text>
              </Text>
            </View>

            {/* Purpose */}
            <Text style={styles.inputLabel}>Purpose of Transfer</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
              {PURPOSES.map(p => (
                <Pressable
                  key={p}
                  style={[styles.quickChip, purpose === p && styles.quickChipActive, { marginRight: Spacing.sm }]}
                  onPress={() => setPurpose(p)}
                >
                  <Text style={[styles.quickChipText, purpose === p && styles.quickChipTextActive]}>{p}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={[styles.primaryBtn, (!usdAmount || usdAmount <= 0) && { opacity: 0.5 }]}
              onPress={() => {
                if (!usdAmount || usdAmount <= 0) { showAlert('Enter Amount', 'Please enter a valid amount.'); return; }
                if (totalDeducted > activeWallet.amount) { showAlert('Insufficient Funds', `You need $${totalDeducted.toFixed(2)} but have $${activeWallet.amount.toFixed(2)}.`); return; }
                if (!purpose) { showAlert('Required', 'Please select a purpose for this transfer.'); return; }
                setStep('review');
              }}
              disabled={!usdAmount || usdAmount <= 0}
            >
              <Text style={styles.primaryBtnText}>Review Transfer</Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.textOnDark} />
            </Pressable>
          </ScrollView>
        )}

        {/* ── STEP 4: Review ── */}
        {step === 'review' && selectedCountry && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.stepTitle}>Review & Confirm</Text>

            <View style={styles.reviewCard}>
              {[
                { label: 'Sending To', value: `${selectedCountry.flag} ${selectedCountry.name}` },
                { label: 'Beneficiary', value: beneficiaryName },
                { label: 'Bank', value: bankName || 'Not specified' },
                { label: selectedCountry.network === 'SEPA' ? 'IBAN' : 'Account', value: accountNumber.slice(0, 8) + '••••' },
                ...(selectedCountry.network === 'SWIFT' ? [{ label: 'SWIFT/BIC', value: swiftCode }] : []),
                { label: 'Amount', value: `$${usdAmount.toFixed(2)} USD` },
                { label: 'Recipient Gets', value: `${selectedCountry.currencySymbol}${destAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${selectedCountry.currency}` },
                { label: 'Total Fees', value: `$${totalFee.toFixed(2)}` },
                { label: 'Total Deducted', value: `$${totalDeducted.toFixed(2)}` },
                { label: 'Purpose', value: purpose },
                { label: 'Network', value: selectedCountry.network },
                { label: 'Arrival', value: `${selectedCountry.arrivalDays} ${selectedCountry.arrivalDays === 'Same day' ? '' : 'business day(s)'}` },
              ].map((row, i, arr) => (
                <React.Fragment key={row.label}>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>{row.label}</Text>
                    <Text style={[
                      styles.reviewValue,
                      row.label === 'Total Deducted' && { color: colors.error, fontWeight: FontWeight.bold },
                      row.label === 'Recipient Gets' && { color: colors.success, fontWeight: FontWeight.semibold },
                    ]}>{row.value}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={[styles.feeDivider, { backgroundColor: colors.divider }]} />}
                </React.Fragment>
              ))}
            </View>

            <View style={[styles.arrivalCard, { backgroundColor: NETWORK_COLORS[selectedCountry.network] + '18', borderColor: NETWORK_COLORS[selectedCountry.network] + '44' }]}>
              <MaterialIcons name={NETWORK_ICONS[selectedCountry.network] as any} size={18} color={NETWORK_COLORS[selectedCountry.network]} />
              <Text style={[styles.arrivalText2, { color: NETWORK_COLORS[selectedCountry.network] }]}>
                Sent via {selectedCountry.network} · {selectedCountry.arrivalDays} {selectedCountry.arrivalDays !== 'Same day' ? 'business day(s)' : ''}
              </Text>
            </View>

            <Pressable
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.textOnDark} />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color={colors.textOnDark} />
                  <Text style={styles.primaryBtnText}>Confirm & Send Wire</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        )}

        {/* ── STEP 5: Success ── */}
        {step === 'success' && selectedCountry && (
          <View style={styles.successWrap}>
            <View style={styles.successCircle}>
              <MaterialIcons name="public" size={48} color={colors.textOnDark} />
            </View>
            <Text style={styles.successTitle}>Wire Initiated!</Text>
            <Text style={styles.successSub}>
              ${usdAmount.toFixed(2)} to {selectedCountry.flag} {selectedCountry.name} is being processed
            </Text>

            <View style={styles.trackingCard}>
              <Text style={styles.trackingLabel}>Tracking Reference</Text>
              <Text style={styles.trackingRef}>{trackingRef}</Text>
              <View style={[styles.arrivalCard, { marginTop: Spacing.md, backgroundColor: NETWORK_COLORS[selectedCountry.network] + '18', borderColor: NETWORK_COLORS[selectedCountry.network] + '44' }]}>
                <MaterialIcons name="schedule" size={16} color={NETWORK_COLORS[selectedCountry.network]} />
                <Text style={[styles.arrivalText2, { color: NETWORK_COLORS[selectedCountry.network], fontSize: FontSize.xs }]}>
                  Est. arrival: {selectedCountry.arrivalDays} {selectedCountry.arrivalDays !== 'Same day' ? 'business day(s)' : ''}
                </Text>
              </View>
            </View>

            <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => showAlert('Track Transfer', `Tracking reference: ${trackingRef}`)}>
              <MaterialIcons name="track-changes" size={18} color={colors.primary} />
              <Text style={styles.secondaryBtnText}>Track Transfer</Text>
            </Pressable>
          </View>
        )}

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
    stepRow: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xxl,
      marginBottom: Spacing.base,
    },
    stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border },
    stepDotActive: { backgroundColor: colors.primary },
    stepLine: { flex: 1, height: 2, backgroundColor: colors.border },
    stepLineDone: { backgroundColor: colors.primary },
    content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxl },
    stepTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.base },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.md,
      borderWidth: 1, borderColor: colors.border, marginBottom: Spacing.base,
    },
    searchInput: { flex: 1, fontSize: FontSize.base, color: colors.textPrimary, includeFontPadding: false },
    countryRow: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
    },
    countryFlag: { fontSize: 24, marginRight: Spacing.md },
    countryInfo: { flex: 1 },
    countryName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    countryCurrency: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    countryRight: { alignItems: 'flex-end', gap: 4 },
    networkBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 3 },
    networkBadgeText: { fontSize: 10, fontWeight: FontWeight.bold },
    arrivalText: { fontSize: FontSize.xs, color: colors.textMuted },
    destBanner: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.base, ...Shadow.sm,
    },
    destFlag: { fontSize: 28, marginRight: Spacing.md },
    destName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: colors.textPrimary },
    destCurrency: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    inputLabel: {
      fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary,
      marginBottom: Spacing.xs, marginTop: Spacing.md,
    },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
      borderWidth: 1, borderColor: colors.border,
    },
    input: { flex: 1, fontSize: FontSize.base, color: colors.textPrimary, includeFontPadding: false },
    fxCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    fxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
    fxFlag: { marginRight: 4 },
    fxCurrencyLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary, marginRight: Spacing.sm },
    fxArrow: { marginHorizontal: Spacing.sm },
    fxRateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    fxRateText: { fontSize: FontSize.sm, color: colors.textSecondary, fontWeight: FontWeight.semibold },
    amountCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    amountRow: { flexDirection: 'row', alignItems: 'center' },
    amountSymbol: { fontSize: 38, fontWeight: FontWeight.bold, color: colors.textPrimary, marginRight: 4 },
    amountInput: { flex: 1, fontSize: 38, fontWeight: FontWeight.bold, color: colors.textPrimary, includeFontPadding: false },
    convertRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
    convertText: { fontSize: FontSize.sm, color: colors.success, fontWeight: FontWeight.medium },
    quickChip: {
      paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    quickChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    quickChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    quickChipTextActive: { color: colors.textOnDark },
    feeCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    feeTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
    feeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
    feeLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    feeValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    feeDivider: { height: 1 },
    arrivalCard: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1,
    },
    arrivalText2: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, flex: 1 },
    reviewCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
    reviewLabel: { fontSize: FontSize.sm, color: colors.textMuted, flex: 1 },
    reviewValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary, flex: 1, textAlign: 'right' },
    primaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      backgroundColor: colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg,
      marginTop: Spacing.sm, ...Shadow.md,
    },
    primaryBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textOnDark },
    successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.base },
    successCircle: {
      width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, ...Shadow.lg,
    },
    successTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: colors.textPrimary, marginBottom: Spacing.sm },
    successSub: { fontSize: FontSize.sm, color: colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
    trackingCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
      width: '100%', marginBottom: Spacing.base, alignItems: 'center', ...Shadow.sm,
    },
    trackingLabel: { fontSize: FontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: Spacing.sm },
    trackingRef: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: colors.primary, letterSpacing: 1 },
    secondaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      paddingVertical: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, borderColor: colors.border, marginTop: Spacing.sm,
    },
    secondaryBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.primary },
  });
}
