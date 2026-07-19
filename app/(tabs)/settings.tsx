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
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../../constants/theme';

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  value?: boolean;
  onValueChange?: (val: boolean) => void;
  isToggle?: boolean;
  danger?: boolean;
  badge?: string;
}

function SettingRow({
  icon, iconColor = Colors.primary, label, subtitle, onPress,
  value, onValueChange, isToggle, danger, badge,
}: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && !isToggle && styles.rowPressed]}
      onPress={!isToggle ? onPress : undefined}
      accessibilityLabel={label}
    >
      <View style={[styles.rowIcon, { backgroundColor: (danger ? Colors.error : iconColor) + '18' }]}>
        <MaterialIcons name={icon as any} size={20} color={danger ? Colors.error : iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {isToggle ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: Colors.border, true: Colors.mint }}
          thumbColor={value ? Colors.primary : Colors.textMuted}
        />
      ) : (
        <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
      )}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const router = useRouter();
  const { user, notifications, unreadCount, markAllNotificationsRead } = useWallet();

  const [biometrics, setBiometrics] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [txAlerts, setTxAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFA, setTwoFA] = useState(true);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Profile Card */}
        <Pressable
          style={styles.profileCard}
          onPress={() => showAlert('Edit Profile', 'Update your personal information, profile photo, and OrbitID.')}
        >
          <Image
            source={{ uri: user.avatar }}
            style={styles.profileAvatar}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <View style={styles.profileBadgeRow}>
              <View style={styles.kycBadge}>
                <MaterialIcons name="verified" size={12} color={Colors.success} />
                <Text style={styles.kycText}>KYC Verified</Text>
              </View>
              <View style={styles.tierBadge}>
                <MaterialIcons name="workspace-premium" size={12} color={Colors.primary} />
                <Text style={styles.tierText}>{user.tier.toUpperCase()}</Text>
              </View>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.textMuted} />
        </Pressable>

        {/* OrbitID */}
        <View style={styles.orbitIdCard}>
          <MaterialIcons name="alternate-email" size={18} color={Colors.primary} />
          <Text style={styles.orbitIdLabel}>OrbitID</Text>
          <Text style={styles.orbitIdValue}>{user.orbitId}</Text>
          <Pressable
            style={styles.copyBtn}
            onPress={() => showAlert('Copied!', 'Your OrbitID has been copied to clipboard.')}
            hitSlop={8}
          >
            <MaterialIcons name="content-copy" size={16} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Notifications Section */}
        <SectionHeader title="Notifications" />
        {unreadCount > 0 && (
          <Pressable style={styles.notifBanner} onPress={markAllNotificationsRead}>
            <MaterialIcons name="notifications-active" size={18} color={Colors.primary} />
            <Text style={styles.notifBannerText}>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</Text>
            <Text style={styles.notifBannerAction}>Mark all read</Text>
          </Pressable>
        )}
        <View style={styles.card}>
          <SettingRow icon="notifications" label="Push Notifications" isToggle value={pushNotifications} onValueChange={setPushNotifications} />
          <View style={styles.divider} />
          <SettingRow icon="receipt" label="Transaction Alerts" isToggle value={txAlerts} onValueChange={setTxAlerts} />
          <View style={styles.divider} />
          <SettingRow icon="campaign" label="Promotions & Offers" subtitle="Cashback, rewards, special deals" onPress={() => showAlert('Promo Settings', 'Manage promotional notifications.')} />
        </View>

        {/* Security Section */}
        <SectionHeader title="Security" />
        <View style={styles.card}>
          <SettingRow icon="fingerprint" label="Biometric Login" isToggle value={biometrics} onValueChange={setBiometrics} />
          <View style={styles.divider} />
          <SettingRow icon="security" label="Two-Factor Auth" isToggle value={twoFA} onValueChange={setTwoFA} iconColor={Colors.success} />
          <View style={styles.divider} />
          <SettingRow icon="lock" label="Change PIN" onPress={() => showAlert('Change PIN', 'Enter your current PIN to set a new one.')} />
          <View style={styles.divider} />
          <SettingRow icon="key" label="Change Password" onPress={() => showAlert('Change Password', 'A reset link will be sent to your email.')} />
          <View style={styles.divider} />
          <SettingRow icon="manage-accounts" label="Trusted Devices" subtitle="3 active devices" onPress={() => showAlert('Trusted Devices', 'Manage devices that can access your account.')} />
        </View>

        {/* KYC & Compliance */}
        <SectionHeader title="Identity & Compliance" />
        <View style={styles.card}>
          <SettingRow icon="verified-user" label="KYC Status" subtitle="Identity verified · Level 2" badge="Verified" iconColor={Colors.success} onPress={() => router.push('/kyc')} />
          <View style={styles.divider} />
          <SettingRow icon="description" label="Tax Documents" subtitle="2024 · 2025 available" onPress={() => showAlert('Tax Docs', 'Download your tax documents for filing.')} />
          <View style={styles.divider} />
          <SettingRow icon="gavel" label="Legal & Compliance" onPress={() => showAlert('Legal', 'View OrbitPay terms, privacy policy, and regulatory disclosures.')} />
        </View>

        {/* Preferences */}
        <SectionHeader title="Preferences" />
        <View style={styles.card}>
          <SettingRow icon="dark-mode" label="Dark Mode" isToggle value={darkMode} onValueChange={setDarkMode} />
          <View style={styles.divider} />
          <SettingRow icon="language" label="Language" subtitle="English (US)" onPress={() => showAlert('Language', 'Select your preferred app language.')} />
          <View style={styles.divider} />
          <SettingRow icon="currency-exchange" label="Default Currency" subtitle="USD" onPress={() => showAlert('Currency', 'Change your default display currency.')} />
          <View style={styles.divider} />
          <SettingRow icon="schedule" label="Auto-Save Schedule" subtitle="$500/month active" onPress={() => showAlert('Auto-Save', 'Configure automatic savings rules.')} />
        </View>

        {/* Support */}
        <SectionHeader title="Support" />
        <View style={styles.card}>
          <SettingRow icon="headset-mic" label="AI Support" subtitle="24/7 instant help" onPress={() => showAlert('AI Support', 'OrbitPay AI assistant is ready to help.')} badge="AI" />
          <View style={styles.divider} />
          <SettingRow icon="chat" label="Live Chat" subtitle="Avg. response: 2 min" onPress={() => showAlert('Live Chat', 'Connecting you to a support agent...')} />
          <View style={styles.divider} />
          <SettingRow icon="bug-report" label="Report a Problem" onPress={() => showAlert('Report Problem', 'Describe the issue and we will investigate promptly.')} />
          <View style={styles.divider} />
          <SettingRow icon="star-rate" label="Rate OrbitPay" onPress={() => showAlert('Rate Us', 'Thank you! Your feedback helps us improve.')} />
        </View>

        {/* Account Actions */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
          <SettingRow icon="logout" label="Log Out" danger onPress={() => showAlert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => showAlert('Logged Out', 'You have been securely logged out.') },
          ])} />
          <View style={styles.divider} />
          <SettingRow icon="delete-forever" label="Close Account" danger onPress={() => showAlert('Close Account', 'This action is irreversible. Please contact support to proceed.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Contact Support', style: 'default' },
          ])} />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>OrbitPay Finance · Version 3.1.0</Text>
          <Text style={styles.appInfoText}>© 2026 OrbitPay Inc. All rights reserved.</Text>
          <Text style={styles.appInfoText}>FDIC Insured · Licensed Money Transmitter</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  content: { paddingHorizontal: Spacing.base },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  profileAvatar: { width: 60, height: 60, borderRadius: Radius.circle, marginRight: Spacing.md },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  profileEmail: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, marginBottom: Spacing.xs },
  profileBadgeRow: { flexDirection: 'row', gap: Spacing.sm },
  kycBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.successBg, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 3,
  },
  kycText: { fontSize: 10, color: Colors.success, fontWeight: FontWeight.bold },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.background, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  tierText: { fontSize: 10, color: Colors.primary, fontWeight: FontWeight.bold },
  orbitIdCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.cardMint, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border,
  },
  orbitIdLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  orbitIdValue: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  copyBtn: { padding: 4 },
  sectionHeader: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm, marginTop: Spacing.md,
  },
  notifBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.cardMint, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  notifBannerText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  notifBannerAction: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, overflow: 'hidden',
    marginBottom: Spacing.sm, ...Shadow.sm,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.base, minHeight: 56,
  },
  rowPressed: { backgroundColor: Colors.background },
  rowIcon: {
    width: 40, height: 40, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  rowLabelDanger: { color: Colors.error },
  rowSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  badge: {
    backgroundColor: Colors.successBg, borderRadius: Radius.pill,
    paddingHorizontal: 8, paddingVertical: 3, marginRight: Spacing.sm,
  },
  badgeText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.bold },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: Spacing.base },
  appInfo: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  appInfoText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
});
