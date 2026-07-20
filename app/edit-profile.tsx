import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

const SECTIONS = [
  {
    title: 'Personal Information',
    items: [
      { id: 'firstName', label: 'First Name', icon: 'person', value: 'Aisha', editable: true },
      { id: 'lastName', label: 'Last Name', icon: 'person-outline', value: 'Mensah', editable: true },
      { id: 'dob', label: 'Date of Birth', icon: 'cake', value: 'March 15, 1992', editable: true },
      { id: 'gender', label: 'Gender', icon: 'wc', value: 'Female', editable: true },
    ],
  },
  {
    title: 'Contact Details',
    items: [
      { id: 'email', label: 'Email Address', icon: 'email', value: 'aisha.mensah@orbitpay.finance', editable: false, verified: true },
      { id: 'phone', label: 'Phone Number', icon: 'phone', value: '+1 (555) 012-3456', editable: true, verified: true },
      { id: 'altEmail', label: 'Secondary Email', icon: 'alternate-email', value: 'Not set', editable: true },
    ],
  },
  {
    title: 'Address',
    items: [
      { id: 'address1', label: 'Street Address', icon: 'home', value: '123 Orbit Street', editable: true },
      { id: 'city', label: 'City', icon: 'location-city', value: 'San Francisco', editable: true },
      { id: 'state', label: 'State / Province', icon: 'map', value: 'California', editable: true },
      { id: 'postal', label: 'Postal Code', icon: 'local-post-office', value: '94102', editable: true },
      { id: 'country', label: 'Country', icon: 'public', value: 'United States', editable: true },
    ],
  },
  {
    title: 'Professional',
    items: [
      { id: 'occupation', label: 'Occupation', icon: 'work', value: 'Software Engineer', editable: true },
      { id: 'employer', label: 'Employer', icon: 'business', value: 'TechCorp Inc.', editable: true },
      { id: 'industry', label: 'Industry', icon: 'domain', value: 'Technology', editable: true },
      { id: 'income', label: 'Annual Income Range', icon: 'attach-money', value: '$100,000 - $150,000', editable: true },
    ],
  },
  {
    title: 'Identity',
    items: [
      { id: 'kyc', label: 'KYC Status', icon: 'verified-user', value: 'Verified · Level 2', editable: false, verified: true },
      { id: 'docType', label: 'Document Type', icon: 'badge', value: "Driver's License", editable: false },
      { id: 'taxId', label: 'Tax ID / SSN', icon: 'description', value: '***-**-4521', editable: false },
      { id: 'nationality', label: 'Nationality', icon: 'flag', value: 'American', editable: true },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { id: 'currency', label: 'Default Currency', icon: 'currency-exchange', value: 'USD', editable: true },
      { id: 'language', label: 'Language', icon: 'language', value: 'English (US)', editable: true },
      { id: 'timezone', label: 'Timezone', icon: 'schedule', value: 'PST (UTC-8)', editable: true },
      { id: 'theme', label: 'App Theme', icon: 'palette', value: 'Light', editable: true },
    ],
  },
];

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const { user } = useWallet();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [completionPct] = useState(78);

  const handleEdit = useCallback((id: string, currentValue: string) => {
    setEditingField(id);
    setFieldValues(prev => ({ ...prev, [id]: prev[id] ?? currentValue }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    setEditingField(null);
    showAlert('Saved!', 'Your profile has been updated successfully.');
  }, [showAlert]);

  const handlePhotoUpload = useCallback(() => {
    showAlert(
      'Update Profile Photo',
      'Choose a photo source.',
      [
        { text: 'Camera', style: 'default', onPress: () => showAlert('Camera', 'Camera access required. Grant permission in Settings.') },
        { text: 'Photo Library', style: 'default', onPress: () => showAlert('Library', 'Selecting from photo library...') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [showAlert]);

  const styles = makeStyles(colors);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color={colors.textOnDark} /> : <Text style={styles.saveBtnText}>Save</Text>}
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* Profile Photo */}
          <View style={styles.photoSection}>
            <Pressable style={styles.photoWrap} onPress={handlePhotoUpload}>
              <Image source={{ uri: user.avatar }} style={styles.profilePhoto} contentFit="cover" transition={200} />
              <View style={[styles.photoEditBadge, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="camera-alt" size={14} color={colors.textOnDark} />
              </View>
            </Pressable>
            <Text style={styles.photoName}>{user.name}</Text>
            <Text style={[styles.photoOrbitId, { color: colors.primary }]}>{user.orbitId}</Text>

            {/* Completion bar */}
            <View style={styles.completionWrap}>
              <Text style={styles.completionLabel}>Profile {completionPct}% complete</Text>
              <View style={styles.completionTrack}>
                <View style={[styles.completionFill, { width: `${completionPct}%` as any, backgroundColor: colors.primary }]} />
              </View>
              <Text style={styles.completionHint}>Add tax ID and secondary email to complete profile</Text>
            </View>
          </View>

          {/* OrbitID Management */}
          <View style={styles.orbitIdCard}>
            <MaterialIcons name="alternate-email" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.orbitIdLabel}>OrbitID</Text>
              <Text style={styles.orbitIdValue}>{user.orbitId}</Text>
              <Text style={styles.orbitIdNote}>Your unique payment identifier. Can be changed once every 30 days.</Text>
            </View>
            <Pressable
              style={[styles.changeBtn, { backgroundColor: colors.cardMint, borderColor: colors.border }]}
              onPress={() => showAlert('Change OrbitID', 'Enter a new OrbitID (3-20 characters, letters and numbers only).')}
            >
              <Text style={[styles.changeBtnText, { color: colors.primary }]}>Change</Text>
            </Pressable>
          </View>

          {/* Sections */}
          {SECTIONS.map(section => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionCard}>
                {section.items.map((item, i) => {
                  const currentValue = fieldValues[item.id] ?? item.value;
                  const isEditing = editingField === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <Pressable
                        style={styles.fieldRow}
                        onPress={() => item.editable && handleEdit(item.id, item.value)}
                        disabled={!item.editable}
                      >
                        <View style={[styles.fieldIcon, { backgroundColor: colors.background }]}>
                          <MaterialIcons name={item.icon as any} size={18} color={colors.primary} />
                        </View>
                        <View style={styles.fieldContent}>
                          <Text style={styles.fieldLabel}>{item.label}</Text>
                          {isEditing ? (
                            <TextInput
                              style={styles.fieldInput}
                              value={currentValue}
                              onChangeText={v => setFieldValues(prev => ({ ...prev, [item.id]: v }))}
                              autoFocus
                              onBlur={() => setEditingField(null)}
                              onSubmitEditing={() => setEditingField(null)}
                              accessibilityLabel={item.label}
                            />
                          ) : (
                            <Text style={[styles.fieldValue, !item.editable && { color: colors.textMuted }]}>
                              {currentValue}
                            </Text>
                          )}
                        </View>
                        <View style={styles.fieldRight}>
                          {(item as any).verified && (
                            <MaterialIcons name="verified" size={14} color={colors.success} style={{ marginRight: 6 }} />
                          )}
                          {item.editable ? (
                            <MaterialIcons name="edit" size={16} color={colors.textMuted} />
                          ) : (
                            <MaterialIcons name="lock" size={14} color={colors.textMuted} />
                          )}
                        </View>
                      </Pressable>
                      {i < section.items.length - 1 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Account Recovery */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Recovery</Text>
            <View style={styles.sectionCard}>
              {[
                { icon: 'email', label: 'Recovery Email', value: 'aisha.m@gmail.com', action: 'Change' },
                { icon: 'phone', label: 'Recovery Phone', value: '+1 (555) 012-3456', action: 'Verified' },
                { icon: 'vpn-key', label: 'Backup Codes', value: '8 codes remaining', action: 'Generate' },
              ].map((item, i) => (
                <React.Fragment key={item.label}>
                  <View style={styles.recoveryRow}>
                    <View style={[styles.fieldIcon, { backgroundColor: colors.background }]}>
                      <MaterialIcons name={item.icon as any} size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>{item.label}</Text>
                      <Text style={styles.fieldValue}>{item.value}</Text>
                    </View>
                    <Pressable
                      style={[styles.changeBtn, { backgroundColor: colors.cardMint, borderColor: colors.border }]}
                      onPress={() => showAlert(item.label, `Manage your ${item.label.toLowerCase()}.`)}
                    >
                      <Text style={[styles.changeBtnText, { color: colors.primary }]}>{item.action}</Text>
                    </Pressable>
                  </View>
                  {i < 2 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Biometric Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biometric Preferences</Text>
            <View style={[styles.biometricCard, { backgroundColor: colors.cardMint, borderColor: colors.border }]}>
              <MaterialIcons name="fingerprint" size={32} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.biometricTitle}>Face ID & Fingerprint</Text>
                <Text style={styles.biometricSub}>Enabled for login, payments, and high-value transactions</Text>
              </View>
              <MaterialIcons name="check-circle" size={20} color={colors.success} />
            </View>
          </View>

          {/* Audit Log */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Changes</Text>
            {[
              { action: 'Profile photo updated', date: 'Jul 10, 2026' },
              { action: 'Phone number verified', date: 'Jul 5, 2026' },
              { action: 'Address updated', date: 'Jun 28, 2026' },
            ].map((log, i) => (
              <View key={i} style={styles.auditRow}>
                <View style={[styles.auditDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.auditAction}>{log.action}</Text>
                <Text style={styles.auditDate}>{log.date}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={[styles.saveFullBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={colors.textOnDark} /> : (
              <>
                <MaterialIcons name="save" size={20} color={colors.textOnDark} />
                <Text style={styles.saveFullBtnText}>Save All Changes</Text>
              </>
            )}
          </Pressable>

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
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 9,
    },
    saveBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textOnDark },
    content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
    photoSection: { alignItems: 'center', paddingVertical: Spacing.xl },
    photoWrap: { position: 'relative', marginBottom: Spacing.md },
    profilePhoto: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: colors.primary },
    photoEditBadge: {
      position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background,
    },
    photoName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: 4 },
    photoOrbitId: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.lg },
    completionWrap: { width: '100%', alignItems: 'center', gap: Spacing.xs },
    completionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    completionTrack: { width: '100%', height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
    completionFill: { height: '100%', borderRadius: 3 },
    completionHint: { fontSize: FontSize.xs, color: colors.textMuted, textAlign: 'center' },
    orbitIdCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.base, ...Shadow.sm, borderWidth: 1, borderColor: colors.border,
    },
    orbitIdLabel: { fontSize: FontSize.xs, color: colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
    orbitIdValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: colors.primary, marginVertical: 2 },
    orbitIdNote: { fontSize: FontSize.xs, color: colors.textMuted, lineHeight: 16 },
    changeBtn: { borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 7, borderWidth: 1, alignSelf: 'flex-start' },
    changeBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
    section: { marginBottom: Spacing.base },
    sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
    sectionCard: { backgroundColor: colors.surface, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.sm },
    fieldRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, minHeight: 60 },
    fieldIcon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    fieldContent: { flex: 1 },
    fieldLabel: { fontSize: FontSize.xs, color: colors.textMuted, marginBottom: 2 },
    fieldValue: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: colors.textPrimary },
    fieldInput: {
      fontSize: FontSize.base, fontWeight: FontWeight.medium, color: colors.primary,
      borderBottomWidth: 1, borderBottomColor: colors.primary, padding: 0, includeFontPadding: false,
    },
    fieldRight: { flexDirection: 'row', alignItems: 'center' },
    divider: { height: 1, marginHorizontal: Spacing.base },
    recoveryRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, minHeight: 60 },
    biometricCard: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      borderRadius: Radius.xl, padding: Spacing.base, borderWidth: 1,
    },
    biometricTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary },
    biometricSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    auditRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm },
    auditDot: { width: 6, height: 6, borderRadius: 3 },
    auditAction: { flex: 1, fontSize: FontSize.sm, color: colors.textSecondary },
    auditDate: { fontSize: FontSize.xs, color: colors.textMuted },
    saveFullBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      backgroundColor: colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg,
      marginTop: Spacing.sm, ...Shadow.md,
    },
    saveFullBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: colors.textOnDark },
  });
}
