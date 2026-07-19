import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, AppState, AppStateStatus,
  ActivityIndicator, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBiometric } from '../hooks/useBiometric';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

interface BiometricLockProps {
  children: React.ReactNode;
}

const LOCK_TIMEOUT_MS = 30_000; // 30 seconds in background before locking

export function BiometricLock({ children }: BiometricLockProps) {
  const { isSupported, isEnrolled, biometricType, authenticate } = useBiometric();
  const [locked, setLocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [failed, setFailed] = useState(false);
  const backgroundTime = useRef<number | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const unlock = useCallback(async () => {
    if (!isSupported || !isEnrolled) {
      setLocked(false);
      return;
    }
    setAuthenticating(true);
    setFailed(false);
    const ok = await authenticate('Unlock OrbitPay');
    setAuthenticating(false);
    if (ok) {
      setLocked(false);
    } else {
      setFailed(true);
    }
  }, [isSupported, isEnrolled, authenticate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState === 'background') {
        backgroundTime.current = Date.now();
      } else if (nextState === 'active' && backgroundTime.current !== null) {
        const elapsed = Date.now() - backgroundTime.current;
        backgroundTime.current = null;
        if (elapsed >= LOCK_TIMEOUT_MS && isSupported && isEnrolled) {
          setLocked(true);
        }
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [isSupported, isEnrolled]);

  // Auto-prompt when lock screen appears
  useEffect(() => {
    if (locked) {
      const timer = setTimeout(unlock, 400);
      return () => clearTimeout(timer);
    }
  }, [locked, unlock]);

  const iconName = biometricType === 'face' ? 'face' : 'fingerprint';
  const label = biometricType === 'face' ? 'Face ID' : 'Fingerprint';

  return (
    <>
      {children}
      <Modal visible={locked} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            {/* Logo */}
            <View style={styles.logoWrap}>
              <MaterialIcons name="account-balance" size={36} color={Colors.textOnDark} />
            </View>
            <Text style={styles.title}>OrbitPay Finance</Text>
            <Text style={styles.subtitle}>App locked for your security</Text>

            {/* Biometric Icon */}
            <Pressable
              style={[styles.biometricBtn, authenticating && styles.biometricBtnActive]}
              onPress={unlock}
              disabled={authenticating}
              accessibilityLabel={`Unlock with ${label}`}
            >
              {authenticating ? (
                <ActivityIndicator color={Colors.textOnDark} size="large" />
              ) : (
                <MaterialIcons name={iconName as any} size={48} color={failed ? Colors.error : Colors.textOnDark} />
              )}
            </Pressable>

            <Text style={styles.biometricLabel}>
              {authenticating ? 'Authenticating…' : failed ? 'Authentication failed' : `Unlock with ${label}`}
            </Text>

            {failed && (
              <Pressable style={styles.retryBtn} onPress={unlock}>
                <MaterialIcons name="refresh" size={16} color={Colors.primary} />
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            )}

            <View style={styles.trustRow}>
              <MaterialIcons name="lock" size={12} color="rgba(255,255,255,0.5)" />
              <Text style={styles.trustText}>256-bit encrypted · FDIC Insured</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Lightweight hook for inline biometric confirmation (e.g., Send Money confirm step)
export { useBiometric };

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 320,
    backgroundColor: Colors.primary,
    borderRadius: Radius.xxl,
    padding: Spacing.xxxl,
    alignItems: 'center',
    ...Shadow.lg,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.circle,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textOnDark,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  biometricBtn: {
    width: 96,
    height: 96,
    borderRadius: Radius.circle,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  biometricBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  biometricLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: Spacing.lg,
    fontWeight: FontWeight.medium,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    marginBottom: Spacing.lg,
  },
  retryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  trustText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
});
