import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../../hooks/useWallet';
import { useTheme } from '../../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../../constants/theme';
import { MOCK_CONTACTS, Contact } from '../../services/mockData';

type HubTab = 'p2p' | 'wire' | 'crypto' | 'bills';

interface HubTabItem {
  id: HubTab;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const HUB_TABS: HubTabItem[] = [
  { id: 'p2p', label: 'P2P', icon: 'people', color: '#1B6B4A', description: 'Send to contacts instantly' },
  { id: 'wire', label: 'Wire', icon: 'public', color: '#1D4ED8', description: 'International bank transfer' },
  { id: 'crypto', label: 'Crypto', icon: 'currency-bitcoin', color: '#F7931A', description: 'Buy, sell & swap crypto' },
  { id: 'bills', label: 'Bills', icon: 'receipt-long', color: '#EC4899', description: 'Pay utilities & services' },
];

const FEE_INFO: Record<HubTab, { fee: string; time: string; limit: string }> = {
  p2p: { fee: 'No fee', time: 'Instant', limit: '$50,000/day' },
  wire: { fee: 'From $3.00', time: '1–3 business days', limit: '$500,000/transfer' },
  crypto: { fee: '0.15% network fee', time: 'Within minutes', limit: 'No limit' },
  bills: { fee: 'No fee', time: 'Instant or scheduled', limit: 'Provider limits apply' },
};

const ContactPill = memo(({ contact, onPress }: { contact: Contact; onPress: () => void }) => (
  <Pressable style={styles.contactPill} onPress={onPress}>
    <Image source={{ uri: contact.avatar }} style={styles.contactAvatar} contentFit="cover" transition={150} />
    <Text style={styles.contactPillName} numberOfLines={1}>{contact.name.split(' ')[0]}</Text>
  </Pressable>
));

export default function TransferScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const router = useRouter();
  const { colors } = useTheme();
  const { activeWallet, contacts, addTransaction } = useWallet();

  const [activeTab, setActiveTab] = useState<HubTab>('p2p');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');

  const selectedFee = FEE_INFO[activeTab];
  const usdAmount = parseFloat(amount) || 0;
  const estimatedFee = activeTab === 'crypto' && usdAmount > 0
    ? (usdAmount * 0.0015).toFixed(2)
    : activeTab === 'wire' ? '5.00'
    : '0.00';

  const recentContacts = useMemo(() => contacts.filter(c => c.recentlySent).slice(0, 5), [contacts]);

  const handleSend = useCallback(() => {
    if (!amount || usdAmount <= 0) { showAlert('Invalid Amount', 'Enter a valid amount.'); return; }
    if (activeTab === 'wire') { router.push({ pathname: '/wire-transfer' }); return; }
    if (activeTab === 'crypto') { router.push('/crypto-trade'); return; }
    if (activeTab === 'bills') { router.push('/pay-bills'); return; }
    // P2P
    if (!recipient.trim()) { showAlert('No Recipient', 'Please select or enter a recipient.'); return; }
    router.push({ pathname: '/send-money' });
  }, [amount, usdAmount, activeTab, recipient, router, showAlert]);

  const handleSplit = useCallback(() => {
    if (!amount || usdAmount <= 0) { showAlert('Enter Amount', 'Enter a bill total to split.'); return; }
    router.push('/split-bill');
  }, [amount, usdAmount, router, showAlert]);

  const styles = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transfer</Text>
        <View style={styles.headerActions}>
          <Pressable style={[styles.headerBtn, { backgroundColor: colors.surface }]} onPress={() => router.push('/transactions')} hitSlop={8}>
            <MaterialIcons name="history" size={20} color={colors.primary} />
          </Pressable>
          <Pressable style={[styles.headerBtn, { backgroundColor: colors.surface }]} onPress={() => router.push('/scan-qr')} hitSlop={8}>
            <MaterialIcons name="qr-code-scanner" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Hub Tabs */}
        <View style={styles.hubTabs}>
          {HUB_TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[styles.hubTab, isActive && { backgroundColor: tab.color + '18', borderColor: tab.color }]}
                onPress={() => setActiveTab(tab.id)}
              >
                <View style={[styles.hubTabIcon, { backgroundColor: isActive ? tab.color : colors.background }]}>
                  <MaterialIcons name={tab.icon as any} size={18} color={isActive ? '#FFFFFF' : colors.textMuted} />
                </View>
                <Text style={[styles.hubTabLabel, isActive && { color: tab.color, fontWeight: FontWeight.bold }]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Context Banner */}
        <View style={[styles.contextBanner, { backgroundColor: HUB_TABS.find(t => t.id === activeTab)!.color + '12', borderColor: HUB_TABS.find(t => t.id === activeTab)!.color + '30' }]}>
          <MaterialIcons name={HUB_TABS.find(t => t.id === activeTab)!.icon as any} size={16} color={HUB_TABS.find(t => t.id === activeTab)!.color} />
          <Text style={[styles.contextBannerText, { color: HUB_TABS.find(t => t.id === activeTab)!.color }]}>
            {HUB_TABS.find(t => t.id === activeTab)!.description}
          </Text>
          {activeTab === 'wire' && (
            <Pressable onPress={() => router.push('/wire-transfer')} hitSlop={8}>
              <Text style={[styles.contextBannerLink, { color: HUB_TABS.find(t => t.id === activeTab)!.color }]}>Open Full Flow →</Text>
            </Pressable>
          )}
          {activeTab === 'crypto' && (
            <Pressable onPress={() => router.push('/crypto-trade')} hitSlop={8}>
              <Text style={[styles.contextBannerLink, { color: HUB_TABS.find(t => t.id === activeTab)!.color }]}>Trade →</Text>
            </Pressable>
          )}
          {activeTab === 'bills' && (
            <Pressable onPress={() => router.push('/pay-bills')} hitSlop={8}>
              <Text style={[styles.contextBannerLink, { color: HUB_TABS.find(t => t.id === activeTab)!.color }]}>Browse Billers →</Text>
            </Pressable>
          )}
        </View>

        {/* Recent Recipients (P2P only) */}
        {activeTab === 'p2p' && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionLabel}>Recent Recipients</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.contactsRow}>
                <Pressable style={styles.contactPill} onPress={() => showAlert('Add Contact', 'Search by OrbitID, email, or phone.')}>
                  <View style={[styles.addContactCircle, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <MaterialIcons name="person-add" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.contactPillName}>New</Text>
                </Pressable>
                {recentContacts.map(c => (
                  <ContactPill key={c.id} contact={c} onPress={() => setRecipient(c.name)} />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Amount Input */}
        <View style={[styles.amountCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.amountLabel, { color: colors.textMuted }]}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.amountSymbol, { color: colors.textPrimary }]}>{activeWallet.symbol}</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.textPrimary }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Transfer amount"
            />
            <View style={[styles.currencyPill, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.currencyPillText, { color: colors.primary }]}>{activeWallet.currency}</Text>
            </View>
          </View>
          <View style={[styles.amountDivider, { backgroundColor: colors.divider }]} />
          <Text style={[styles.availBalance, { color: colors.textMuted }]}>
            Available: {activeWallet.symbol}{activeWallet.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </Text>
          {/* Quick chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickChips}>
            {['25', '50', '100', '250', '500', '1000'].map(v => (
              <Pressable
                key={v}
                style={[styles.quickChip, { backgroundColor: colors.background, borderColor: colors.border }, amount === v && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setAmount(v)}
              >
                <Text style={[styles.quickChipText, { color: colors.textSecondary }, amount === v && { color: colors.textOnDark }]}>
                  {activeWallet.symbol}{v}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Recipient input (P2P / Wire) */}
        {(activeTab === 'p2p' || activeTab === 'wire') && (
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name={activeTab === 'wire' ? 'account-balance' : 'person'} size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.inputField, { color: colors.textPrimary }]}
              value={recipient}
              onChangeText={setRecipient}
              placeholder={activeTab === 'wire' ? 'IBAN / SWIFT / Account number' : 'Name, @orbitid, or phone'}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Recipient"
            />
            {recipient.length > 0 && (
              <Pressable onPress={() => setRecipient('')} hitSlop={8}>
                <MaterialIcons name="close" size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        )}

        {/* Note (P2P) */}
        {activeTab === 'p2p' && (
          <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="notes" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.inputField, { color: colors.textPrimary }]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Note"
            />
          </View>
        )}

        {/* Real-time Fee Estimate */}
        <View style={[styles.feeCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.feeTitle, { color: colors.textMuted }]}>Fee Estimate</Text>
          <View style={styles.feeRows}>
            {[
              { label: 'Transfer fee', value: usdAmount > 0 ? `$${estimatedFee}` : selectedFee.fee },
              { label: 'Processing time', value: selectedFee.time },
              { label: 'Daily limit', value: selectedFee.limit },
            ].map((row, i) => (
              <View key={row.label} style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: colors.textMuted }]}>{row.label}</Text>
                <Text style={[styles.feeValue, { color: colors.textPrimary }]}>{row.value}</Text>
              </View>
            ))}
            {activeTab === 'p2p' && usdAmount > 0 && (
              <View style={styles.feeRow}>
                <Text style={[styles.feeLabel, { color: colors.textMuted }]}>Total sent</Text>
                <Text style={[styles.feeValueBold, { color: colors.primary }]}>
                  {activeWallet.symbol}{usdAmount.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Security Badge */}
        <View style={[styles.securityBadge, { backgroundColor: colors.cardMint, borderColor: colors.border }]}>
          <MaterialIcons name="shield" size={16} color={colors.success} />
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            256-bit encrypted · FDIC insured · Face ID protected
          </Text>
        </View>

        {/* CTA Buttons */}
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: HUB_TABS.find(t => t.id === activeTab)!.color }, pressed && { opacity: 0.9 }]}
          onPress={handleSend}
        >
          <MaterialIcons
            name={activeTab === 'p2p' ? 'send' : activeTab === 'wire' ? 'public' : activeTab === 'crypto' ? 'currency-bitcoin' : 'receipt-long'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.primaryBtnText}>
            {activeTab === 'p2p' ? 'Send Money' : activeTab === 'wire' ? 'Wire Transfer' : activeTab === 'crypto' ? 'Trade Crypto' : 'Pay Bill'}
          </Text>
        </Pressable>

        {activeTab === 'p2p' && (
          <Pressable
            style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={handleSplit}
          >
            <MaterialIcons name="call-split" size={18} color={colors.primary} />
            <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Split Bill</Text>
          </Pressable>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  headerBtn: { width: 40, height: 40, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  content: { paddingHorizontal: Spacing.base },
  hubTabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  hubTab: {
    flex: 1, alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.md,
    borderRadius: Radius.xl, borderWidth: 1.5, borderColor: 'transparent',
  },
  hubTabIcon: { width: 38, height: 38, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center' },
  hubTabLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  contextBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1,
  },
  contextBannerText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  contextBannerLink: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  recentSection: { marginBottom: Spacing.base },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.sm },
  contactsRow: { flexDirection: 'row', gap: Spacing.md, paddingRight: Spacing.base },
  contactPill: { alignItems: 'center', gap: Spacing.xs, width: 60 },
  contactAvatar: { width: 52, height: 52, borderRadius: 26 },
  addContactCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed' },
  contactPillName: { fontSize: FontSize.xs, textAlign: 'center' },
  amountCard: { borderRadius: Radius.xxl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm },
  amountLabel: { fontSize: FontSize.sm, marginBottom: Spacing.sm },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountSymbol: { fontSize: 36, fontWeight: FontWeight.bold, marginRight: 4 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: FontWeight.bold, padding: 0, includeFontPadding: false },
  currencyPill: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderWidth: 1 },
  currencyPillText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  amountDivider: { height: 1, marginVertical: Spacing.md },
  availBalance: { fontSize: FontSize.sm, marginBottom: Spacing.md },
  quickChips: {},
  quickChip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill, marginRight: Spacing.sm, borderWidth: 1 },
  quickChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1,
  },
  inputField: { flex: 1, fontSize: FontSize.base, padding: 0, includeFontPadding: false },
  feeCard: { borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.sm },
  feeTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: Spacing.sm },
  feeRows: { gap: Spacing.xs },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeLabel: { fontSize: FontSize.sm },
  feeValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  feeValueBold: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  securityBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.base, borderWidth: 1 },
  securityText: { flex: 1, fontSize: FontSize.xs },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderRadius: Radius.xl, paddingVertical: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.md,
  },
  primaryBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderRadius: Radius.xl, paddingVertical: Spacing.lg, borderWidth: 1,
  },
  secondaryBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
});

function makeStyles(colors: ReturnType<typeof import('../../contexts/ThemeContext').useTheme>['colors']) {
  return styles;
}
