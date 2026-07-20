import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  Animated, Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';

type CardAction = 'controls' | 'limits' | 'pin' | 'replace';

const MERCHANT_CATEGORIES = [
  { id: 'online', label: 'Online Payments', icon: 'shopping-cart', desc: 'E-commerce & web purchases' },
  { id: 'contactless', label: 'Contactless / NFC', icon: 'contactless', desc: 'Tap-to-pay at terminals' },
  { id: 'international', label: 'International', icon: 'public', desc: 'Transactions outside US' },
  { id: 'atm', label: 'ATM Withdrawals', icon: 'local-atm', desc: 'Cash from ATM machines' },
  { id: 'recurring', label: 'Recurring Billing', icon: 'autorenew', desc: 'Subscriptions & auto-payments' },
  { id: 'gambling', label: 'Gambling', icon: 'casino', desc: 'Gaming & wagering sites' },
];

export default function CardControlsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { cards } = useWallet();
  const { colors } = useTheme();

  const [selectedCard, setSelectedCard] = useState(0);
  const [section, setSection] = useState<CardAction | null>(null);
  const [freezeAnim] = useState(new Animated.Value(0));
  const [spendingLimit, setSpendingLimit] = useState('10000');
  const [dailyLimit, setDailyLimit] = useState('2000');
  const [singleTxLimit, setSingleTxLimit] = useState('500');
  const [merchantToggles, setMerchantToggles] = useState<Record<string, boolean>>({
    online: true,
    contactless: true,
    international: false,
    atm: true,
    recurring: true,
    gambling: false,
  });
  const [pinStep, setPinStep] = useState<'current' | 'new' | 'confirm' | 'done'>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [replaceStep, setReplaceStep] = useState<'reason' | 'address' | 'confirm' | 'done'>('reason');
  const [replaceReason, setReplaceReason] = useState('');
  const [frozen, setFrozen] = useState(false);

  const card = cards[selectedCard];

  const animateFreezeToggle = useCallback((toFrozen: boolean) => {
    Animated.spring(freezeAnim, {
      toValue: toFrozen ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
    setFrozen(toFrozen);
  }, [freezeAnim]);

  const handleFreeze = useCallback(() => {
    const newFrozen = !frozen;
    animateFreezeToggle(newFrozen);
    showAlert(
      newFrozen ? 'Card Frozen' : 'Card Unfrozen',
      newFrozen
        ? `Your ${card.type} card ending in ${card.last4} has been frozen. No transactions will be processed.`
        : `Your card is now active and ready to use.`
    );
  }, [frozen, card, animateFreezeToggle, showAlert]);

  const handleMerchantToggle = useCallback((id: string) => {
    setMerchantToggles(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSaveLimits = useCallback(() => {
    showAlert('Limits Updated', `Monthly: $${spendingLimit}\nDaily: $${dailyLimit}\nPer Transaction: $${singleTxLimit}`);
    setSection(null);
  }, [spendingLimit, dailyLimit, singleTxLimit, showAlert]);

  const handlePinChange = useCallback(() => {
    if (pinStep === 'current') {
      if (currentPin.length < 4) { showAlert('Invalid PIN', 'Enter your current 4-digit PIN.'); return; }
      setPinStep('new');
    } else if (pinStep === 'new') {
      if (newPin.length < 4) { showAlert('Invalid PIN', 'New PIN must be 4 digits.'); return; }
      setPinStep('confirm');
    } else if (pinStep === 'confirm') {
      if (confirmPin !== newPin) { showAlert('Mismatch', 'PINs do not match. Try again.'); setConfirmPin(''); return; }
      setPinStep('done');
    }
  }, [pinStep, currentPin, newPin, confirmPin, showAlert]);

  const freezeScale = freezeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  const freezeBg = frozen ? colors.warningBg : colors.successBg;

  const styles = makeStyles(colors);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => section ? setSection(null) : router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {section === 'limits' ? 'Spending Limits' :
           section === 'pin' ? 'Change PIN' :
           section === 'replace' ? 'Replace Card' :
           'Card Controls'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {!section && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Card Selector */}
          {cards.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              {cards.map((c, i) => (
                <Pressable
                  key={c.id}
                  style={[styles.cardChip, selectedCard === i && styles.cardChipActive]}
                  onPress={() => setSelectedCard(i)}
                >
                  <MaterialIcons name="credit-card" size={14} color={selectedCard === i ? colors.textOnDark : colors.textSecondary} />
                  <Text style={[styles.cardChipText, selectedCard === i && styles.cardChipTextActive]}>
                    •••{c.last4}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Freeze Card */}
          <Animated.View style={[styles.freezeCard, { backgroundColor: freezeBg, transform: [{ scale: freezeScale }] }]}>
            <View style={styles.freezeLeft}>
              <MaterialIcons
                name={frozen ? 'pause-circle-filled' : 'check-circle'}
                size={28}
                color={frozen ? colors.warning : colors.success}
              />
              <View style={{ marginLeft: Spacing.md }}>
                <Text style={[styles.freezeTitle, { color: frozen ? colors.warning : colors.success }]}>
                  {frozen ? 'Card Frozen' : 'Card Active'}
                </Text>
                <Text style={styles.freezeSub}>
                  {frozen ? 'All transactions blocked' : `Card ending in ${card.last4}`}
                </Text>
              </View>
            </View>
            <Pressable
              style={[styles.freezeToggleBtn, { backgroundColor: frozen ? colors.warning : colors.primary }]}
              onPress={handleFreeze}
            >
              <MaterialIcons name={frozen ? 'lock-open' : 'lock'} size={18} color={colors.textOnDark} />
              <Text style={styles.freezeToggleTxt}>{frozen ? 'Unfreeze' : 'Freeze'}</Text>
            </Pressable>
          </Animated.View>

          {/* Control Menu */}
          <View style={styles.menuCard}>
            {[
              { id: 'limits' as CardAction, icon: 'tune', label: 'Spending Limits', sub: `Monthly: $${spendingLimit}`, color: colors.primary },
              { id: 'controls' as CardAction, icon: 'category', label: 'Merchant Controls', sub: `${Object.values(merchantToggles).filter(Boolean).length}/6 enabled`, color: '#8B5CF6' },
              { id: 'pin' as CardAction, icon: 'pin', label: 'Change PIN', sub: 'Update your 4-digit PIN', color: colors.info },
              { id: 'replace' as CardAction, icon: 'credit-card', label: 'Replace Card', sub: 'Lost, stolen, or damaged', color: colors.error },
            ].map((item, i, arr) => (
              <React.Fragment key={item.id}>
                <Pressable
                  style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
                  onPress={() => setSection(item.id)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '18' }]}>
                    <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuSub}>{item.sub}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                </Pressable>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Card Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Card Details</Text>
            {[
              { label: 'Type', value: `${card.type.charAt(0).toUpperCase() + card.type.slice(1)} · ${card.network.toUpperCase()}` },
              { label: 'Number', value: `•••• •••• •••• ${card.last4}` },
              { label: 'Tier', value: card.tier.charAt(0).toUpperCase() + card.tier.slice(1) },
              { label: 'Cashback', value: `${card.cashbackPercent}%` },
              { label: 'Status', value: frozen ? 'Frozen' : card.status.charAt(0).toUpperCase() + card.status.slice(1) },
            ].map((row, i) => (
              <View key={row.label}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
                {i < 4 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* ── Spending Limits ── */}
      {section === 'limits' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.sectionDesc}>Set maximum amounts for card transactions. Changes take effect immediately.</Text>

          {[
            { label: 'Monthly Limit', sub: 'Total spend per calendar month', value: spendingLimit, onChange: setSpendingLimit, icon: 'calendar-today' },
            { label: 'Daily Limit', sub: 'Maximum spend in 24 hours', value: dailyLimit, onChange: setDailyLimit, icon: 'today' },
            { label: 'Per Transaction', sub: 'Maximum single transaction', value: singleTxLimit, onChange: setSingleTxLimit, icon: 'receipt' },
          ].map(item => (
            <View key={item.label} style={styles.limitRow}>
              <View style={styles.limitHeader}>
                <MaterialIcons name={item.icon as any} size={18} color={colors.primary} />
                <View>
                  <Text style={styles.limitLabel}>{item.label}</Text>
                  <Text style={styles.limitSub}>{item.sub}</Text>
                </View>
              </View>
              <View style={styles.limitInputWrap}>
                <Text style={styles.limitSymbol}>$</Text>
                <TextInput
                  style={styles.limitInput}
                  value={item.value}
                  onChangeText={item.onChange}
                  keyboardType="numeric"
                  accessibilityLabel={item.label}
                />
              </View>
              {/* Visual bar */}
              <View style={styles.limitBarTrack}>
                <View style={[styles.limitBarFill, {
                  width: `${Math.min((card.spentThisMonth / (parseFloat(item.value) || 1)) * 100, 100)}%` as any
                }]} />
              </View>
            </View>
          ))}

          <Pressable style={styles.primaryBtn} onPress={handleSaveLimits}>
            <Text style={styles.primaryBtnText}>Save Limits</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ── Merchant Controls ── */}
      {section === 'controls' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.sectionDesc}>Enable or disable transaction types for this card.</Text>
          <View style={styles.menuCard}>
            {MERCHANT_CATEGORIES.map((cat, i) => (
              <React.Fragment key={cat.id}>
                <View style={styles.toggleRow}>
                  <View style={[styles.menuIcon, { backgroundColor: merchantToggles[cat.id] ? colors.primary + '22' : colors.background }]}>
                    <MaterialIcons name={cat.icon as any} size={18} color={merchantToggles[cat.id] ? colors.primary : colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{cat.label}</Text>
                    <Text style={styles.menuSub}>{cat.desc}</Text>
                  </View>
                  <Switch
                    value={merchantToggles[cat.id]}
                    onValueChange={() => handleMerchantToggle(cat.id)}
                    trackColor={{ false: colors.border, true: colors.mint }}
                    thumbColor={merchantToggles[cat.id] ? colors.primary : colors.textMuted}
                  />
                </View>
                {i < MERCHANT_CATEGORIES.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
          <Pressable style={styles.primaryBtn} onPress={() => { showAlert('Controls Saved', 'Merchant category settings updated.'); setSection(null); }}>
            <Text style={styles.primaryBtnText}>Save Controls</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ── Change PIN ── */}
      {section === 'pin' && (
        <View style={styles.content}>
          {pinStep !== 'done' ? (
            <>
              <Text style={styles.sectionDesc}>
                {pinStep === 'current' ? 'Enter your current 4-digit PIN to continue.' :
                 pinStep === 'new' ? 'Choose a new 4-digit PIN.' :
                 'Confirm your new PIN.'}
              </Text>

              {/* PIN Step indicator */}
              <View style={styles.pinSteps}>
                {['current', 'new', 'confirm'].map((s, i) => (
                  <View key={s} style={[styles.pinStepDot, (pinStep === s || ['current','new','confirm'].indexOf(pinStep) > i) && styles.pinStepDotActive]} />
                ))}
              </View>

              <View style={styles.pinInputWrap}>
                <MaterialIcons name="lock" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.pinInput}
                  value={pinStep === 'current' ? currentPin : pinStep === 'new' ? newPin : confirmPin}
                  onChangeText={pinStep === 'current' ? setCurrentPin : pinStep === 'new' ? setNewPin : setConfirmPin}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  placeholder="Enter PIN"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  accessibilityLabel="PIN input"
                />
                <Text style={styles.pinLength}>
                  {(pinStep === 'current' ? currentPin : pinStep === 'new' ? newPin : confirmPin).length}/4
                </Text>
              </View>

              <Pressable style={styles.primaryBtn} onPress={handlePinChange}>
                <Text style={styles.primaryBtnText}>
                  {pinStep === 'confirm' ? 'Set New PIN' : 'Continue'}
                </Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.successWrap}>
              <View style={styles.successCircle}>
                <MaterialIcons name="check" size={40} color={colors.textOnDark} />
              </View>
              <Text style={styles.successTitle}>PIN Changed!</Text>
              <Text style={styles.successSub}>Your new PIN is active for card ending in {card.last4}.</Text>
              <Pressable style={styles.primaryBtn} onPress={() => { setPinStep('current'); setCurrentPin(''); setNewPin(''); setConfirmPin(''); setSection(null); }}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* ── Replace Card ── */}
      {section === 'replace' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {replaceStep === 'reason' && (
            <>
              <Text style={styles.sectionDesc}>Why do you need a replacement card?</Text>
              {['Lost card', 'Stolen card', 'Damaged card', 'Compromised details', 'Upgrade card'].map(reason => (
                <Pressable
                  key={reason}
                  style={[styles.reasonRow, replaceReason === reason && styles.reasonRowActive]}
                  onPress={() => setReplaceReason(reason)}
                >
                  <MaterialIcons name={replaceReason === reason ? 'radio-button-checked' : 'radio-button-unchecked'} size={20} color={colors.primary} />
                  <Text style={styles.reasonText}>{reason}</Text>
                </Pressable>
              ))}
              <Pressable
                style={[styles.primaryBtn, !replaceReason && styles.primaryBtnDisabled]}
                disabled={!replaceReason}
                onPress={() => setReplaceStep('address')}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>
            </>
          )}
          {replaceStep === 'address' && (
            <>
              <Text style={styles.sectionDesc}>Your replacement card will be shipped to your registered address.</Text>
              <View style={styles.addressCard}>
                <MaterialIcons name="home" size={24} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.menuLabel}>Registered Address</Text>
                  <Text style={styles.menuSub}>142 Oak Lane, San Francisco, CA 94102</Text>
                </View>
              </View>
              <View style={styles.deliveryInfo}>
                <MaterialIcons name="local-shipping" size={18} color={colors.success} />
                <Text style={styles.deliveryText}>Standard delivery: 5–7 business days</Text>
              </View>
              <Pressable style={styles.primaryBtn} onPress={() => setReplaceStep('confirm')}>
                <Text style={styles.primaryBtnText}>Ship to This Address</Text>
              </Pressable>
            </>
          )}
          {replaceStep === 'confirm' && (
            <>
              <Text style={styles.sectionDesc}>Your current card will be deactivated immediately.</Text>
              <View style={styles.menuCard}>
                {[
                  { label: 'Reason', value: replaceReason },
                  { label: 'Card', value: `•••• •••• •••• ${card.last4}` },
                  { label: 'Delivery', value: '5–7 business days' },
                  { label: 'Fee', value: 'Free (Premium)' },
                ].map((row, i) => (
                  <React.Fragment key={row.label}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>{row.label}</Text>
                      <Text style={styles.infoValue}>{row.value}</Text>
                    </View>
                    {i < 3 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
              </View>
              <Pressable style={styles.primaryBtn} onPress={() => setReplaceStep('done')}>
                <Text style={styles.primaryBtnText}>Confirm Replacement</Text>
              </Pressable>
            </>
          )}
          {replaceStep === 'done' && (
            <View style={styles.successWrap}>
              <View style={styles.successCircle}>
                <MaterialIcons name="local-shipping" size={40} color={colors.textOnDark} />
              </View>
              <Text style={styles.successTitle}>Replacement Ordered!</Text>
              <Text style={styles.successSub}>Your new card will arrive in 5–7 business days.</Text>
              <Pressable style={styles.primaryBtn} onPress={() => { setReplaceStep('reason'); setReplaceReason(''); setSection(null); }}>
                <Text style={styles.primaryBtnText}>Done</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
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
    content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
    cardChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.pill,
      backgroundColor: colors.surface, marginRight: Spacing.sm, borderWidth: 1, borderColor: colors.border,
    },
    cardChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    cardChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    cardChipTextActive: { color: colors.textOnDark },
    freezeCard: {
      borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.md,
      flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    },
    freezeLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    freezeTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
    freezeSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    freezeToggleBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: Spacing.md, paddingVertical: 9, borderRadius: Radius.pill,
    },
    freezeToggleTxt: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textOnDark },
    menuCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl,
      marginBottom: Spacing.md, ...Shadow.sm, overflow: 'hidden',
    },
    menuRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      padding: Spacing.base, minHeight: 64,
    },
    menuRowPressed: { backgroundColor: colors.background },
    menuIcon: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    menuLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    menuSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: Spacing.base },
    infoCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl,
      marginBottom: Spacing.md, ...Shadow.sm, overflow: 'hidden', padding: Spacing.md,
    },
    infoTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs },
    infoLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    sectionDesc: { fontSize: FontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: Spacing.base, marginTop: Spacing.xs },
    limitRow: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    limitHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    limitLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    limitSub: { fontSize: FontSize.xs, color: colors.textMuted },
    limitInputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.background, borderRadius: Radius.lg, padding: Spacing.md,
      borderWidth: 1, borderColor: colors.border, marginBottom: Spacing.sm,
    },
    limitSymbol: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: colors.textPrimary },
    limitInput: { flex: 1, fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: colors.textPrimary, includeFontPadding: false },
    limitBarTrack: { height: 4, backgroundColor: colors.background, borderRadius: 2, overflow: 'hidden' },
    limitBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.base, minHeight: 64 },
    pinSteps: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
    pinStepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
    pinStepDotActive: { backgroundColor: colors.primary },
    pinInputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
      borderWidth: 1, borderColor: colors.border, marginBottom: Spacing.base, ...Shadow.sm,
    },
    pinInput: { flex: 1, fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: colors.textPrimary, textAlign: 'center', letterSpacing: 8, includeFontPadding: false },
    pinLength: { fontSize: FontSize.sm, color: colors.textMuted },
    successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
    successCircle: {
      width: 88, height: 88, borderRadius: 44, backgroundColor: colors.success,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, ...Shadow.lg,
    },
    successTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: colors.textPrimary, marginBottom: Spacing.sm },
    successSub: { fontSize: FontSize.base, color: colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
    reasonRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: colors.surface, borderRadius: Radius.lg, padding: Spacing.base,
      marginBottom: Spacing.sm, borderWidth: 1.5, borderColor: 'transparent', ...Shadow.sm,
    },
    reasonRowActive: { borderColor: colors.primary },
    reasonText: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: colors.textPrimary },
    addressCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    deliveryInfo: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.successBg, borderRadius: Radius.lg, padding: Spacing.md,
      marginBottom: Spacing.base,
    },
    deliveryText: { fontSize: FontSize.sm, color: colors.success, fontWeight: FontWeight.medium },
    primaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg,
      marginTop: Spacing.sm, ...Shadow.md,
    },
    primaryBtnDisabled: { backgroundColor: colors.border },
    primaryBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textOnDark },
  });
}
