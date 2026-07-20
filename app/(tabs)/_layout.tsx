import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const tabBarHeight = Platform.select({ ios: insets.bottom + 68, android: insets.bottom + 64, default: 72 });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          height: tabBarHeight,
          paddingTop: 10,
          paddingBottom: Platform.select({ ios: insets.bottom + 6, android: insets.bottom + 6, default: 10 }),
          paddingHorizontal: 4,
          backgroundColor: isDark ? 'rgba(13, 31, 23, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          borderTopWidth: 0.5,
          borderTopColor: isDark ? 'rgba(61,170,123,0.2)' : 'rgba(45,122,90,0.1)',
          // iOS blur effect via elevation
          ...Platform.select({
            ios: {
              shadowColor: isDark ? '#000' : '#0F4530',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark ? 0.4 : 0.08,
              shadowRadius: 20,
            },
            android: {
              elevation: 24,
            },
          }),
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={isDark ? 80 : 70}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark ? 'rgba(13, 31, 23, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                },
              ]}
            />
          ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? 'rgba(78,138,106,0.7)' : 'rgba(122,171,142,0.8)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          borderRadius: 14,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabIconStyle.wrap, focused && { backgroundColor: colors.primary + '18' }]}>
              <MaterialIcons name={focused ? 'home' : 'home'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transfer"
        options={{
          title: 'Transfer',
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabIconStyle.wrap, focused && { backgroundColor: colors.primary + '18' }]}>
              <MaterialIcons name={focused ? 'swap-horiz' : 'swap-horiz'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabIconStyle.wrap, focused && { backgroundColor: colors.primary + '18' }]}>
              <MaterialIcons name={focused ? 'account-balance-wallet' : 'account-balance-wallet'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cards',
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabIconStyle.wrap, focused && { backgroundColor: colors.primary + '18' }]}>
              <MaterialIcons name={focused ? 'credit-card' : 'credit-card'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[tabIconStyle.wrap, focused && { backgroundColor: colors.primary + '18' }]}>
              <MaterialIcons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const tabIconStyle = StyleSheet.create({
  wrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
});
