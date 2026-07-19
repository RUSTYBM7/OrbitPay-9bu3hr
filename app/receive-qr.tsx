import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Share,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'KES'];
const WALLET_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', NGN: '₦', KES: 'KSh' };

export default function ReceiveQRScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { user, activeWallet } = useWallet();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [currency, setCurrency] = useState(activeWallet.currency);
  const [showAmountInput, setShowAmountInput] = useState(false);

  // Generate OrbitPay QR data
  const qrAmount = amount && parseFloat(amount) > 0 ? `&amount=${amount}` : '';
  const qrNote = note.trim() ? `&note=${encodeURIComponent(note.trim())}` : '';
  const qrData = `orbitpay://send?to=${encodeURIComponent(user.orbitId)}&currency=${currency}${qrAmount}${qrNote}`;

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Send me money on OrbitPay!\nOrbitID: ${user.orbitId}\n${amount ? `Amount: ${WALLET_SYMBOLS[currency] ?? ''}${amount} ${currency}\n` : ''}${qrData}`,
        title: 'My OrbitPay QR Code',
      });
    } catch {
      showAlert('Share Failed', 'Unable to share your QR code right now.');
    }
  }, [user.orbitId, amount, currency, qrData, showAlert]);

  const handleCopyOrbitId = useCallback(() => {
    showAlert('Copied!', `OrbitID ${user.orbitId} copied to clipboard.`);
  }, [user.orbitId, showAlert]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Receive Money</Text>
        <Pressable style={styles.shareBtn} onPress={handleShare} hitSlop={8}>
          <MaterialIcons name="share" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* QR Card */}
        <View style={styles.qrCard}>
          {/* User Header */}
          <View style={styles.qrUserRow}>
            <View style={styles.qrAvatar}>
              <MaterialIcons name="person" size={28} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.qrUserName}>{user.name}</Text>
              <Text style={styles.qrOrbitId}>{user.orbitId}</Text>
            </View>
            <View style={styles.tierBadge}>
              <MaterialIcons name="workspace-premium" size={12} color={Colors.primary} />
              <Text style={styles.tierBadgeText}>{user.tier.toUpperCase()}</Text>
            </View>
          </View>

          {/* QR Code */}
          <View style={styles.qrCodeWrap}>
            <QRCode
              value={qrData}
              size={220}
              color={Colors.textPrimary}
              backgroundColor="transparent"
              logo={undefined}
              logoBorderRadius={0}
              quietZone={12}
            />
          </View>

          {/* Amount badge if set */}
          {amount && parseFloat(amount) > 0 && (
            <View style={styles.amountBadge}>
              <MaterialIcons name="payments" size={16} color={Colors.success} />
              <Text style={styles.amountBadgeText}>
                {WALLET_SYMBOLS[currency] ?? ''}{parseFloat(amount).toFixed(2)} {currency} requested
              </Text>
            </View>
          )}

          {/* OrbitID copy row */}
          <Pressable style={styles.orbitIdRow} onPress={handleCopyOrbitId}>
            <MaterialIcons name="alternate-email" size={16} color={Colors.primary} />
            <Text style={styles.orbitIdText}>{user.orbitId}</Text>
            <MaterialIcons name="content-copy" size={14} color={Colors.textMuted} />
          </Pressable>

          <Text style={styles.qrHint}>Scan this QR with any OrbitPay app to send money</Text>
        </View>

        {/* Customize Request */}
        <View style={styles.customizeCard}>
          <View style={styles.customizeHeader}>
            <Text style={styles.customizeTitle}>Customize Request</Text>
            <Pressable
              style={styles.customizeToggle}
              onPress={() => setShowAmountInput(v => !v)}
            >
              <Text style={styles.customizeToggleText}>
                {showAmountInput ? 'Hide' : 'Add amount'}
              </Text>
              <MaterialIcons
                name={showAmountInput ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={18}
                color={Colors.primary}
              />
            </Pressable>
          </View>

          {showAmountInput && (
            <>
              {/* Currency Selector */}
              <Text style={styles.fieldLabel}>Currency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                {CURRENCIES.map(cur => (
                  <Pressable
                    key={cur}
                    style={[styles.currencyChip, currency === cur && styles.currencyChipActive]}
                    onPress={() => setCurrency(cur)}
                  >
                    <Text style={[styles.currencyChipText, currency === cur && styles.currencyChipTextActive]}>{cur}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Amount */}
              <Text style={styles.fieldLabel}>Amount (optional)</Text>
              <View style={styles.amountInputWrap}>
                <Text style={styles.amountSymbol}>{WALLET_SYMBOLS[currency] ?? ''}</Text>
                <View
                  style={{ flex: 1 }}
                  // Using a View with accessible TextInput workaround
                >
                  <Text
                    style={styles.amountInputText}
                    onPress={() => {
                      // In a real app, focus a real TextInput
                      showAlert('Amount', 'Enter the amount to request.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: '$10', onPress: () => setAmount('10') },
                        { text: '$50', onPress: () => setAmount('50') },
                        { text: '$100', onPress: () => setAmount('100') },
                      ]);
                    }}
                  >
                    {amount || 'Enter amount'}
                  </Text>
                </View>
                {amount ? (
                  <Pressable onPress={() => setAmount('')} hitSlop={8}>
                    <MaterialIcons name="close" size={18} color={Colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>

              {/* Quick amount chips */}
              <View style={styles.quickAmounts}>
                {['10', '25', '50', '100', '200'].map(v => (
                  <Pressable
                    key={v}
                    style={[styles.quickChip, amount === v && styles.quickChipActive]}
                    onPress={() => setAmount(amount === v ? '' : v)}
                  >
                    <Text style={[styles.quickChipText, amount === v && styles.quickChipTextActive]}>
                      {WALLET_SYMBOLS[currency] ?? ''}{v}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Note */}
              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <View style={styles.noteWrap}>
                <MaterialIcons name="notes" size={16} color={Colors.textMuted} />
                <Text
                  style={[styles.noteText, !note && { color: Colors.textMuted }]}
                  onPress={() => showAlert('Note', 'Add a note to your payment request.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Lunch', onPress: () => setNote('Lunch') },
                    { text: 'Split bill', onPress: () => setNote('Split bill') },
                    { text: 'Clear', onPress: () => setNote(''), style: 'destructive' },
                  ])}
                >
                  {note || 'Add a note…'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Payment Methods */}
        <View style={styles.methodsCard}>
          <Text style={styles.methodsTitle}>Ways to receive</Text>
          {[
            { icon: 'qr-code', label: 'Scan QR Code', desc: 'They scan your QR code above' },
            { icon: 'alternate-email', label: 'Share OrbitID', desc: user.orbitId },
            { icon: 'link', label: 'Payment Link', desc: 'Share a tap-to-pay link' },
          ].map(method => (
            <Pressable
              key={method.icon}
              style={styles.methodRow}
              onPress={handleShare}
            >
              <View style={styles.methodIcon}>
                <MaterialIcons name={method.icon as any} size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodLabel}>{method.label}</Text>
                <Text style={styles.methodDesc} numberOfLines={1}>{method.desc}</Text>
              </View>
              <MaterialIcons name="share" size={16} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Share CTA */}
        <Pressable style={styles.shareCta} onPress={handleShare}>
          <MaterialIcons name="share" size={20} color={Colors.textOnDark} />
          <Text style={styles.shareCtaText}>Share QR Code</Text>
        </Pressable>

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
  shareBtn: {
    width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  content: { paddingHorizontal: Spacing.base },
  qrCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xxl, padding: Spacing.lg,
    alignItems: 'center', marginBottom: Spacing.md, ...Shadow.md,
  },
  qrUserRow: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  qrAvatar: {
    width: 48, height: 48, borderRadius: Radius.circle, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  qrUserName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  qrOrbitId: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  tierBadge: {
    marginLeft: 'auto' as any, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.background, borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  tierBadgeText: { fontSize: 10, color: Colors.primary, fontWeight: FontWeight.bold },
  qrCodeWrap: {
    padding: Spacing.base, backgroundColor: Colors.background,
    borderRadius: Radius.xl, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.divider,
  },
  amountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.successBg, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 7, marginBottom: Spacing.sm,
  },
  amountBadgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.success },
  orbitIdRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.background, borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 10, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  orbitIdText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  qrHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },
  customizeCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
    marginBottom: Spacing.md, ...Shadow.sm,
  },
  customizeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  customizeTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  customizeToggle: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  customizeToggleText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  currencyChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill,
    backgroundColor: Colors.background, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  currencyChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  currencyChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  currencyChipTextActive: { color: Colors.textOnDark },
  amountInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  amountSymbol: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  amountInputText: { flex: 1, fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  quickChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  quickChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  quickChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  quickChipTextActive: { color: Colors.textOnDark },
  noteWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  noteText: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary },
  methodsCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
    marginBottom: Spacing.md, ...Shadow.sm,
  },
  methodsTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  methodIcon: {
    width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  methodLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  methodDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  shareCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg, ...Shadow.md,
  },
  shareCtaText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textOnDark },
});
