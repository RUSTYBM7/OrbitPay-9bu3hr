import React, { useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Share, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';
import { formatDate, formatTime } from '../services/mockData';

const STATUS_COLORS: Record<string, string> = {
  completed: '#27AE60',
  pending: '#F39C12',
  failed: '#E74C3C',
};

const TYPE_LABELS: Record<string, string> = {
  send: 'Sent',
  receive: 'Received',
  payment: 'Payment',
  topup: 'Top-Up',
  investment: 'Investment',
  crypto: 'Crypto Trade',
  withdrawal: 'Withdrawal',
};

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const { transactions } = useWallet();
  const params = useLocalSearchParams<{ id: string }>();

  const tx = useMemo(() => transactions.find(t => t.id === params.id), [transactions, params.id]);

  const handleShare = useCallback(async () => {
    if (!tx) return;
    try {
      await Share.share({
        message: `OrbitPay Receipt\n${TYPE_LABELS[tx.type] || tx.type}: ${tx.currency === 'USD' ? '$' : tx.currency}${Math.abs(tx.amount).toFixed(2)}\n${tx.title}\n${formatDate(tx.timestamp)} · Ref: ORB${tx.id.slice(-8).toUpperCase()}`,
        title: 'Transaction Receipt',
      });
    } catch {}
  }, [tx]);

  const handleDispute = useCallback(() => {
    showAlert(
      'Dispute Transaction',
      'Submit a dispute for this transaction. Our team will investigate within 3-5 business days.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit Dispute', style: 'default', onPress: () => showAlert('Dispute Submitted', 'We have received your dispute. Reference: DSP-' + Date.now().toString().slice(-6)) },
      ]
    );
  }, [showAlert, tx]);

  const styles = makeStyles(colors);

  if (!tx) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Transaction</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFound}>
          <MaterialIcons name="receipt-long" size={48} color={colors.textMuted} />
          <Text style={styles.notFoundText}>Transaction not found</Text>
        </View>
      </View>
    );
  }

  const isCredit = tx.amount > 0;
  const sym = tx.currency === 'USD' ? '$' : tx.currency === 'EUR' ? '€' : tx.currency === 'GBP' ? '£' : '$';
  const refNum = `ORB-${tx.id.slice(-8).toUpperCase()}`;
  const statusColor = STATUS_COLORS[tx.status] ?? colors.textMuted;
  const feeAmount = Math.abs(tx.amount) > 1000 ? (Math.abs(tx.amount) * 0.001).toFixed(2) : '0.00';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Transaction Detail</Text>
        <Pressable style={styles.backBtn} onPress={handleShare} hitSlop={8}>
          <MaterialIcons name="share" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Hero Amount */}
        <View style={[styles.heroCard, { backgroundColor: isCredit ? colors.success : colors.primary }]}>
          <View style={styles.heroGlow} />
          <View style={styles.heroIconWrap}>
            {tx.recipientAvatar ? (
              <Image source={{ uri: tx.recipientAvatar }} style={styles.heroAvatar} contentFit="cover" />
            ) : (
              <View style={[styles.heroIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <MaterialIcons name={tx.icon as any} size={28} color="#FFFFFF" />
              </View>
            )}
          </View>
          <Text style={styles.heroTitle}>{tx.title}</Text>
          <Text style={styles.heroSubtitle}>{tx.subtitle}</Text>
          <Text style={styles.heroAmount}>
            {isCredit ? '+' : ''}{sym}{Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <View style={[styles.heroBadgeDot, { backgroundColor: statusColor }]} />
            <Text style={styles.heroBadgeText}>{tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</Text>
          </View>
        </View>

        {/* Receipt Card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <MaterialIcons name="receipt-long" size={18} color={colors.primary} />
            <Text style={styles.receiptHeaderTitle}>Receipt</Text>
            <Pressable onPress={handleShare} hitSlop={8}>
              <Text style={[styles.downloadText, { color: colors.primary }]}>Download PDF</Text>
            </Pressable>
          </View>

          {[
            { label: 'Reference', value: refNum },
            { label: 'Transaction Type', value: TYPE_LABELS[tx.type] || tx.type },
            { label: 'Category', value: tx.category },
            { label: 'Date', value: formatDate(tx.timestamp) },
            { label: 'Time', value: formatTime(tx.timestamp) },
            { label: 'Currency', value: tx.currency },
            { label: 'Amount', value: `${sym}${Math.abs(tx.amount).toFixed(2)}` },
            { label: 'Fee', value: `${sym}${feeAmount}` },
            { label: 'Total', value: `${sym}${(Math.abs(tx.amount) + parseFloat(feeAmount)).toFixed(2)}` },
            { label: 'Status', value: tx.status.charAt(0).toUpperCase() + tx.status.slice(1), statusColor },
            { label: 'Payment Method', value: 'OrbitPay Wallet' },
          ].map((row, i, arr) => (
            <React.Fragment key={row.label}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>{row.label}</Text>
                <Text style={[styles.receiptValue, row.statusColor ? { color: row.statusColor, fontWeight: FontWeight.bold } : {}]}>
                  {row.value}
                </Text>
              </View>
              {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* QR Verification */}
        <View style={styles.qrCard}>
          <View style={styles.qrInfo}>
            <MaterialIcons name="qr-code" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.qrTitle}>QR Verification Code</Text>
              <Text style={styles.qrSub}>Scan to verify transaction authenticity</Text>
            </View>
          </View>
          <View style={[styles.qrPlaceholder, { backgroundColor: colors.background }]}>
            {/* QR code visual placeholder using grid */}
            <View style={styles.qrGrid}>
              {Array.from({ length: 25 }).map((_, i) => (
                <View key={i} style={[styles.qrCell, { backgroundColor: (i * 7 + i * 3) % 5 === 0 ? colors.textPrimary : 'transparent' }]} />
              ))}
            </View>
            <Text style={styles.qrRefText}>{refNum}</Text>
          </View>
        </View>

        {/* Blockchain Hash (for crypto) */}
        {tx.type === 'crypto' && (
          <View style={styles.blockchainCard}>
            <MaterialIcons name="link" size={16} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.blockchainTitle}>Blockchain Transaction</Text>
              <Text style={styles.blockchainHash} numberOfLines={1}>
                0x4f3a...{tx.id.slice(-8)}b2e9
              </Text>
            </View>
            <Pressable onPress={() => showAlert('Blockchain Explorer', 'Opening transaction on chain explorer...')} hitSlop={8}>
              <MaterialIcons name="open-in-new" size={18} color={colors.primary} />
            </Pressable>
          </View>
        )}

        {/* Actions */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: 'share', label: 'Share', onPress: handleShare },
            { icon: 'file-download', label: 'Download', onPress: () => showAlert('Download', 'PDF receipt downloaded to your device.') },
            { icon: 'repeat', label: 'Repeat', onPress: () => showAlert('Repeat', 'Set up a recurring payment for this transaction.') },
            { icon: 'flag', label: 'Dispute', onPress: handleDispute, danger: true },
          ].map(action => (
            <Pressable
              key={action.label}
              style={[styles.actionBtn, { backgroundColor: (action.danger ? colors.errorBg : colors.surface) }]}
              onPress={action.onPress}
            >
              <MaterialIcons name={action.icon as any} size={22} color={action.danger ? colors.error : colors.primary} />
              <Text style={[styles.actionLabel, { color: action.danger ? colors.error : colors.textSecondary }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Support */}
        <Pressable
          style={[styles.supportBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => showAlert('Support', 'Contact support for help with this transaction. Reference: ' + refNum)}
        >
          <MaterialIcons name="headset-mic" size={20} color={colors.primary} />
          <Text style={[styles.supportText, { color: colors.textSecondary }]}>Need help with this transaction?</Text>
          <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
        </Pressable>

        <View style={{ height: 32 }} />
      </ScrollView>
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
    content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
    heroCard: {
      borderRadius: Radius.xxl, padding: Spacing.xl, marginBottom: Spacing.base,
      alignItems: 'center', overflow: 'hidden', ...Shadow.lg,
    },
    heroGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.07)' },
    heroIconWrap: { marginBottom: Spacing.md },
    heroAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
    heroIconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
    heroTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF', textAlign: 'center', marginBottom: 4 },
    heroSubtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: Spacing.lg },
    heroAmount: { fontSize: 42, fontWeight: FontWeight.extrabold, color: '#FFFFFF', marginBottom: Spacing.md, letterSpacing: -1 },
    heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 7 },
    heroBadgeDot: { width: 8, height: 8, borderRadius: 4 },
    heroBadgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#FFFFFF' },
    receiptCard: { backgroundColor: colors.surface, borderRadius: Radius.xxl, padding: Spacing.lg, marginBottom: Spacing.base, ...Shadow.sm },
    receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.base, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
    receiptHeaderTitle: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary },
    downloadText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
    receiptLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    receiptValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary, textAlign: 'right', flex: 1, marginLeft: Spacing.base },
    divider: { height: 1 },
    qrCard: { backgroundColor: colors.surface, borderRadius: Radius.xxl, padding: Spacing.lg, marginBottom: Spacing.base, ...Shadow.sm },
    qrInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
    qrTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary },
    qrSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    qrPlaceholder: { alignItems: 'center', padding: Spacing.lg, borderRadius: Radius.xl },
    qrGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 100, height: 100, marginBottom: Spacing.sm },
    qrCell: { width: 20, height: 20 },
    qrRefText: { fontSize: FontSize.xs, color: colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    blockchainCard: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.base, ...Shadow.sm, borderWidth: 1, borderColor: colors.border,
    },
    blockchainTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    blockchainHash: { fontSize: FontSize.xs, color: colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.md },
    actionsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
    actionBtn: {
      flex: 1, alignItems: 'center', gap: Spacing.xs,
      borderRadius: Radius.xl, padding: Spacing.md, ...Shadow.sm,
    },
    actionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textAlign: 'center' },
    supportBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1, ...Shadow.sm,
    },
    supportText: { flex: 1, fontSize: FontSize.sm },
    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    notFoundText: { fontSize: FontSize.base, color: colors.textMuted },
  });
}
