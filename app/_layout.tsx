import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider, AuthProvider } from '@/template';
import { WalletProvider } from '../contexts/WalletContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { BiometricLock } from '../components/BiometricLock';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <WalletProvider>
              <BiometricLock>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="login" />
                  <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
                  <Stack.Screen name="send-money" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="kyc" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="crypto-detail" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="pay-bills" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                  <Stack.Screen name="scan-qr" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
                  <Stack.Screen name="receive-qr" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="analytics" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="ai-chat" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="card-controls" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="transactions" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="auto-save" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="crypto-trade" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="wire-transfer" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="rewards" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="loan" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="split-bill" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                  <Stack.Screen name="budget" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="subscriptions" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="transaction-detail" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
                </Stack>
              </BiometricLock>
            </WalletProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
