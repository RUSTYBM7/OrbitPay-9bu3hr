import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { useBiometric } from '../hooks/useBiometric';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';
import { MOCK_CONTACTS } from '../services/mockData';

type Step = 'recipient' | 'amount' | 'confirm' | 'success';

const FX_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1540, KES: 130, GHS: 15.2,
};

export default function SendMoneyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user, activeWallet, addTransaction } = useWallet();
  const { isSupported, isEnrolled, biometricType, authenticate } = useBiometric();

  const [step, setStep] = useState<Step>('recipient');
  const [recipient, setRecipient] = useState('');
  const [recipientAvatar, setRecipientAvatar] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [toCurrency, setToCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const scaleAnim = useRef(new Animated.Value(0)).current;

  const fromCurrency = activeWallet.currency;
  const fromRate = FX_RATES[fromCurrency] ?? 1;
  const toRate = FX_RATES[toCurrency] ?? 1;
  const fxRate = fromRate > 0 ? toRate / fromRate : 1;
  const convertedAmount = amount ? (parseFloat(amount) * fxRate).toFixed(2) : '0.00';
  const fee = fromCurrency === toCurrency ? 0 : 2.99;

  const filteredContacts = MOCK_CONTACTS.filter(c =>
    search.length === 0 ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectContact = useCallback((name: string, avatar: string) => {
    setRecipient(name);
    setRecipientAvatar(avatar);
    setStep('amount');
  }, []);

  const handleConfirm = useCallback(() => {
    if (!amount || parseFloat(amount) <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (parseFloat(amount) > activeWallet.amount) {
      showAlert('Insufficient Funds', `Your ${fromCurrency} balance is ${activeWallet.symbol}${activeWallet.amount.toLocaleString()}.`);
      return;
    }
    setStep('confirm');
  }, [amount, activeWallet, fromCurrency, showAlert]);

  const handleSend = useCallback(async () => {
    setLoading(true);
    // Biometric confirmation
    if (isSupported && isEnrolled) {
      const ok = await authenticate(`Authorize $${parseFloat(amount).toFixed(2)} transfer to ${recipient}`);
      if (!ok) {
        setLoading(false);
        showAlert('Authentication Failed', 'Transaction cancelled. Please authenticate to proceed.');
        return;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    await addTransaction({
      type: 'send',
      title: `Sent to ${recipient}`,
      subtitle: note || 'Transfer',
      amount: -(parseFloat(amount)),
      currency: fromCurrency,
      status: 'completed',
      icon: 'send',
      category: 'Transfer',
      recipientAvatar,
    });
    setLoading(false);
    setStep('success');
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
  }, [recipient, amount, note, fromCurrency, recipientAvatar, addTransaction, scaleAnim]);

  const stepLabels: Step[] = ['recipient', 'amount', 'confirm', 'success'];
  const stepIdx = stepLabels.indexOf(step);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      {step !== 'success' && (
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              if (step === 'recipient') router.back();
              else if (step === 'amount') setStep('recipient');
              else if (step === 'confirm') setStep('amount');
            }}
            hitSlop={12}
          >
            <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Send Money</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialIcons name="close" size={22} color={Colors.textMuted} />
          </Pressable>
        </View>
      )}

      {/* Progress Bar */}
      {step !== 'success' && (
        <View style={styles.progressRow}>
          {['Recipient', 'Amount', 'Confirm'].map((label, i) => (
            <View key={label} style={styles.progressStep}>
              <View style={[styles.progressDot, i <= stepIdx && styles.progressDotActive]}>
                {i < stepIdx ? (
                  <MaterialIcons name="check" size={12} color={Colors.textOnDark} />
                ) : (
                  <Text style={[styles.progressDotText, i === stepIdx && styles.progressDotTextActive]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.progressLabel, i === stepIdx && styles.progressLabelActive]}>{label}</Text>
              {i < 2 && <View style={[styles.progressLine, i < stepIdx && styles.progressLineActive]} />}
            </View>
          ))}
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* ── STEP 1: Recipient ── */}
        {step === 'recipient' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Who are you sending to?</Text>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, @orbitid, or phone"
                placeholderTextColor={Colors.textMuted}
                autoFocus
                accessibilityLabel="Search recipient"
              />
            </View>

            {/* Manual Entry */}
            {search.length > 2 && !filteredContacts.length && (
              <Pressable
                style={styles.manualEntry}
                onPress={() => handleSelectContact(search, '')}
              >
                <View style={styles.manualEntryIcon}>
                  <MaterialIcons name="person-add" size={22} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.manualEntryName}>Send to "{search}"</Text>
                  <Text style={styles.manualEntrySub}>New recipient</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
              </Pressable>
            )}

            <Text style={styles.sectionLabel}>Recent Contacts</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredContacts.map(c => (
                <Pressable
                  key={c.id}
                  style={({ pressed }) => [styles.contactRow, pressed && styles.contactRowPressed]}
                  onPress={() => handleSelectContact(c.name, c.avatar)}
                >
                  <Image source={{ uri: c.avatar }} style={styles.contactAvatar} contentFit="cover" transition={150} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactUsername}>{c.username}</Text>
                  </View>
                  {c.recentlySent && (
                    <View style={styles.recentBadge}>
                      <Text style={styles.recentBadgeText}>Recent</Text>
                    </View>
                  )}
                  <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── STEP 2: Amount ── */}
        {step === 'amount' && (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            {/* Recipient Summary */}
            <View style={styles.recipientSummary}>
              {recipientAvatar ? (
                <Image source={{ uri: recipientAvatar }} style={styles.recipientAvatar} contentFit="cover" />
              ) : (
                <View style={styles.recipientAvatarPlaceholder}>
                  <MaterialIcons name="person" size={24} color={Colors.textMuted} />
                </View>
              )}
              <View>
                <Text style={styles.recipientName}>{recipient}</Text>
                <Text style={styles.recipientLabel}>Sending to</Text>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.amountCard}>
              <Text style={styles.amountHint}>From {fromCurrency} Wallet</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amountSymbol}>{activeWallet.symbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                  accessibilityLabel="Amount to send"
                />
              </View>
              <Text style={styles.balanceHint}>
                Available: {activeWallet.symbol}{activeWallet.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>

              {/* Quick Amounts */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
                {['25', '50', '100', '250', '500'].map(v => (
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
            </View>

            {/* FX Preview */}
            <View style={styles.fxCard}>
              <View style={styles.fxRow}>
                <Text style={styles.fxLabel}>To Currency</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                    {Object.keys(FX_RATES).map(cur => (
                      <Pressable
                        key={cur}
                        style={[styles.curChip, toCurrency === cur && styles.curChipActive]}
                        onPress={() => setToCurrency(cur)}
                      >
                        <Text style={[styles.curChipText, toCurrency === cur && styles.curChipTextActive]}>{cur}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
              {amount && parseFloat(amount) > 0 && (
                <View style={styles.fxConversionRow}>
                  <Text style={styles.fxFrom}>
                    {activeWallet.symbol}{parseFloat(amount).toFixed(2)} {fromCurrency}
                  </Text>
                  <MaterialIcons name="arrow-forward" size={16} color={Colors.textMuted} />
                  <Text style={styles.fxTo}>≈ {convertedAmount} {toCurrency}</Text>
                </View>
              )}
              <View style={styles.fxDetailsRow}>
                <Text style={styles.fxDetail}>Rate: 1 {fromCurrency} = {fxRate.toFixed(4)} {toCurrency}</Text>
                <Text style={styles.fxDetail}>Fee: {fee === 0 ? 'Free' : `$${fee}`}</Text>
              </View>
            </View>

            {/* Note */}
            <View style={styles.noteInput}>
              <MaterialIcons name="notes" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.noteText}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (optional)"
                placeholderTextColor={Colors.textMuted}
                accessibilityLabel="Note"
              />
            </View>

            <Pressable style={styles.continueBtn} onPress={handleConfirm}>
              <Text style={styles.continueBtnText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={20} color={Colors.textOnDark} />
            </Pressable>
            <View style={{ height: 24 }} />
          </ScrollView>
        )}

        {/* ── STEP 3: Confirm ── */}
        {step === 'confirm' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Confirm Transfer</Text>

            {/* Summary Card */}
            <View style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>To</Text>
                <View style={styles.confirmValueRow}>
                  {recipientAvatar ? (
                    <Image source={{ uri: recipientAvatar }} style={styles.confirmAvatar} contentFit="cover" />
                  ) : null}
                  <Text style={styles.confirmValue}>{recipient}</Text>
                </View>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Amount</Text>
                <Text style={styles.confirmValueBig}>
                  {activeWallet.symbol}{parseFloat(amount).toFixed(2)} {fromCurrency}
                </Text>
              </View>
              <View style={styles.confirmDivider} />
              {fromCurrency !== toCurrency && (
                <>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Recipient Gets</Text>
                    <Text style={styles.confirmValue}>{convertedAmount} {toCurrency}</Text>
                  </View>
                  <View style={styles.confirmDivider} />
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Transfer Fee</Text>
                    <Text style={styles.confirmValue}>${fee.toFixed(2)}</Text>
                  </View>
                  <View style={styles.confirmDivider} />
                </>
              )}
              {note ? (
                <>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Note</Text>
                    <Text style={styles.confirmValue}>{note}</Text>
                  </View>
                  <View style={styles.confirmDivider} />
                </>
              ) : null}
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>From Wallet</Text>
                <Text style={styles.confirmValue}>{fromCurrency} Wallet</Text>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Speed</Text>
                <Text style={[styles.confirmValue, { color: Colors.success }]}>Instant</Text>
              </View>
            </View>

            {/* Biometric Hint */}
            <View style={styles.biometricHint}>
              <MaterialIcons name={biometricType === 'face' ? 'face' : 'fingerprint'} size={24} color={Colors.primary} />
              <Text style={styles.biometricText}>
                {isSupported && isEnrolled
                  ? `Tap "Send Money" — ${biometricType === 'face' ? 'Face ID' : 'fingerprint'} will confirm the transfer`
                  : 'Tap to authorize and send this transfer'}
              </Text>
            </View>

            <Pressable
              style={[styles.continueBtn, loading && { opacity: 0.7 }]}
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Colors.textOnDark} /> : (
                <>
                  <MaterialIcons name="send" size={20} color={Colors.textOnDark} />
                  <Text style={styles.continueBtnText}>Send Money</Text>
                </>
              )}
            </Pressable>

            <View style={styles.securityNote}>
              <MaterialIcons name="lock" size={13} color={Colors.textMuted} />
              <Text style={styles.securityText}>End-to-end encrypted · Cannot be reversed</Text>
            </View>
          </View>
        )}

        {/* ── STEP 4: Success ── */}
        {step === 'success' && (
          <View style={styles.successContent}>
            <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
              <MaterialIcons name="check" size={52} color={Colors.textOnDark} />
            </Animated.View>
            <Text style={styles.successTitle}>Money Sent!</Text>
            <Text style={styles.successSub}>
              {activeWallet.symbol}{parseFloat(amount).toFixed(2)} sent to {recipient}
            </Text>

            {/* Receipt */}
            <View style={styles.receiptCard}>
              <Text style={styles.receiptTitle}>Transfer Receipt</Text>
              {[
                { label: 'Amount', value: `${activeWallet.symbol}${parseFloat(amount).toFixed(2)} ${fromCurrency}` },
                { label: 'To', value: recipient },
                { label: 'Status', value: 'Completed' },
                { label: 'Time', value: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
                { label: 'Reference', value: `ORB${Date.now().toString().slice(-8)}` },
              ].map(item => (
                <View key={item.label} style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>{item.label}</Text>
                  <Text style={[styles.receiptValue, item.label === 'Status' && { color: Colors.success }]}>{item.value}</Text>
                </View>
              ))}
            </View>

            <Pressable style={styles.continueBtn} onPress={() => router.back()}>
              <Text style={styles.continueBtnText}>Done</Text>
            </Pressable>
            <Pressable style={styles.shareBtn} onPress={() => {}}>
              <MaterialIcons name="share" size={16} color={Colors.primary} />
              <Text style={styles.shareBtnText}>Share Receipt</Text>
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
  backBtn: { width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  progressStep: { flex: 1, alignItems: 'center', position: 'relative' },
  progressDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
  },
  progressDotActive: { backgroundColor: Colors.primary },
  progressDotText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted },
  progressDotTextActive: { color: Colors.textOnDark },
  progressLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  progressLabelActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  progressLine: {
    position: 'absolute', top: 14, left: '60%', right: '-50%',
    height: 2, backgroundColor: Colors.border, zIndex: -1,
  },
  progressLineActive: { backgroundColor: Colors.primary },
  stepContent: { flex: 1, paddingHorizontal: Spacing.base },
  stepTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg, marginTop: Spacing.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    marginBottom: Spacing.base, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, marginLeft: Spacing.sm, includeFontPadding: false },
  manualEntry: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
  },
  manualEntryIcon: {
    width: 44, height: 44, borderRadius: Radius.circle, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  manualEntryName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  manualEntrySub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  contactRowPressed: { opacity: 0.75 },
  contactAvatar: { width: 48, height: 48, borderRadius: Radius.circle, marginRight: Spacing.md },
  contactName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  contactUsername: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  recentBadge: { backgroundColor: Colors.cardMint, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 3, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  recentBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  recipientSummary: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
    marginBottom: Spacing.base, ...Shadow.sm,
  },
  recipientAvatar: { width: 52, height: 52, borderRadius: Radius.circle },
  recipientAvatarPlaceholder: {
    width: 52, height: 52, borderRadius: Radius.circle,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  recipientName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  recipientLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  amountCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    marginBottom: Spacing.md, ...Shadow.sm,
  },
  amountHint: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.sm },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  amountSymbol: { fontSize: 38, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginRight: 4 },
  amountInput: { flex: 1, fontSize: 38, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  balanceHint: { fontSize: FontSize.sm, color: Colors.textMuted },
  quickChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.pill,
    backgroundColor: Colors.background, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  quickChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  quickChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  quickChipTextActive: { color: Colors.textOnDark },
  fxCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
    marginBottom: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  fxRow: { marginBottom: Spacing.sm },
  fxLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  curChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.pill,
    backgroundColor: Colors.background, marginRight: 6, borderWidth: 1, borderColor: Colors.border,
  },
  curChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  curChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  curChipTextActive: { color: Colors.textOnDark },
  fxConversionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing.sm, marginTop: Spacing.sm,
  },
  fxFrom: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  fxTo: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.success },
  fxDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  fxDetail: { fontSize: FontSize.xs, color: Colors.textMuted },
  noteInput: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border,
  },
  noteText: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, includeFontPadding: false },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg, ...Shadow.md,
  },
  continueBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  confirmCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, marginBottom: Spacing.base, ...Shadow.sm, overflow: 'hidden' },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  confirmLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  confirmValueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  confirmAvatar: { width: 24, height: 24, borderRadius: 12 },
  confirmValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  confirmValueBig: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  confirmDivider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: Spacing.base },
  biometricHint: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.cardMint, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border,
  },
  biometricText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: Spacing.md },
  securityText: { fontSize: FontSize.xs, color: Colors.textMuted },
  successContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  successCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, ...Shadow.lg,
  },
  successTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  successSub: { fontSize: FontSize.base, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl },
  receiptCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    width: '100%', marginBottom: Spacing.xl, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
  },
  receiptTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: 'center' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  receiptLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  receiptValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, marginTop: Spacing.sm,
  },
  shareBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
});
