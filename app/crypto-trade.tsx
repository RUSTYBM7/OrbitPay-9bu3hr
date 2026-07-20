import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../contexts/ThemeContext';
import { useBiometric } from '../hooks/useBiometric';
import { Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';
import { CryptoAsset } from '../services/mockData';

type TradeMode = 'buy' | 'sell';
type InputMode = 'usd' | 'crypto';
type Step = 'select' | 'trade' | 'confirm' | 'success';

const NETWORK_FEE_PCT = 0.0015; // 0.15%
const SLIPPAGE_THRESHOLD = 1000; // $1000+ shows slippage warning
const SLIPPAGE_PCT = 0.003; // 0.3% slippage

// Mini sparkline chart (static visual)
function Sparkline({ color, positive }: { color: string; positive: boolean }) {
  const points = positive
    ? [20, 18, 22, 19, 24, 21, 26, 23, 28, 25, 30]
    : [30, 28, 25, 27, 22, 24, 20, 21, 18, 19, 16];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const h = 32;
  const w = 80;
  return (
    <View style={{ width: w, height: h }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: h, gap: 3 }}>
        {points.map((p, i) => {
          const barH = Math.max(4, ((p - min) / (max - min + 1)) * h);
          return (
            <View
              key={i}
              style={{
                flex: 1, height: barH, borderRadius: 2,
                backgroundColor: color + (i === points.length - 1 ? 'FF' : '66'),
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function CryptoTradeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ coinId?: string; mode?: string }>();
  const { showAlert } = useAlert();
  const { colors } = useTheme();
  const { crypto, wallets, activeWallet, addTransaction } = useWallet();
  const { authenticate, biometricType } = useBiometric();

  const [step, setStep] = useState<Step>(params.coinId ? 'trade' : 'select');
  const [mode, setMode] = useState<TradeMode>((params.mode as TradeMode) || 'buy');
  const [selectedCoin, setSelectedCoin] = useState<CryptoAsset | null>(
    params.coinId ? crypto.find(c => c.id === params.coinId) ?? null : null
  );
  const [inputMode, setInputMode] = useState<InputMode>('usd');
  const [amountStr, setAmountStr] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [successAnim] = useState(new Animated.Value(0));

  const filteredCoins = useMemo(() => {
    if (!search.trim()) return crypto;
    const q = search.toLowerCase();
    return crypto.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  }, [crypto, search]);

  const usdAmount = useMemo(() => {
    const n = parseFloat(amountStr) || 0;
    if (!selectedCoin) return 0;
    return inputMode === 'usd' ? n : n * selectedCoin.price;
  }, [amountStr, inputMode, selectedCoin]);

  const cryptoAmount = useMemo(() => {
    const n = parseFloat(amountStr) || 0;
    if (!selectedCoin) return 0;
    return inputMode === 'crypto' ? n : n / selectedCoin.price;
  }, [amountStr, inputMode, selectedCoin]);

  const networkFee = useMemo(() => usdAmount * NETWORK_FEE_PCT, [usdAmount]);
  const slippage = useMemo(() => usdAmount >= SLIPPAGE_THRESHOLD ? usdAmount * SLIPPAGE_PCT : 0, [usdAmount]);
  const totalCost = mode === 'buy' ? usdAmount + networkFee + slippage : usdAmount - networkFee - slippage;
  const receiveAmount = mode === 'buy' ? cryptoAmount : usdAmount - networkFee;
  const showSlippageWarning = usdAmount >= SLIPPAGE_THRESHOLD;

  const handleSelectCoin = useCallback((coin: CryptoAsset) => {
    setSelectedCoin(coin);
    setStep('trade');
  }, []);

  const handleContinue = useCallback(() => {
    if (!amountStr || parseFloat(amountStr) <= 0) {
      showAlert('Enter Amount', 'Please enter a valid amount to trade.');
      return;
    }
    if (mode === 'buy' && totalCost > activeWallet.amount) {
      showAlert('Insufficient Funds', `You need $${totalCost.toFixed(2)} but only have $${activeWallet.amount.toFixed(2)}.`);
      return;
    }
    if (mode === 'sell') {
      const holding = selectedCoin;
      if (holding && cryptoAmount > holding.amount) {
        showAlert('Insufficient Holdings', `You only hold ${holding.amount} ${holding.symbol}.`);
        return;
      }
    }
    setStep('confirm');
  }, [amountStr, mode, totalCost, activeWallet, selectedCoin, cryptoAmount, showAlert]);

  const handleConfirm = useCallback(async () => {
    if (!selectedCoin) return;
    const biometricLabel = biometricType === 'face' ? 'Face ID' : 'Fingerprint';
    const authOk = await authenticate(`Confirm ${mode === 'buy' ? 'purchase' : 'sale'} with ${biometricLabel}`);
    if (!authOk) { showAlert('Authentication Failed', 'Please try again.'); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));

    await addTransaction({
      type: 'crypto',
      title: mode === 'buy'
        ? `Bought ${selectedCoin.symbol}`
        : `Sold ${selectedCoin.symbol}`,
      subtitle: `${cryptoAmount.toFixed(6)} ${selectedCoin.symbol} @ $${selectedCoin.price.toLocaleString()}`,
      amount: mode === 'buy' ? -totalCost : receiveAmount,
      currency: 'USD',
      status: 'completed',
      icon: selectedCoin.icon,
      category: 'Crypto',
    });

    setLoading(false);
    Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
    setStep('success');
  }, [selectedCoin, mode, cryptoAmount, totalCost, receiveAmount, authenticate, biometricType, addTransaction, showAlert, successAnim]);

  const styles = makeStyles(colors);

  const biometricIcon = biometricType === 'face' ? 'face' : 'fingerprint';
  const biometricLabel = biometricType === 'face' ? 'Face ID' : biometricType === 'fingerprint' ? 'Fingerprint' : 'Authenticate';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      {step !== 'success' && (
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              if (step === 'confirm') setStep('trade');
              else if (step === 'trade') { setStep('select'); setSelectedCoin(null); setAmountStr(''); }
              else router.back();
            }}
            hitSlop={12}
          >
            <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {step === 'select' ? 'Crypto Trade' : step === 'confirm' ? 'Confirm Trade' : selectedCoin?.name ?? 'Trade'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* ── STEP 1: Select Coin ── */}
        {step === 'select' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Buy/Sell Toggle */}
            <View style={styles.modeToggle}>
              {(['buy', 'sell'] as TradeMode[]).map(m => (
                <Pressable
                  key={m}
                  style={[styles.modeBtn, mode === m && (m === 'buy' ? styles.modeBtnBuy : styles.modeBtnSell)]}
                  onPress={() => setMode(m)}
                >
                  <MaterialIcons
                    name={m === 'buy' ? 'add-shopping-cart' : 'sell'}
                    size={16}
                    color={mode === m ? colors.textOnDark : colors.textSecondary}
                  />
                  <Text style={[styles.modeBtnText, mode === m && { color: colors.textOnDark }]}>
                    {m === 'buy' ? 'Buy' : 'Sell'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search coins…"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Search crypto coins"
              />
            </View>

            {/* Coin List */}
            <Text style={styles.sectionLabel}>
              {mode === 'buy' ? 'Available to Buy' : 'Your Holdings'}
            </Text>
            {filteredCoins.map(coin => (
              <Pressable
                key={coin.id}
                style={({ pressed }) => [styles.coinRow, pressed && { opacity: 0.8 }]}
                onPress={() => handleSelectCoin(coin)}
              >
                <View style={[styles.coinIcon, { backgroundColor: coin.color + '22' }]}>
                  <MaterialIcons name={coin.icon as any} size={22} color={coin.color} />
                </View>
                <View style={styles.coinInfo}>
                  <Text style={styles.coinName}>{coin.name}</Text>
                  <Text style={styles.coinSymbol}>{coin.symbol} · ${coin.price.toLocaleString()}</Text>
                </View>
                <Sparkline color={coin.color} positive={coin.change24hPercent >= 0} />
                <View style={styles.coinRight}>
                  <Text style={styles.coinValue}>${coin.valueUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                  <Text style={[styles.coinChange, { color: coin.change24hPercent >= 0 ? colors.success : colors.error }]}>
                    {coin.change24hPercent >= 0 ? '+' : ''}{coin.change24hPercent.toFixed(2)}%
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── STEP 2: Trade ── */}
        {step === 'trade' && selectedCoin && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Coin Header */}
            <View style={styles.coinHeader}>
              <View style={[styles.coinHeaderIcon, { backgroundColor: selectedCoin.color + '22' }]}>
                <MaterialIcons name={selectedCoin.icon as any} size={28} color={selectedCoin.color} />
              </View>
              <View style={styles.coinHeaderInfo}>
                <Text style={styles.coinHeaderName}>{selectedCoin.name}</Text>
                <Text style={styles.coinHeaderPrice}>${selectedCoin.price.toLocaleString()}</Text>
              </View>
              <View style={styles.coinHeaderRight}>
                <Text style={[styles.coinHeaderChange, { color: selectedCoin.change24hPercent >= 0 ? colors.success : colors.error }]}>
                  {selectedCoin.change24hPercent >= 0 ? '+' : ''}{selectedCoin.change24hPercent.toFixed(2)}%
                </Text>
                <Text style={styles.coinHeaderChangeSub}>24h</Text>
              </View>
            </View>

            {/* Holding Info */}
            <View style={styles.holdingCard}>
              <View style={styles.holdingItem}>
                <Text style={styles.holdingLabel}>Holdings</Text>
                <Text style={styles.holdingValue}>{selectedCoin.amount} {selectedCoin.symbol}</Text>
              </View>
              <View style={[styles.holdingSep, { backgroundColor: colors.divider }]} />
              <View style={styles.holdingItem}>
                <Text style={styles.holdingLabel}>Portfolio Value</Text>
                <Text style={styles.holdingValue}>${selectedCoin.valueUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
              </View>
              <View style={[styles.holdingSep, { backgroundColor: colors.divider }]} />
              <View style={styles.holdingItem}>
                <Text style={styles.holdingLabel}>Wallet Balance</Text>
                <Text style={styles.holdingValue}>${activeWallet.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
              </View>
            </View>

            {/* Buy/Sell Toggle */}
            <View style={styles.modeToggle}>
              {(['buy', 'sell'] as TradeMode[]).map(m => (
                <Pressable
                  key={m}
                  style={[styles.modeBtn, mode === m && (m === 'buy' ? styles.modeBtnBuy : styles.modeBtnSell)]}
                  onPress={() => { setMode(m); setAmountStr(''); }}
                >
                  <Text style={[styles.modeBtnText, mode === m && { color: colors.textOnDark }]}>
                    {m === 'buy' ? 'Buy' : 'Sell'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Amount Input */}
            <View style={styles.amountCard}>
              <View style={styles.inputToggleRow}>
                <Text style={styles.inputToggleLabel}>Enter in:</Text>
                <View style={styles.inputToggle}>
                  {(['usd', 'crypto'] as InputMode[]).map(im => (
                    <Pressable
                      key={im}
                      style={[styles.inputToggleBtn, inputMode === im && styles.inputToggleBtnActive]}
                      onPress={() => { setInputMode(im); setAmountStr(''); }}
                    >
                      <Text style={[styles.inputToggleBtnText, inputMode === im && styles.inputToggleBtnTextActive]}>
                        {im === 'usd' ? 'USD' : selectedCoin.symbol}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amountCurrency}>
                  {inputMode === 'usd' ? '$' : selectedCoin.symbol}
                </Text>
                <TextInput
                  style={styles.amountInput}
                  value={amountStr}
                  onChangeText={setAmountStr}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  accessibilityLabel="Trade amount"
                />
              </View>

              {/* Converted amount */}
              {parseFloat(amountStr) > 0 && (
                <Text style={styles.convertedAmount}>
                  {inputMode === 'usd'
                    ? `≈ ${cryptoAmount.toFixed(6)} ${selectedCoin.symbol}`
                    : `≈ $${usdAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                </Text>
              )}

              {/* Quick amounts */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
                {(inputMode === 'usd' ? ['50', '100', '500', '1000', '2000'] : ['0.001', '0.01', '0.1', '0.5', '1']).map(v => (
                  <Pressable
                    key={v}
                    style={[styles.quickChip, amountStr === v && styles.quickChipActive]}
                    onPress={() => setAmountStr(v)}
                  >
                    <Text style={[styles.quickChipText, amountStr === v && styles.quickChipTextActive]}>
                      {inputMode === 'usd' ? `$${v}` : `${v} ${selectedCoin.symbol}`}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Slippage Warning */}
            {showSlippageWarning && (
              <View style={styles.slippageWarning}>
                <MaterialIcons name="warning" size={18} color={colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.slippageTitle}>Price Impact Warning</Text>
                  <Text style={styles.slippageText}>
                    Large trades may experience up to {(SLIPPAGE_PCT * 100).toFixed(1)}% slippage (≈ ${slippage.toFixed(2)})
                  </Text>
                </View>
              </View>
            )}

            {/* Fee Preview */}
            {parseFloat(amountStr) > 0 && (
              <View style={styles.feeCard}>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Amount</Text>
                  <Text style={styles.feeValue}>${usdAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.feeDivider} />
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Network Fee (0.15%)</Text>
                  <Text style={styles.feeValue}>${networkFee.toFixed(2)}</Text>
                </View>
                {showSlippageWarning && (
                  <>
                    <View style={styles.feeDivider} />
                    <View style={styles.feeRow}>
                      <Text style={[styles.feeLabel, { color: colors.warning }]}>Est. Slippage</Text>
                      <Text style={[styles.feeValue, { color: colors.warning }]}>~${slippage.toFixed(2)}</Text>
                    </View>
                  </>
                )}
                <View style={styles.feeDivider} />
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { fontWeight: FontWeight.bold, color: colors.textPrimary }]}>
                    {mode === 'buy' ? 'Total Cost' : 'You Receive'}
                  </Text>
                  <Text style={[styles.feeValue, { fontWeight: FontWeight.bold, color: mode === 'buy' ? colors.error : colors.success }]}>
                    ${(mode === 'buy' ? totalCost : receiveAmount).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: mode === 'buy' ? colors.success : colors.error }, !amountStr && { opacity: 0.5 }]}
              onPress={handleContinue}
              disabled={!amountStr}
            >
              <Text style={styles.primaryBtnText}>
                {mode === 'buy' ? `Review Purchase` : `Review Sale`}
              </Text>
            </Pressable>
          </ScrollView>
        )}

        {/* ── STEP 3: Confirm ── */}
        {step === 'confirm' && selectedCoin && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.sectionLabel}>Order Summary</Text>

            <View style={styles.orderCard}>
              {/* Coin visual */}
              <View style={styles.orderCoinRow}>
                <View style={[styles.coinIcon, { backgroundColor: selectedCoin.color + '22' }]}>
                  <MaterialIcons name={selectedCoin.icon as any} size={24} color={selectedCoin.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderCoinName}>{mode === 'buy' ? 'Buying' : 'Selling'} {selectedCoin.name}</Text>
                  <Text style={styles.orderCoinSub}>{selectedCoin.symbol} · ${selectedCoin.price.toLocaleString()}</Text>
                </View>
                <View style={[styles.orderModeBadge, { backgroundColor: mode === 'buy' ? colors.successBg : colors.errorBg }]}>
                  <Text style={[styles.orderModeBadgeText, { color: mode === 'buy' ? colors.success : colors.error }]}>
                    {mode.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={[styles.orderDivider, { backgroundColor: colors.divider }]} />

              {[
                { label: 'Amount', value: `${cryptoAmount.toFixed(6)} ${selectedCoin.symbol}` },
                { label: 'Price per coin', value: `$${selectedCoin.price.toLocaleString()}` },
                { label: 'Subtotal', value: `$${usdAmount.toFixed(2)}` },
                { label: 'Network Fee', value: `$${networkFee.toFixed(2)}` },
                ...(showSlippageWarning ? [{ label: 'Est. Slippage', value: `~$${slippage.toFixed(2)}` }] : []),
                { label: mode === 'buy' ? 'Total Deducted' : 'Total Received', value: `$${(mode === 'buy' ? totalCost : receiveAmount).toFixed(2)}` },
              ].map((row, i, arr) => (
                <React.Fragment key={row.label}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{row.label}</Text>
                    <Text style={[styles.summaryValue, i === arr.length - 1 && {
                      color: mode === 'buy' ? colors.error : colors.success,
                      fontWeight: FontWeight.bold, fontSize: FontSize.base,
                    }]}>{row.value}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={[styles.feeDivider, { backgroundColor: colors.divider }]} />}
                </React.Fragment>
              ))}
            </View>

            {/* Biometric CTA */}
            <View style={styles.biometricCard}>
              <MaterialIcons name={biometricIcon} size={32} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.biometricTitle}>Confirm with {biometricLabel}</Text>
                <Text style={styles.biometricSub}>Tap below to authenticate and execute trade</Text>
              </View>
            </View>

            <Pressable
              style={[styles.primaryBtn, { backgroundColor: mode === 'buy' ? colors.success : colors.error }, loading && { opacity: 0.7 }]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.textOnDark} />
              ) : (
                <>
                  <MaterialIcons name={biometricIcon} size={20} color={colors.textOnDark} />
                  <Text style={styles.primaryBtnText}>
                    {mode === 'buy' ? `Buy ${selectedCoin.symbol}` : `Sell ${selectedCoin.symbol}`}
                  </Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        )}

        {/* ── STEP 4: Success ── */}
        {step === 'success' && selectedCoin && (
          <View style={styles.successWrap}>
            <Animated.View style={[styles.successCircle, { backgroundColor: mode === 'buy' ? colors.success : colors.primary, transform: [{ scale: successAnim }] }]}>
              <MaterialIcons name="check" size={52} color={colors.textOnDark} />
            </Animated.View>
            <Text style={styles.successTitle}>Trade Executed!</Text>
            <Text style={styles.successSub}>
              {mode === 'buy'
                ? `You bought ${cryptoAmount.toFixed(6)} ${selectedCoin.symbol} for $${totalCost.toFixed(2)}`
                : `You sold ${cryptoAmount.toFixed(6)} ${selectedCoin.symbol} for $${receiveAmount.toFixed(2)}`}
            </Text>

            <View style={styles.receiptCard}>
              {[
                { label: 'Coin', value: `${selectedCoin.name} (${selectedCoin.symbol})` },
                { label: 'Type', value: mode === 'buy' ? 'Purchase' : 'Sale' },
                { label: 'Amount', value: `${cryptoAmount.toFixed(6)} ${selectedCoin.symbol}` },
                { label: 'Price', value: `$${selectedCoin.price.toLocaleString()}` },
                { label: 'Reference', value: `ORB${Date.now().toString().slice(-8)}` },
                { label: 'Status', value: 'Completed' },
              ].map((row, i, arr) => (
                <React.Fragment key={row.label}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>{row.label}</Text>
                    <Text style={[styles.receiptValue, row.label === 'Status' && { color: colors.success }]}>
                      {row.value}
                    </Text>
                  </View>
                  {i < arr.length - 1 && <View style={styles.feeDivider} />}
                </React.Fragment>
              ))}
            </View>

            <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => { setStep('trade'); setAmountStr(''); }}>
              <Text style={styles.secondaryBtnText}>Trade Again</Text>
            </Pressable>
          </View>
        )}

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
    content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxl },
    modeToggle: {
      flexDirection: 'row', backgroundColor: colors.surface, borderRadius: Radius.lg,
      padding: 4, marginBottom: Spacing.base, ...Shadow.sm,
    },
    modeBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: Radius.md,
    },
    modeBtnBuy: { backgroundColor: colors.success },
    modeBtnSell: { backgroundColor: colors.error },
    modeBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textSecondary },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.md,
      borderWidth: 1, borderColor: colors.border, marginBottom: Spacing.base,
    },
    searchInput: { flex: 1, fontSize: FontSize.base, color: colors.textPrimary, includeFontPadding: false },
    sectionLabel: {
      fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: Spacing.sm,
    },
    coinRow: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: Radius.lg, padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.sm,
    },
    coinIcon: { width: 44, height: 44, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    coinInfo: { flex: 1 },
    coinName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    coinSymbol: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    coinRight: { alignItems: 'flex-end', marginLeft: Spacing.md },
    coinValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textPrimary },
    coinChange: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginTop: 2 },
    coinHeader: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: Radius.xl, padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.sm,
    },
    coinHeaderIcon: { width: 52, height: 52, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    coinHeaderInfo: { flex: 1 },
    coinHeaderName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: colors.textPrimary },
    coinHeaderPrice: { fontSize: FontSize.base, color: colors.textSecondary, marginTop: 2 },
    coinHeaderRight: { alignItems: 'flex-end' },
    coinHeaderChange: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
    coinHeaderChangeSub: { fontSize: FontSize.xs, color: colors.textMuted },
    holdingCard: {
      flexDirection: 'row', backgroundColor: colors.surface, borderRadius: Radius.xl,
      padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.sm,
    },
    holdingItem: { flex: 1, alignItems: 'center' },
    holdingLabel: { fontSize: FontSize.xs, color: colors.textMuted, marginBottom: 4 },
    holdingValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.textPrimary },
    holdingSep: { width: 1, marginVertical: 2 },
    amountCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    inputToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
    inputToggleLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    inputToggle: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: Radius.lg, padding: 3 },
    inputToggleBtn: { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.md },
    inputToggleBtnActive: { backgroundColor: colors.primary },
    inputToggleBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    inputToggleBtnTextActive: { color: colors.textOnDark },
    amountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
    amountCurrency: { fontSize: 38, fontWeight: FontWeight.bold, color: colors.textPrimary, marginRight: 4 },
    amountInput: { flex: 1, fontSize: 38, fontWeight: FontWeight.bold, color: colors.textPrimary, includeFontPadding: false },
    convertedAmount: { fontSize: FontSize.sm, color: colors.textMuted, marginBottom: Spacing.xs },
    quickChip: {
      paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill,
      backgroundColor: colors.background, marginRight: Spacing.sm, borderWidth: 1, borderColor: colors.border,
    },
    quickChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    quickChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    quickChipTextActive: { color: colors.textOnDark },
    slippageWarning: {
      flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
      backgroundColor: colors.warningBg, borderRadius: Radius.lg, padding: Spacing.md,
      marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.warning + '44',
    },
    slippageTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: colors.warning, marginBottom: 2 },
    slippageText: { fontSize: FontSize.xs, color: colors.textSecondary, lineHeight: 16 },
    feeCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    feeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
    feeLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    feeValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    feeDivider: { height: 1, backgroundColor: colors.divider },
    orderCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.md, ...Shadow.sm,
    },
    orderCoinRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingBottom: Spacing.md },
    orderCoinName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary },
    orderCoinSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    orderModeBadge: { borderRadius: Radius.pill, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
    orderModeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
    orderDivider: { height: 1, marginBottom: Spacing.sm },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
    summaryLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    summaryValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
    biometricCard: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: colors.cardMint, borderRadius: Radius.xl, padding: Spacing.base,
      marginBottom: Spacing.base, borderWidth: 1, borderColor: colors.border,
    },
    biometricTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textPrimary },
    biometricSub: { fontSize: FontSize.xs, color: colors.textMuted, marginTop: 2 },
    primaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      backgroundColor: colors.primary, borderRadius: Radius.xl, paddingVertical: Spacing.lg,
      marginBottom: Spacing.sm, ...Shadow.md,
    },
    primaryBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: colors.textOnDark },
    secondaryBtn: {
      alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.xl,
      borderWidth: 1, borderColor: colors.border,
    },
    secondaryBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: colors.textSecondary },
    successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.base },
    successCircle: {
      width: 100, height: 100, borderRadius: 50,
      alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, ...Shadow.lg,
    },
    successTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: colors.textPrimary, marginBottom: Spacing.sm },
    successSub: { fontSize: FontSize.sm, color: colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
    receiptCard: {
      backgroundColor: colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
      width: '100%', marginBottom: Spacing.base, ...Shadow.sm,
    },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
    receiptLabel: { fontSize: FontSize.sm, color: colors.textMuted },
    receiptValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.textPrimary },
  });
}
