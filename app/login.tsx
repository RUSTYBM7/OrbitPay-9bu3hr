import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuth, useAlert } from '@/template';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

type Mode = 'login' | 'register' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { signInWithPassword, signUpWithPassword, sendOTP, verifyOTPAndLogin, operationLoading } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) {
      showAlert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    const { error } = await signInWithPassword(email.trim(), password);
    if (error) showAlert('Login Failed', error);
  }, [email, password, signInWithPassword, showAlert]);

  const handleRegister = useCallback(async () => {
    if (!email.trim() || !password || !confirmPassword) {
      showAlert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    const { error } = await sendOTP(email.trim());
    if (error) { showAlert('Error', error); return; }
    setMode('otp');
    showAlert('Code Sent', `A 4-digit verification code was sent to ${email}.`);
  }, [email, password, confirmPassword, sendOTP, showAlert]);

  const handleVerifyOTP = useCallback(async () => {
    if (otp.length !== 4) {
      showAlert('Invalid Code', 'Please enter the 4-digit code from your email.');
      return;
    }
    const { error } = await verifyOTPAndLogin(email.trim(), otp, { password });
    if (error) showAlert('Verification Failed', error);
  }, [email, otp, password, verifyOTPAndLogin, showAlert]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Logo / Hero */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <MaterialIcons name="account-balance" size={40} color={Colors.textOnDark} />
          </View>
          <Text style={styles.brandName}>OrbitPay Finance</Text>
          <Text style={styles.tagline}>Your financial universe, unified</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Mode Toggle */}
          {mode !== 'otp' && (
            <View style={styles.modeToggle}>
              <Pressable
                style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
                onPress={() => setMode('login')}
              >
                <Text style={[styles.modeBtnText, mode === 'login' && styles.modeBtnTextActive]}>Sign In</Text>
              </Pressable>
              <Pressable
                style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
                onPress={() => setMode('register')}
              >
                <Text style={[styles.modeBtnText, mode === 'register' && styles.modeBtnTextActive]}>Create Account</Text>
              </Pressable>
            </View>
          )}

          {mode === 'otp' ? (
            <>
              <Text style={styles.cardTitle}>Verify Email</Text>
              <Text style={styles.cardSubtitle}>Enter the 4-digit code sent to {email}</Text>
              <View style={styles.otpRow}>
                {[0,1,2,3].map(i => (
                  <View key={i} style={[styles.otpBox, otp.length > i && styles.otpBoxFilled]}>
                    <Text style={styles.otpChar}>{otp[i] || ''}</Text>
                  </View>
                ))}
              </View>
              <TextInput
                style={styles.hiddenOtpInput}
                value={otp}
                onChangeText={v => setOtp(v.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                autoFocus
                accessibilityLabel="OTP code"
              />
              <Pressable
                style={[styles.primaryBtn, operationLoading && styles.primaryBtnDisabled]}
                onPress={handleVerifyOTP}
                disabled={operationLoading}
              >
                {operationLoading ? <ActivityIndicator color={Colors.textOnDark} /> : (
                  <Text style={styles.primaryBtnText}>Verify & Create Account</Text>
                )}
              </Pressable>
              <Pressable onPress={() => setMode('register')} style={styles.backLink}>
                <MaterialIcons name="arrow-back" size={16} color={Colors.primary} />
                <Text style={styles.linkText}>Back</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>{mode === 'login' ? 'Welcome back' : 'Join OrbitPay'}</Text>

              {/* Email */}
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="email" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  accessibilityLabel="Email"
                />
              </View>

              {/* Password */}
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons name="lock" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  accessibilityLabel="Password"
                />
                <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8}>
                  <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={18} color={Colors.textMuted} />
                </Pressable>
              </View>

              {/* Confirm Password (register only) */}
              {mode === 'register' && (
                <>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputWrap}>
                    <MaterialIcons name="lock-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPassword}
                      accessibilityLabel="Confirm password"
                    />
                  </View>
                </>
              )}

              {/* Forgot Password */}
              {mode === 'login' && (
                <Pressable style={styles.forgotBtn} onPress={() => showAlert('Reset Password', 'A reset link will be sent to your email address.')}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              )}

              {/* Primary CTA */}
              <Pressable
                style={[styles.primaryBtn, operationLoading && styles.primaryBtnDisabled]}
                onPress={mode === 'login' ? handleLogin : handleRegister}
                disabled={operationLoading}
              >
                {operationLoading ? <ActivityIndicator color={Colors.textOnDark} /> : (
                  <>
                    <MaterialIcons name={mode === 'login' ? 'login' : 'person-add'} size={20} color={Colors.textOnDark} />
                    <Text style={styles.primaryBtnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
                  </>
                )}
              </Pressable>

              {/* Trust Badges */}
              <View style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <MaterialIcons name="lock" size={12} color={Colors.textMuted} />
                  <Text style={styles.trustText}>256-bit SSL</Text>
                </View>
                <View style={styles.trustItem}>
                  <MaterialIcons name="verified-user" size={12} color={Colors.textMuted} />
                  <Text style={styles.trustText}>FDIC Insured</Text>
                </View>
                <View style={styles.trustItem}>
                  <MaterialIcons name="security" size={12} color={Colors.textMuted} />
                  <Text style={styles.trustText}>2FA Protected</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <Text style={styles.legal}>
          By continuing, you agree to OrbitPay{`'`}s Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
  content: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  hero: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  logoWrap: {
    width: 80, height: 80, borderRadius: Radius.circle,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  brandName: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textOnDark, letterSpacing: -0.5 },
  tagline: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: Spacing.xs },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xxl,
    padding: Spacing.xl, ...Shadow.lg,
  },
  modeToggle: {
    flexDirection: 'row', backgroundColor: Colors.background,
    borderRadius: Radius.pill, padding: 4, marginBottom: Spacing.xl,
  },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.pill },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  modeBtnTextActive: { color: Colors.textOnDark },
  cardTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xl },
  inputLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, includeFontPadding: false },
  forgotBtn: { alignSelf: 'flex-end', marginTop: Spacing.xs, marginBottom: Spacing.sm },
  forgotText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg,
    marginTop: Spacing.xl, ...Shadow.md,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.base, marginTop: Spacing.xl },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { fontSize: 10, color: Colors.textMuted },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginVertical: Spacing.xl },
  otpBox: {
    width: 56, height: 64, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.cardMint },
  otpChar: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  hiddenOtpInput: { position: 'absolute', opacity: 0, height: 0 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: Spacing.lg },
  linkText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  legal: { textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: Spacing.xl, lineHeight: 16 },
});
