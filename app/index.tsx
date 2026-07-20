import { AuthRouter } from '@/template';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

const ONBOARDING_KEY = '@orbitpay_onboarding_done';

export default function RootScreen() {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      if (val === 'true') {
        setOnboardingDone(true);
      } else {
        // Mark as done after first check — subsequent launches skip onboarding
        AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        setOnboardingDone(false);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B6B4A' }}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <AuthRouter loginRoute="/login">
      <Redirect href="/(tabs)" />
    </AuthRouter>
  );
}
