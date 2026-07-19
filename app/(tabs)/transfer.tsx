import React, { useState, useCallback, memo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../../hooks/useWallet';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../../constants/theme';
import { MOCK_CONTACTS, Contact } from '../../services/mockData';

const TRANSFER_TYPES = [
  { id: 'send', label: 'Send', icon: 'send' },
  { id: 'request', label: 'Request', icon: 'download' },
  { id: 'international', label: 'International', icon: 'public' },
  { id: 'bill', label: 'Pay Bill', icon: 'receipt-long' },
];

const ContactPill = memo(({ contact, onPress }: { contact: Contact; onPress: () => void }) => (
  <Pressable
    style={({ pressed }) => [styles.contactPill, pressed && { opacity: 0.75 }]}
    onPress={onPress}
  >
    <Image
      source={{ uri: contact.avatar }}
      style={styles.contactAvatar}
      contentFit="cover"
      transition={150}
    />
    <Text style={styles.contactName} numberOfLines={1}>{contact.name.split(' ')[0]}</Text>
  </Pressable>
));

const AddContactPill = memo(({ onPress }: { onPress: () => void }) => (
  <Pressable
    style={({ pressed }) => [styles.contactPill, pressed && { opacity: 0.75 }]}
    onPress={onPress}
  >
    <View style={styles.addContactAvatar}>
      <MaterialIcons name="person-add" size={20} color={Colors.primary} />
    </View>
    <Text style={styles.contactName}>New</Text>
  </Pressable>
));

export default function TransferScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { activeWallet, contacts } = useWallet();

  const [activeType, setActiveType] = useState('send');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');

  const handleSend = useCallback(() => {
    if (!amount || parseFloat(amount) <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount to transfer.');
      return;
    }
    if (!recipient.trim()) {
      showAlert('No Recipient', 'Please select or enter a recipient.');
      return;
    }
    showAlert(
      'Confirm Transfer',
      `Send ${activeWallet.symbol}${parseFloat(amount).toFixed(2)} to ${recipient}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Now',
          style: 'default',
          onPress: () => {
            setAmount('');
            setRecipient('');
            setNote('');
            showAlert('Transfer Sent!', `${activeWallet.symbol}${parseFloat(amount).toFixed(2)} sent successfully.`);
          },
        },
      ]
    );
  }, [amount, recipient, activeWallet, showAlert]);

  const recentContacts = contacts.filter(c => c.recentlySent);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transfer</Text>
        <Pressable
          style={styles.headerBtn}
          onPress={() => showAlert('Transfer History', 'View all past transfers.')}
          hitSlop={8}
        >
          <MaterialIcons name="history" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Transfer Type Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeBar}>
          {TRANSFER_TYPES.map(t => (
            <Pressable
              key={t.id}
              style={[styles.typeTab, activeType === t.id && styles.typeTabActive]}
              onPress={() => setActiveType(t.id)}
            >
              <MaterialIcons
                name={t.icon as any}
                size={16}
                color={activeType === t.id ? Colors.textOnDark : Colors.textSecondary}
              />
              <Text style={[styles.typeTabText, activeType === t.id && styles.typeTabTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Recent Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Recent</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.contactsRow}>
              <AddContactPill onPress={() => showAlert('Add Contact', 'Search for an OrbitPay user by username or phone.')} />
              {recentContacts.map(c => (
                <ContactPill
                  key={c.id}
                  contact={c}
                  onPress={() => setRecipient(c.name)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Amount Input */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountSymbol}>{activeWallet.symbol}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              accessibilityLabel="Transfer amount"
            />
            <Pressable
              style={styles.currencyToggle}
              onPress={() => showAlert('Currency', 'Select transfer currency.')}
            >
              <Text style={styles.currencyToggleText}>{activeWallet.currency}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.primary} />
            </Pressable>
          </View>
          <View style={styles.amountDivider} />
          <Text style={styles.balanceAvail}>
            Available: {activeWallet.symbol}{activeWallet.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </Text>

          {/* Quick Amount Chips */}
          <View style={styles.quickAmounts}>
            {['50', '100', '250', '500', '1000'].map(v => (
              <Pressable
                key={v}
                style={[styles.quickAmountChip, amount === v && styles.quickAmountChipActive]}
                onPress={() => setAmount(v)}
              >
                <Text style={[styles.quickAmountText, amount === v && styles.quickAmountTextActive]}>
                  {activeWallet.symbol}{v}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recipient Input */}
        <View style={styles.inputCard}>
          <MaterialIcons name="person" size={20} color={Colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Recipient name, @orbitid, or phone"
            placeholderTextColor={Colors.textMuted}
            accessibilityLabel="Recipient"
          />
          {recipient.length > 0 && (
            <Pressable onPress={() => setRecipient('')} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Note Input */}
        <View style={styles.inputCard}>
          <MaterialIcons name="notes" size={20} color={Colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            placeholderTextColor={Colors.textMuted}
            accessibilityLabel="Note"
          />
        </View>

        {/* Fee Estimate */}
        <View style={styles.feeRow}>
          <MaterialIcons name="info-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.feeText}>
            {activeType === 'international'
              ? 'Estimated fee: $2.99 · Arrives in 1–2 business days'
              : 'No fee · Instant transfer'}
          </Text>
        </View>

        {/* Send Button */}
        <Pressable
          style={({ pressed }) => [styles.sendBtn, pressed && styles.sendBtnPressed]}
          onPress={handleSend}
          accessibilityLabel={`${activeType === 'send' ? 'Send' : activeType === 'request' ? 'Request' : 'Confirm'} money`}
        >
          <MaterialIcons
            name={activeType === 'send' ? 'send' : activeType === 'request' ? 'download' : 'check-circle'}
            size={20}
            color={Colors.textOnDark}
          />
          <Text style={styles.sendBtnText}>
            {activeType === 'send' ? 'Send Money' : activeType === 'request' ? 'Request Money' : activeType === 'bill' ? 'Pay Bill' : 'Send International'}
          </Text>
        </Pressable>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <MaterialIcons name="lock" size={14} color={Colors.textMuted} />
          <Text style={styles.securityText}>256-bit encrypted · FDIC insured</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.circle,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  content: {
    paddingHorizontal: Spacing.base,
  },
  typeBar: {
    marginBottom: Spacing.base,
  },
  typeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeTabText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  typeTabTextActive: {
    color: Colors.textOnDark,
    fontWeight: FontWeight.semibold,
  },
  section: {
    marginBottom: Spacing.base,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  contactsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingRight: Spacing.base,
  },
  contactPill: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: 60,
  },
  contactAvatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.circle,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  addContactAvatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.circle,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  contactName: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  amountCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  amountLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountSymbol: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    padding: 0,
    includeFontPadding: false,
  },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyToggleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  amountDivider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.md,
  },
  balanceAvail: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickAmountChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  quickAmountText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  quickAmountTextActive: {
    color: Colors.textOnDark,
    fontWeight: FontWeight.bold,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    padding: 0,
    includeFontPadding: false,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.xs,
  },
  feeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.md,
  },
  sendBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  sendBtnText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textOnDark,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  securityText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
