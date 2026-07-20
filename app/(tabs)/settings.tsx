import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useRouter } from 'expo-router';
import { useWallet } from '../../hooks/useWallet';
import { useTheme } from '../../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../../constants/theme';

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{title}</Text>;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const router = useRouter();
  const { user, unreadCount, markAllNotificationsRead } = useWallet();
  const { isDark, toggleTheme, colors } = useTheme();

  const [biometrics, setBiometrics] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [txAlerts, setTxAlerts] = useState(true);
  const [twoFA, setTwoFA] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [autoLock, setAutoLock] = useState(true);

  const SettingRow = ({
    icon, iconColor = colors.primary, label, subtitle, onPress,
    value, onValueChange, isToggle, danger, badge, chevron = true,
  }: {
    icon: string; iconColor?: string; label: string; subtitle?: string; onPress?: () => void;
    value?: boolean; onValueChange?: (v: boolean) => void; isToggle?: boolean; danger?: boolean; badge?: string; chevron?: boolean;
  }) => (
    <Pressable
      style={({ pressed }) => [rowStyle(colors), pressed && !isToggle && { backgroundColor: colors.background }]}
      onPress={!isToggle ? onPress : undefined}
      accessibilityLabel={label}
    >
      <View style={[styles.rowIcon, { backgroundColor: (danger ? colors.error : iconColor) + '18' }]}>
        <MaterialIcons name={icon as any} size={20} color={danger ? colors.error : iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: danger ? colors.error : colors.textPrimary }]}>{label}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: colors.successBg }]}>
          <Text style={[styles.badgeText, { color: colors.success }]}>{badge}</Text>
        </View>
      )}
      {isToggle ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.mint }}
          thumbColor={value ? colors.primary : colors.textMuted}
        />
      ) : chevron ? (
        <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
        <Pressable style={[styles.editBtn, { backgroundColor: colors.surface }]} onPress={() => router.push('/edit-profile')} hitSlop={8}>
          <MaterialIcons name="edit" size={18} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Profile Card */}
        <Pressable
          style={[styles.profileCard, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/edit-profile')}
        >
          <View style={styles.profileCardGlow} />
          <Image source={{ uri: user.avatar }} style={styles.profileAvatar} contentFit="cover" transition={200} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <View style={styles.profileBadgeRow}>
              <View style={[styles.kycBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <MaterialIcons name="verified" size={12} color="#FFFFFF" />
                <Text style={styles.kycText}>KYC Verified</Text>
              </View>
              <View style={[styles.tierBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <MaterialIcons name="workspace-premium" size={12} color="#FFD700" />
                <Text style={styles.tierText}>{user.tier.toUpperCase()}</Text>
              </View>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>

        {/* OrbitID */}
        <View style={[styles.orbitIdCard, { backgroundColor: colors.cardMint, borderColor: colors.border }]}>
          <MaterialIcons name="alternate-email" size={18} color={colors.primary} />
          <Text style={[styles.orbitIdLabel, { color: colors.textMuted }]}>OrbitID</Text>
          <Text style={[styles.orbitIdValue, { color: colors.primary }]}>{user.orbitId}</Text>
          <Pressable style={styles.copyBtn} onPress={() => showAlert('Copied!', 'Your OrbitID has been copied.')} hitSlop={8}>
            <MaterialIcons name="content-copy" size={16} color={colors.primary} />
          </Pressable>
        </View>

        {/* Profile Completion */}
        <View style={[styles.completionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.completionHeader}>
            <Text style={[styles.completionTitle, { color: colors.textPrimary }]}>Profile Completion</Text>
            <Text style={[styles.completionPct, { color: colors.primary }]}>78%</Text>
          </View>
          <View style={[styles.completionTrack, { backgroundColor: colors.background }]}>
            <View style={[styles.completionFill, { width: '78%', backgroundColor: colors.primary }]} />
          </View>
          <Pressable onPress={() => router.push('/edit-profile')}>
            <Text style={[styles.completionCta, { color: colors.primary }]}>Complete profile → +15% rewards bonus</Text>
          </Pressable>
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" colors={colors} />
        {unreadCount > 0 && (
          <Pressable style={[styles.notifBanner, { backgroundColor: colors.cardMint, borderColor: colors.border }]} onPress={markAllNotificationsRead}>
            <MaterialIcons name="notifications-active" size={18} color={colors.primary} />
            <Text style={[styles.notifBannerText, { color: colors.textSecondary }]}>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</Text>
            <Text style={[styles.notifBannerAction, { color: colors.primary }]}>Mark all read</Text>
          </Pressable>
        )}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow icon="notifications" label="Push Notifications" isToggle value={pushNotifications} onValueChange={setPushNotifications} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="receipt" label="Transaction Alerts" isToggle value={txAlerts} onValueChange={setTxAlerts} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="campaign" label="Promotions & Offers" subtitle="Cashback, rewards, special deals" isToggle value={marketingEmails} onValueChange={setMarketingEmails} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="notifications-none" label="Notification History" onPress={() => router.push('/notifications')} />
        </View>

        {/* Security */}
        <SectionHeader title="Security" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow icon="fingerprint" label="Biometric Login" isToggle value={biometrics} onValueChange={setBiometrics} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="security" label="Two-Factor Auth" isToggle value={twoFA} onValueChange={setTwoFA} iconColor={colors.success} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="timer" label="Auto-Lock" subtitle="Lock after 5 min inactivity" isToggle value={autoLock} onValueChange={setAutoLock} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="lock" label="Change PIN" onPress={() => router.push('/card-controls')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="key" label="Change Password" onPress={() => showAlert('Change Password', 'A reset link will be sent to your email.')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="devices" label="Trusted Devices" subtitle="3 active devices" onPress={() => showAlert('Trusted Devices', 'Manage devices that can access your account.')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="history" label="Login History" subtitle="Last: iPhone 16 · Today" onPress={() => showAlert('Login History', 'View all recent login activity.')} />
        </View>

        {/* KYC & Compliance */}
        <SectionHeader title="Identity & Compliance" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow icon="verified-user" label="KYC Status" subtitle="Identity verified · Level 2" badge="Verified" iconColor={colors.success} onPress={() => router.push('/kyc')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="description" label="Tax Documents" subtitle="2024 · 2025 available" onPress={() => showAlert('Tax Docs', 'Download your tax documents for filing.')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="account-balance" label="Linked Bank Accounts" subtitle="2 accounts connected" onPress={() => showAlert('Linked Accounts', 'Manage your connected bank accounts, cards, and crypto wallets.')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="gavel" label="Legal & Compliance" onPress={() => showAlert('Legal', 'View OrbitPay terms, privacy policy, and regulatory disclosures.')} />
        </View>

        {/* Finance Tools */}
        <SectionHeader title="Finance Tools" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow icon="analytics" label="Spending Analytics" subtitle="Category breakdown & trends" onPress={() => router.push('/analytics')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="savings" label="Budget Planner" subtitle="Set & track monthly limits" onPress={() => router.push('/budget')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="subscriptions" label="Subscriptions" subtitle="Manage recurring charges" onPress={() => router.push('/subscriptions')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="autorenew" label="Auto-Save Rules" subtitle="Manage savings automation" onPress={() => router.push('/auto-save')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="receipt-long" label="All Transactions" subtitle="Filter & search history" onPress={() => router.push('/transactions')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="stars" label="Rewards & Cashback" subtitle="18,420 pts · $184.20 earned" onPress={() => router.push('/rewards')} />
        </View>

        {/* Preferences */}
        <SectionHeader title="Preferences" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow
            icon={isDark ? 'light-mode' : 'dark-mode'}
            label="Dark Mode"
            isToggle
            value={isDark}
            onValueChange={toggleTheme}
          />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="language" label="Language" subtitle="English (US)" onPress={() => showAlert('Language', 'Select your preferred app language.')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="currency-exchange" label="Default Currency" subtitle="USD" onPress={() => showAlert('Currency', 'Change your default display currency.')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="accessible" label="Accessibility" subtitle="Text size, contrast, screen reader" onPress={() => showAlert('Accessibility', 'Adjust accessibility settings.')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="palette" label="App Theme" subtitle="Light · Mint accent" onPress={() => showAlert('Theme', 'Customize app appearance and accent colors.')} />
        </View>

        {/* Data & Privacy */}
        <SectionHeader title="Data & Privacy" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow icon="file-download" label="Export My Data" subtitle="Download account history & statements" onPress={() => showAlert('Export Data', 'A CSV export will be sent to your email within 24 hours.')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="privacy-tip" label="Privacy Settings" subtitle="Data usage, analytics, personalization" onPress={() => showAlert('Privacy', 'Manage how OrbitPay uses your data.')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="policy" label="Privacy Policy" onPress={() => showAlert('Privacy Policy', 'View OrbitPay Privacy Policy at orbitpay.finance/privacy')} />
        </View>

        {/* Support */}
        <SectionHeader title="Support & Help" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow icon="headset-mic" label="AI Support" subtitle="24/7 instant help" badge="AI" onPress={() => router.push('/ai-chat')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="chat" label="Live Chat" subtitle="Avg. response: 2 min" onPress={() => showAlert('Live Chat', 'Connecting you to a support agent...')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="quiz" label="Help Center & FAQs" onPress={() => showAlert('Help Center', 'Visit help.orbitpay.finance for articles and guides.')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="bug-report" label="Report a Problem" onPress={() => showAlert('Report Problem', 'Describe the issue and we will investigate promptly.')} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="star-rate" label="Rate OrbitPay" onPress={() => showAlert('Rate Us', 'Thank you! Your feedback helps us improve.')} />
        </View>

        {/* Account */}
        <SectionHeader title="Account" colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SettingRow icon="logout" label="Log Out" danger onPress={() => showAlert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => showAlert('Logged Out', 'You have been securely logged out.') },
          ])} />
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <SettingRow icon="delete-forever" label="Close Account" danger onPress={() => showAlert('Close Account', 'This action is irreversible. Please contact support to proceed.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Contact Support', style: 'default' },
          ])} />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: colors.textMuted }]}>OrbitPay Finance · Version 3.2.0</Text>
          <Text style={[styles.appInfoText, { color: colors.textMuted }]}>© 2026 OrbitPay Inc. All rights reserved.</Text>
          <Text style={[styles.appInfoText, { color: colors.textMuted }]}>FDIC Insured · Licensed Money Transmitter</Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const rowStyle = (colors: any) => ({
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  padding: Spacing.base,
  minHeight: 56,
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  editBtn: { width: 38, height: 38, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  content: { paddingHorizontal: Spacing.base },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: Radius.xxl,
    padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.md, overflow: 'hidden',
  },
  profileCardGlow: { position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)' },
  profileAvatar: { width: 64, height: 64, borderRadius: Radius.circle, marginRight: Spacing.md, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  profileEmail: { fontSize: FontSize.xs, marginTop: 2, marginBottom: Spacing.xs, color: 'rgba(255,255,255,0.75)' },
  profileBadgeRow: { flexDirection: 'row', gap: Spacing.sm },
  kycBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 3 },
  kycText: { fontSize: 10, fontWeight: FontWeight.bold, color: '#FFFFFF' },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 3 },
  tierText: { fontSize: 10, fontWeight: FontWeight.bold, color: '#FFD700' },
  orbitIdCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1 },
  orbitIdLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  orbitIdValue: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  copyBtn: { padding: 4 },
  completionCard: { borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.base, ...Shadow.sm },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  completionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  completionPct: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  completionTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: Spacing.xs },
  completionFill: { height: '100%', borderRadius: 3 },
  completionCta: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  sectionHeader: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm, marginTop: Spacing.md },
  notifBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1 },
  notifBannerText: { flex: 1, fontSize: FontSize.sm },
  notifBannerAction: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  card: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.sm, ...Shadow.sm },
  rowIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: FontSize.base, fontWeight: FontWeight.medium },
  rowSubtitle: { fontSize: FontSize.xs, marginTop: 2 },
  badge: { borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 3, marginRight: Spacing.sm },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  divider: { height: 1, marginHorizontal: Spacing.base },
  appInfo: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  appInfoText: { fontSize: FontSize.xs, textAlign: 'center' },
});
