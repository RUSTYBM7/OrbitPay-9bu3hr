import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';
import { MOCK_CONTACTS, Contact } from '../services/mockData';

type SplitMode = 'equal' | 'custom';
type Step = 'setup' | 'contacts' | 'amounts' | 'review' | 'success';

interface SplitParticipant {
  contact: Contact;
  amount: number;
  paid: boolean;
}

export default function SplitBillScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const { activeWallet, addTransaction } = useWallet();

  const [step, setStep] = useState<Step>('setup');
  const [totalAmount, setTotalAmount] = useState('');
  const [billDescription, setBillDescription] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [participants, setParticipants] = useState<SplitParticipant[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const total = parseFloat(totalAmount) || 0;
  const equalShare = participants.length > 0 ? total / participants.length : 0;

  const handleToggleContact = useCallback((contact: Contact) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      if (next.has(contact.id)) next.delete(contact.id);
      else next.add(contact.id);
      return next;
    });
  }, []);

  const handleConfirmContacts = useCallback(() => {
    if (selectedContacts.size === 0) { showAlert('Select Contacts', 'Add at least one person to split with.'); return; }
    const newParticipants = MOCK_CONTACTS.filter(c => selectedContacts.has(c.id)).map(c => ({
      contact: c, amount: 0, paid: false,
    }));
    setParticipants(newParticipants);
    setStep('amounts');
  }, [selectedContacts, showAlert]);

  const totalCustom = useMemo(() => {
    if (splitMode !== 'custom') return 0;
    return participants.reduce((sum, p) => sum + (parseFloat(customAmounts[p.contact.id] || '0') || 0), 0);
  }, [participants, customAmounts, splitMode]);

  const customDiff = total - totalCustom;

  const handleSendRequests = useCallback(async () => {
    if (!totalAmount || total <= 0) { showAlert('Invalid Amount', 'Enter a valid bill total.'); return; }
    if (splitMode === 'custom' && Math.abs(customDiff) > 0.01) {
      showAlert('Amounts Mismatch', `Custom amounts total $${totalCustom.toFixed(2)} but bill is $${total.toFixed(2)}.`);
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    for (const p of participants) {
      const amt = splitMode === 'equal' ? equalShare : (parseFloat(customAmounts[p.contact.id] || '0') || 0);
      await addTransaction({
        type: 'send',
        title: `Split: ${billDescription || 'Bill Split'}`,
        subtitle: `Request to ${p.contact.name}`,
        amount: -amt,
        currency: activeWallet.currency,
        status: 'pending',
        icon: 'call-split',
        category: 'Transfer',
      });
    }
    setLoading(false);
    setStep('success');
  }, [totalAmount, total, splitMode, customDiff, totalCustom, participants, equalShare, customAmounts, billDescription, activeWallet, addTransaction, showAlert]);

  const styles = makeStyles(colors);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {step !== 'success' && (
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => {
            if (step === 'contacts') setStep('setup');
            else if (step === 'amounts') setStep('contacts');
            else if (step === 'review') setStep('amounts');
            else router.back();
          }} hitSlop={12}>
            <MaterialIcons name={step === 'setup' ? 'close' : 'arrow-back'} size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Split Bill</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* ── SETUP ── */}
          {step === 'setup' && (
            <>
              <Text style={styles.stepTitle}>Create a Split</Text>

              <Text style={styles.inputLabel}>Bill Description</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="notes" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={billDescription}
                  onChangeText={setBillDescription}
                  placeholder="e.g. Dinner at Nobu, Taxi, Groceries"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  accessibilityLabel="Bill description"
                />
              </View>

              <Text style={styles.inputLabel}>Total Amount</Text>
              <View style={styles.amountCard}>
                <Text style={styles.amountSymbol}>{activeWallet.symbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Total bill amount"
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.base }}>
                {['20', '50', '100', '150', '200', '300'].map(v => (
                  <Pressable key={v} style={[styles.quickChip, totalAmount === v && styles.quickChipActive]} onPress={() => setTotalAmount(v)}>
                    <Text style={[styles.quickChipText, totalAmount === v && styles.quickChipTextActive]}>{activeWallet.symbol}{v}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Split Method</Text>
              <View style={styles.splitToggle}>
                {(['equal', 'custom'] as SplitMode[]).map(m => (
                  <Pressable
                    key={m}
                    style={[styles.splitBtn, splitMode === m && styles.splitBtnActive]}
                    onPress={() => setSplitMode(m)}
                  >
                    <MaterialIcons
                      name={m === 'equal' ? 'balance' : 'edit'}
                      size={16}
                      color={splitMode === m ? colors.textOnDark : colors.textSecondary}
                    />
                    <Text style={[styles.splitBtnText, splitMode === m && { color: colors.textOnDark }]}>
                      {m === 'equal' ? 'Equal Split' : 'Custom Amounts'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[styles.primaryBtn, (!totalAmount || !parseFloat(totalAmount)) && { opacity: 0.5 }]}
                onPress={() => {
                  if (!totalAmount || total <= 0) { showAlert('Enter Amount', 'Please enter the total bill amount.'); return; }
                  setStep('contacts');
                }}
                disabled={!totalAmount || total <= 0}
              >
                <MaterialIcons name="people" size={20} color={colors.textOnDark} />
                <Text style={styles.primaryBtnText}>Choose People to Split With</Text>
              </Pressable>
            </>
          )}

          {/* ── CONTACTS ── */}
          {step === 'contacts' && (
            <>
              <Text style={styles.stepTitle}>Who are you splitting with?</Text>
              <Text style={styles.stepSub}>
                {activeWallet.symbol}{total.toFixed(2)} total · {splitMode === 'equal' ? 'Equal split' : 'Custom amounts'}
              </Text>

              {MOCK_CONTACTS.map(c => {
                const isSelected = selectedContacts.has(c.id);
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.contactRow, isSelected && { borderColor: colors.primary, borderWidth: 1.5 }]}
                    onPress={() => handleToggleContact(c)}
                  >
                    <Image source={{ uri: c.avatar }} style={styles.contactAvatar} contentFit="cover" />
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{c.name}</Text>
                      <Text style={styles.contactUsername}>{c.username}</Text>
                    </View>
                    <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
                      {isSelected && <MaterialIcons name="check" size={14} color={colors.textOnDark} />}
                    </View>
                  </Pressable>
                );
              })}

              {selectedContacts.size > 0 && (
                <View style={styles.selectionSummary}>
                  <MaterialIcons name="people" size={16} color={colors.primary} />
                  <Text style={styles.selectionText}>
                    {selectedContacts.size} selected ·
                    {splitMode === 'equal' ? ` ${activeWallet.symbol}${(total / selectedContacts.size).toFixed(2)} each` : ' Custom amounts'}
                  </Text>
                </View>
              )}

              <Pressable
                style={[styles.primaryBtn, selectedContacts.size === 0 && { opacity: 0.5 }]}
                onPress={handleConfirmContacts}
                disabled={selectedContacts.size === 0}
              >
                <Text style={styles.primaryBtnText}>Continue with {selectedContacts.size} {selectedContacts.size === 1 ? 'Person' : 'People'}</Text>
                <MaterialIcons name="arrow-forward" size={20} color={colors.textOnDark} />
              </Pressable>
            </>
          )}

          {/* ── AMOUNTS ── */}
          {step === 'amounts' && (
            <>
              <Text style={styles.stepTitle}>
                {splitMode === 'equal' ? 'Equal Split Preview' : 'Set Custom Amounts'}
              </Text>
              <View style={styles.totalChip}>
                <MaterialIcons name="receipt" size={16} color={colors.primary} />
                <Text style={styles.totalChipText}>
                  {billDescription || 'Bill'} · {activeWallet.symbol}{total.toFixed(2)} total
                </Text>
              </View>

              {participants.map(p => {
                const share = splitMode === 'equal' ? equalShare : (parseFloat(customAmounts[p.contact.id] || '') || 0);
                return (
                  <View key={p.contact.id} style={styles.participantRow}>
                    <Image source={{ uri: p.contact.avatar }} style={styles.participantAvatar} contentFit="cover" />
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{p.contact.name}</Text>
                      <Text style={styles.participantUsername}>{p.contact.username}</Text>
                    </View>
                    {splitMode === 'equal' ? (
                      <View style={styles.equalShareBadge}>
                        <Text style={styles.equalShareText}>{activeWallet.symbol}{share.toFixed(2)}</Text>
                      </View>
                    ) : (
                      <View style={styles.customAmountWrap}>
                        <Text style={styles.customAmountSymbol}>{activeWallet.symbol}</Text>
                        <TextInput
                          style={styles.customAmountInput}
                          value={customAmounts[p.contact.id] || ''}
                          onChangeText={v => setCustomAmounts(prev => ({ ...prev, [p.contact.id]: v }))}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          placeholderTextColor={colors.textMuted}
                          accessibilityLabel={`Amount for ${p.contact.name}`}
                        />
                      </View>
                    )}
                  </View>
                );
              })}

              {splitMode === 'custom' && (
                <View style={[styles.diffCard, { backgroundColor: Math.abs(customDiff) > 0.01 ? colors.warningBg : colors.successBg, borderColor: Math.abs(customDiff) > 0.01 ? colors.warning + '44' : colors.success + '44' }]}>
                  <MaterialIcons name={Math.abs(customDiff) > 0.01 ? 'warning' : 'check-circle'} size={16} color={Math.abs(customDiff) > 0.01 ? colors.warning : colors.success} />
                  <Text style={[styles.diffText, { color: Math.abs(customDiff) > 0.01 ? colors.warning : colors.success }]}>
                    {Math.abs(customDiff) > 0.01
                      ? `${customDiff > 0 ? activeWallet.symbol + customDiff.toFixed(2) + ' unallocated' : activeWallet.symbol + Math.abs(customDiff).toFixed(2) + ' over total'}`
                      : 'Amounts balanced perfectly'}
                  </Text>
                </View>
              )}

              <Pressable style={styles.primaryBtn} onPress={() => setStep('review')}>
                <Text style={styles.primaryBtnText}>Review Split</Text>
                <MaterialIcons name="arrow-forward" size={20} color={colors.textOnDark} />
              </Pressable>
            </>
          )}

          {/* ── REVIEW ── */}
          {step === 'review' && (
            <>
              <Text style={styles.stepTitle}>Review & Send Requests</Text>
              <View style={styles.reviewCard}>
                <Text style={styles.reviewSectionLabel}>Bill Details</Text>
                {[
                  { label: 'Description', value: billDescription || 'Bill Split' },
                  { label: 'Total Amount', value: `${activeWallet.symbol}${total.toFixed(2)}` },
                  { label: 'Split Method', value: splitMode === 'equal' ? 'Equal' : 'Custom' },
                  { label: 'Participants', value: `${participants.length} people` },
                ].map((row, i, arr) => (
                  <React.Fragment key={row.label}>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>{row.label}</Text>
                      <Text style={styles.reviewValue}>{row.value}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
                  </React.Fragment>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Payment Requests</Text>
              {participants.map(p => {
                const share = splitMode === 'equal' ? equalShare : (parseFloat(customAmounts[p.contact.id] || '0') || 0);
                return (
                  <View key={p.contact.id} style={styles.requestRow}>
                    <Image source={{ uri: p.contact.avatar }} style={styles.participantAvatar} contentFit="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.participantName}>{p.contact.name}</Text>
                      <Text style={styles.participantUsername}>{p.contact.username}</Text>
                    </View>
                    <View style={[styles.requestBadge, { backgroundColor: colors.warningBg }]}>
                      <Text style={[styles.requestBadgeText, { color: colors.warning }]}>Pending</Text>
                    </View>
                    <Text style={styles.requestAmount}>{activeWallet.symbol}{share.toFixed(2)}</Text>
                  </View>
                );
              })}

              <Pressable
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleSendRequests}
                disabled={loading}
              >
                <MaterialIcons name="send" size={20} color={colors.textOnDark} />
                <Text style={styles.primaryBtnText}>Send {participants.length} Payment Request{participants.length !== 1 ? 's' : ''}</Text>
              </Pressable>
            </>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <View style={styles.successWrap}>
              <View style={styles.successCircle}>
                <MaterialIcons name="call-split" size={48} color={colors.textOnDark} />
              </View>
              <Text style={styles.successTitle}>Requests Sent!</Text>
              <Text style={styles.successSub}>
                Payment requests sent to {participants.length} {participants.length === 1 ? 'person' : 'people'} for {activeWallet.symbol}{total.toFixed(2)}
              </Text>

              <View style={styles.requestsCard}>
                <Text style={styles.reviewSectionLabel}>Tracking</Text>
                {participants.map(p => {
                  const share = splitMode === 'equal' ? equalShare : (parseFloat(customAmounts[p.contact.id] || '0') || 0);
                  return (
                    <View key={p.contact.id} style={styles.trackRow}>
                      <Image source={{ uri: p.contact.avatar }} style={styles.trackAvatar} contentFit="cover" />
                      <Text style={styles.trackName}>{p.contact.name}</Text>
                      <View style={[styles.trackStatus, { backgroundColor: colors.warningBg }]}>
                        <Text style={[styles.trackStatusText, { color: colors.warning }]}>Pending</Text>
                      </View>
                      <Text style={styles.trackAmount}>{activeWallet.symbol}{share.toFixed(2)}</Text>
                    </View>
                  );
                })}
              </View>

              <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </Pressable>
            </View>
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
    content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxl },
    stepTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
    stepSub: { fontSize: FontSize.sm, color: colors.textMuted, marginBottom: Spacing.lg },
    inputLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
      borderWidth: 1, borderColor: colors.border, marginBottom: Spacing.sm,
    },
    input: { flex: 1, fontSize: FontSize.base, color: colors.textPrimary, includeFontPadding: false },
    amountCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
      marginBottom: Spacing.sm, ...Shadow.sm,
    },
    amountSymbol: { fontSize: 38, fontWeight: FontWeight.bold, color: colors.textPrimary, marginRight: 4 },
    amountInput: { flex: 1, fontSize: 38, fontWeight: FontWeight.bold, color: colors.textPrimary, includeFontPadding: false },
    quickChip: {
      paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill,
      backgroundColor: colors.surface, marginRight: Spacing.sm, borderWidth: 1, borderColor: colors.border,
    },
    quickChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    quickChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    quickChipTextActive: { color: colors.textOnDark },
    splitToggle: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
    splitBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: Spacing.md, backgroundColor: colors.surface, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: colors.border,
    },
    splitBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    splitBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    contactRow: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
      borderWidth: 1.5, borderColor: 'transparent',
    },
    contactAvatar: { width: 48, height: 48, borderRadius: Radius.circle, marginRight: Spacing.md },
    contactInfo: { flex: 1 },
    contactName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    contactUsername: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    selectCircle: {
      width: 28, height: 28, borderRadius: 14,
      borderWidth: 2, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.background,
    },
    selectCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    selectionSummary: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.cardMint, borderRadius: Radius.lg, padding: Spacing.md,
      marginBottom: Spacing.lg, borderWidth: 1, borderColor: colors.border,
    },
    selectionText: { fontSize: FontSize.sm, color: colors.textSecondary, flex: 1 },
    totalChip: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.cardMint, borderRadius: Radius.lg, padding: Spacing.md,
      marginBottom: Spacing.base, borderWidth: 1, borderColor: colors.border,
    },
    totalChipText: { fontSize: FontSize.sm, color: colors.textSecondary, fontWeight: FontWeight.medium },
    participantRow: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
    },
    participantAvatar: { width: 44, height: 44, borderRadius: Radius.circle, marginRight: Spacing.md },
    participantInfo: { flex: 1 },
    participantName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    participantUsername: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    equalShareBadge: {
      backgroundColor: colors.primary, borderRadius: Radius.pill,
      paddingHorizontal: Spacing.md, paddingVertical: 7,
    },
    equalShareText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textOnDark },
    customAmountWrap: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background,
      borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
      borderWidth: 1, borderColor: colors.primary, minWidth: 80,
    },
    customAmountSymbol: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary, marginRight: 2 },
    customAmountInput: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary, includeFontPadding: false },
    diffCard: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1,
    },
    diffText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, flex: 1 },
    reviewCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.base, ...Shadow.sm,
    },
    reviewSectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: Spacing.sm },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
    reviewLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    reviewValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    divider: { height: 1 },
    sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.md },
    requestRow: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
    },
    requestBadge: { borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 3, marginRight: Spacing.sm },
    requestBadgeText: { fontSize: 10, fontWeight: FontWeight.bold },
    requestAmount: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary },
    primaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      backgroundColor: colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg,
      marginTop: Spacing.sm, ...Shadow.md,
    },
    primaryBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textOnDark },
    successWrap: { flex: 1, alignItems: 'center', paddingTop: Spacing.xl },
    successCircle: {
      width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, ...Shadow.lg,
    },
    successTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: colors.textPrimary, marginBottom: Spacing.sm },
    successSub: { fontSize: FontSize.sm, color: colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
    requestsCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      width: '100%', marginBottom: Spacing.base, ...Shadow.sm,
    },
    trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm },
    trackAvatar: { width: 32, height: 32, borderRadius: Radius.circle },
    trackName: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    trackStatus: { borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
    trackStatusText: { fontSize: 10, fontWeight: FontWeight.bold },
    trackAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textPrimary },
  });
}
