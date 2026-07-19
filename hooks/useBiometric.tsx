import { useState, useCallback, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricState {
  isSupported: boolean;
  isEnrolled: boolean;
  biometricType: 'fingerprint' | 'face' | 'iris' | 'none';
  isAuthenticating: boolean;
  authenticate: (reason?: string) => Promise<boolean>;
  checkSupport: () => Promise<void>;
}

export function useBiometric(): BiometricState {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'iris' | 'none'>('none');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const checkSupport = useCallback(async () => {
    try {
      const supported = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      setIsSupported(supported);
      setIsEnrolled(enrolled);

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('face');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('iris');
      } else {
        setBiometricType('none');
      }
    } catch {
      setIsSupported(false);
      setIsEnrolled(false);
      setBiometricType('none');
    }
  }, []);

  const authenticate = useCallback(async (reason = 'Authenticate to continue'): Promise<boolean> => {
    if (!isSupported || !isEnrolled) return true; // fallback: allow if not available

    setIsAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isSupported, isEnrolled]);

  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  return { isSupported, isEnrolled, biometricType, isAuthenticating, authenticate, checkSupport };
}
