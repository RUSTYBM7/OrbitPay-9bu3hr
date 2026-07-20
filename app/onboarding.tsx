import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions,
  Animated, ScrollView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

const { width: W, height: H } = Dimensions.get('window');

const SLIDES = [
  {
    id: 'hero',
    badge: 'WELCOME TO ORBITPAY',
    title: 'Your Financial\nUniverse,\nUnified.',
    subtitle: 'Bank, invest, trade crypto, pay bills, and send money worldwide — all in one premium super-app.',
    icon: 'account-balance',
    gradient: ['#0F4530', '#1B6B4A'],
    accentColor: '#3DAA7B',
    features: ['Digital Wallet', 'Multi-Currency', 'Instant Transfers'],
  },
  {
    id: 'wallet',
    badge: 'SMART WALLETS',
    title: 'Multi-Currency\nWallet &\nPayments.',
    subtitle: 'Hold USD, EUR, GBP, BTC and more. Send money globally with real-time FX rates and zero hidden fees.',
    icon: 'account-balance-wallet',
    gradient: ['#1D4ED8', '#3B82F6'],
    accentColor: '#60A5FA',
    features: ['20+ Currencies', 'FX in Real-Time', 'Zero Hidden Fees'],
  },
  {
    id: 'crypto',
    badge: 'CRYPTO & INVESTING',
    title: 'Trade Crypto\n& Grow Your\nPortfolio.',
    subtitle: 'Buy and sell Bitcoin, Ethereum, and 200+ coins. Invest in stocks, ETFs, and funds — all from one account.',
    icon: 'currency-bitcoin',
    gradient: ['#B45309', '#F59E0B'],
    accentColor: '#FCD34D',
    features: ['200+ Coins', 'Stock Trading', 'Portfolio Analytics'],
  },
  {
    id: 'security',
    badge: 'BANK-GRADE SECURITY',
    title: 'Face ID &\nBiometric\nProtection.',
    subtitle: 'Military-grade 256-bit encryption, Face ID, fingerprint lock, 2FA, and real-time fraud monitoring keep you safe.',
    icon: 'security',
    gradient: ['#6D28D9', '#8B5CF6'],
    accentColor: '#A78BFA',
    features: ['Face ID / Touch ID', '256-bit Encryption', 'Fraud Alerts'],
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToSlide = useCallback((index: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setCurrentSlide(index);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const handleNext = useCallback(() => {
    if (currentSlide < SLIDES.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      router.replace('/login');
    }
  }, [currentSlide, goToSlide, router]);

  const handleSkip = useCallback(() => {
    router.replace('/login');
  }, [router]);

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: slide.gradient[0] }]}>
      {/* Background gradient simulation */}
      <View style={[styles.bgOverlay, { backgroundColor: slide.gradient[1] }]} />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.md }]}>
        <Image
          source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/Q4JchbpdQ8eur9GkT4Bqa9/Logo_3600%C3%971100_(3800_x_1400_px)_(6500_x_1400_px)_(7800_x_1800_px)_-_1.svg' }}
          style={styles.logoImg}
          contentFit="contain"
        />
        <Pressable style={styles.skipBtn} onPress={handleSkip} hitSlop={12}>
          <Text style={styles.skipText}>Skip</Text>
          <MaterialIcons name="keyboard-arrow-right" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      {/* Main content */}
      <Animated.View style={[styles.mainContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Text style={styles.badgeText}>{slide.badge}</Text>
        </View>

        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' }]}>
          <View style={[styles.iconCircleInner, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <MaterialIcons name={slide.icon as any} size={52} color="#FFFFFF" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {/* Feature pills */}
        <View style={styles.featurePills}>
          {slide.features.map((f, i) => (
            <View key={i} style={[styles.featurePill, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' }]}>
              <MaterialIcons name="check-circle" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.featurePillText}>{f}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Bottom section */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => goToSlide(i)} hitSlop={8}>
              <View style={[
                styles.dot,
                i === currentSlide ? styles.dotActive : styles.dotInactive,
              ]} />
            </Pressable>
          ))}
        </View>

        {/* CTA Button */}
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
          onPress={handleNext}
        >
          <Text style={styles.ctaBtnText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          <View style={styles.ctaIconCircle}>
            <MaterialIcons
              name={isLast ? 'rocket-launch' : 'arrow-forward'}
              size={20}
              color={slide.gradient[0]}
            />
          </View>
        </Pressable>

        {/* Sign in link */}
        <View style={styles.signinRow}>
          <Text style={styles.signinText}>Already have an account?</Text>
          <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
            <Text style={styles.signinLink}> Sign In</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bgOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.4 },
  bgCircle1: {
    position: 'absolute', top: -H * 0.15, right: -W * 0.3,
    width: W * 0.9, height: W * 0.9, borderRadius: W * 0.45,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bgCircle2: {
    position: 'absolute', bottom: -H * 0.1, left: -W * 0.2,
    width: W * 0.75, height: W * 0.75, borderRadius: W * 0.375,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
  },
  logoImg: { width: 130, height: 38, tintColor: '#FFFFFF' },
  skipBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, padding: Spacing.sm },
  skipText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.medium },
  mainContent: {
    flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl,
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'flex-start', borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    marginBottom: Spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.85)', letterSpacing: 1.2 },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl, borderWidth: 1,
  },
  iconCircleInner: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 40, fontWeight: FontWeight.extrabold, color: '#FFFFFF',
    lineHeight: 46, marginBottom: Spacing.lg, letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSize.base, color: 'rgba(255,255,255,0.78)',
    lineHeight: 24, marginBottom: Spacing.xl,
  },
  featurePills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  featurePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderWidth: 1,
  },
  featurePillText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: 'rgba(255,255,255,0.9)' },
  bottom: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  dot: { borderRadius: Radius.pill },
  dotActive: { width: 28, height: 8, backgroundColor: '#FFFFFF' },
  dotInactive: { width: 8, height: 8, backgroundColor: 'rgba(255,255,255,0.35)' },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: Radius.xl, paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.base, ...Shadow.lg,
  },
  ctaBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#0F4530' },
  ctaIconCircle: {
    width: 40, height: 40, borderRadius: Radius.circle,
    backgroundColor: 'rgba(15,69,48,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: Spacing.sm },
  signinText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.65)' },
  signinLink: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#FFFFFF' },
});
