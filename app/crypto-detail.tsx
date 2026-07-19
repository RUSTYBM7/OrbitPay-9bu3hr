import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { useWallet } from '../hooks/useWallet';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';
import { CryptoAsset } from '../services/mockData';

const { width: W } = Dimensions.get('window');
const CHART_H = 140;
const PERIODS = ['1D', '7D', '1M', '3M', '1Y'];

// ── Deterministic sparkline generator ──────────────────────────────────
function generatePriceHistory(basePrice: number, points: number, volatility: number, seed: number): number[] {
  const prices: number[] = [basePrice];
  let current = basePrice;
  for (let i = 1; i < points; i++) {
    const change = (Math.sin(seed + i * 0.7) * volatility + Math.cos(seed + i * 1.3) * volatility * 0.5);
    current = Math.max(current + change, basePrice * 0.5);
    prices.push(current);
  }
  return prices;
}

function SparklineChart({ prices, color, width }: { prices: number[]; color: string; width: number }) {
  if (!prices.length || width <= 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const stepX = (width - 32) / (prices.length - 1);

  const points = prices.map((p, i) => ({
    x: 16 + i * stepX,
    y: CHART_H - 16 - ((p - min) / range) * (CHART_H - 32),
  }));

  const pathD = points.reduce((d, pt, i) => {
    if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    const prev = points[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${d} C ${cpX.toFixed(1)} ${prev.y.toFixed(1)}, ${cpX.toFixed(1)} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  const areaPath = `${pathD} L ${points[points.length - 1].x} ${CHART_H - 8} L ${points[0].x} ${CHART_H - 8} Z`;

  // Render using View-based approach (no SVG dependency)
  return (
    <View style={[styles.chartContainer, { width, height: CHART_H }]}>
      {/* Price grid lines */}
      {[0.25, 0.5, 0.75].map(ratio => (
        <View
          key={ratio}
          style={[styles.gridLine, { top: 16 + ratio * (CHART_H - 32) }]}
        />
      ))}
      {/* Simple line chart using absolute-positioned views */}
      {points.slice(1).map((pt, i) => {
        const prev = points[i];
        const dx = pt.x - prev.x;
        const dy = pt.y - prev.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const isUp = pt.y <= prev.y;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: prev.x,
              top: prev.y - 1,
              width: len,
              height: 2.5,
              backgroundColor: isUp ? Colors.success : Colors.error,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: '0 50%',
              borderRadius: 1,
            }}
          />
        );
      })}
      {/* Current price dot */}
      <View style={[styles.priceDot, { left: points[points.length - 1].x - 5, top: points[points.length - 1].y - 5, backgroundColor: color }]} />
    </View>
  );
}

export default function CryptoDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { showAlert } = useAlert();
  const { crypto, addTransaction, activeWallet } = useWallet();

  const coin = crypto.find(c => c.id === params.id) ?? crypto[0];

  const [period, setPeriod] = useState('1D');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');

  const periodPoints: Record<string, number> = { '1D': 48, '7D': 84, '1M': 60, '3M': 90, '1Y': 120 };
  const volatilityMap: Record<string, number> = { '1D': coin.price * 0.004, '7D': coin.price * 0.015, '1M': coin.price * 0.04, '3M': coin.price * 0.08, '1Y': coin.price * 0.2 };
  const seedMap: Record<string, number> = { '1D': 1, '7D': 2, '1M': 3, '3M': 4, '1Y': 5 };

  const priceHistory = useMemo(
    () => generatePriceHistory(coin.price, periodPoints[period], volatilityMap[period], seedMap[period]),
    [period, coin.price]
  );

  const periodChange = priceHistory[priceHistory.length - 1] - priceHistory[0];
  const periodChangePct = (periodChange / priceHistory[0]) * 100;
  const isPositive = periodChange >= 0;

  const estimatedValue = amount ? (parseFloat(amount) * coin.price) : 0;

  const handleTrade = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showAlert('Invalid Amount', `Enter how much ${coin.symbol} to ${tradeType}.`);
      return;
    }
    const usdValue = parseFloat(amount) * coin.price;
    if (tradeType === 'buy' && usdValue > activeWallet.amount) {
      showAlert('Insufficient Funds', `You need $${usdValue.toFixed(2)} in your wallet.`);
      return;
    }
    showAlert(
      `Confirm ${tradeType === 'buy' ? 'Purchase' : 'Sale'}`,
      `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${amount} ${coin.symbol} for $${usdValue.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            await addTransaction({
              type: 'crypto',
              title: `${tradeType === 'buy' ? 'Bought' : 'Sold'} ${coin.name}`,
              subtitle: `${amount} ${coin.symbol} @ $${coin.price.toLocaleString()}`,
              amount: tradeType === 'buy' ? -usdValue : usdValue,
              currency: 'USD',
              status: 'completed',
              icon: 'currency-bitcoin',
              category: 'Crypto',
            });
            setAmount('');
            showAlert('Trade Complete!', `Successfully ${tradeType === 'buy' ? 'purchased' : 'sold'} ${amount} ${coin.symbol}.`);
          },
        },
      ]
    );
  }, [amount, coin, tradeType, activeWallet, addTransaction, showAlert]);

  if (!coin) return null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCoin}>
          <View style={[styles.coinIcon, { backgroundColor: coin.color + '22' }]}>
            <MaterialIcons name={coin.icon as any} size={20} color={coin.color} />
          </View>
          <Text style={styles.headerTitle}>{coin.name}</Text>
          <Text style={styles.headerSymbol}>{coin.symbol}</Text>
        </View>
        <Pressable
          style={styles.watchlistBtn}
          onPress={() => showAlert('Watchlist', `${coin.name} added to watchlist.`)}
          hitSlop={8}
        >
          <MaterialIcons name="star-border" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Price Hero */}
        <View style={styles.priceHero}>
          <Text style={styles.currentPrice}>${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          <View style={[styles.changePill, isPositive ? styles.changePillUp : styles.changePillDown]}>
            <MaterialIcons name={isPositive ? 'trending-up' : 'trending-down'} size={14} color={isPositive ? Colors.success : Colors.error} />
            <Text style={[styles.changeText, { color: isPositive ? Colors.success : Colors.error }]}>
              {isPositive ? '+' : ''}{periodChangePct.toFixed(2)}% ({period})
            </Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          <SparklineChart prices={priceHistory} color={coin.color} width={W - Spacing.base * 2 - Spacing.lg * 2} />

          {/* Period Selector */}
          <View style={styles.periodRow}>
            {PERIODS.map(p => (
              <Pressable
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Holdings', value: `${coin.amount} ${coin.symbol}` },
            { label: 'Value', value: `$${coin.valueUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
            { label: '24h Change', value: `${coin.change24hPercent >= 0 ? '+' : ''}${coin.change24hPercent.toFixed(2)}%`, color: coin.change24hPercent >= 0 ? Colors.success : Colors.error },
            { label: 'Avg. Buy', value: `$${(coin.valueUSD / coin.amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}` },
          ].map(stat => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statValue, stat.color ? { color: stat.color } : {}]}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Portfolio Allocation */}
        <View style={styles.allocationCard}>
          <Text style={styles.sectionTitle}>Portfolio Share</Text>
          <View style={styles.allocationBar}>
            <View style={[styles.allocationFill, {
              width: `${Math.min((coin.valueUSD / 55000) * 100, 100)}%` as any,
              backgroundColor: coin.color,
            }]} />
          </View>
          <Text style={styles.allocationPct}>
            {((coin.valueUSD / 55000) * 100).toFixed(1)}% of total portfolio
          </Text>
        </View>

        {/* Trade Panel */}
        <View style={styles.tradeCard}>
          {/* Buy/Sell Toggle */}
          <View style={styles.tradeToggle}>
            <Pressable
              style={[styles.tradeBtn, tradeType === 'buy' && styles.tradeBtnBuy]}
              onPress={() => setTradeType('buy')}
            >
              <Text style={[styles.tradeBtnText, tradeType === 'buy' && styles.tradeBtnTextActive]}>Buy</Text>
            </Pressable>
            <Pressable
              style={[styles.tradeBtn, tradeType === 'sell' && styles.tradeBtnSell]}
              onPress={() => setTradeType('sell')}
            >
              <Text style={[styles.tradeBtnText, tradeType === 'sell' && styles.tradeBtnTextActive]}>Sell</Text>
            </Pressable>
          </View>

          {/* Amount Input */}
          <Text style={styles.inputLabel}>Amount ({coin.symbol})</Text>
          <View style={styles.amountInputWrap}>
            <View style={[styles.coinPill, { backgroundColor: coin.color + '22' }]}>
              <MaterialIcons name={coin.icon as any} size={16} color={coin.color} />
              <Text style={[styles.coinPillText, { color: coin.color }]}>{coin.symbol}</Text>
            </View>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              accessibilityLabel="Trade amount"
            />
            <Pressable
              style={styles.maxBtn}
              onPress={() => {
                if (tradeType === 'buy') setAmount((activeWallet.amount / coin.price).toFixed(6));
                else setAmount(coin.amount.toString());
              }}
            >
              <Text style={styles.maxBtnText}>MAX</Text>
            </Pressable>
          </View>

          {/* Quick fractions */}
          <View style={styles.fractionRow}>
            {['25%', '50%', '75%', '100%'].map(frac => {
              const base = tradeType === 'buy' ? activeWallet.amount / coin.price : coin.amount;
              const val = (parseFloat(frac) / 100 * base).toFixed(6);
              return (
                <Pressable key={frac} style={styles.fracBtn} onPress={() => setAmount(val)}>
                  <Text style={styles.fracBtnText}>{frac}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Estimated Value */}
          {estimatedValue > 0 && (
            <View style={styles.estimatedRow}>
              <Text style={styles.estimatedLabel}>Estimated {tradeType === 'buy' ? 'Cost' : 'Proceeds'}</Text>
              <Text style={styles.estimatedValue}>${estimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          )}

          {/* Trade CTA */}
          <Pressable
            style={[styles.tradeCta, tradeType === 'buy' ? styles.tradeCtaBuy : styles.tradeCtaSell]}
            onPress={handleTrade}
          >
            <MaterialIcons
              name={tradeType === 'buy' ? 'add-shopping-cart' : 'sell'}
              size={20}
              color={Colors.textOnDark}
            />
            <Text style={styles.tradeCtaText}>
              {tradeType === 'buy' ? `Buy ${coin.symbol}` : `Sell ${coin.symbol}`}
            </Text>
          </Pressable>

          <Text style={styles.tradeDisclaimer}>
            Trading crypto involves risk. Prices fluctuate rapidly.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  headerCoin: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  coinIcon: {
    width: 36, height: 36, borderRadius: Radius.circle, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSymbol: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  watchlistBtn: {
    width: 40, height: 40, borderRadius: Radius.circle, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  content: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
  priceHero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  currentPrice: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, letterSpacing: -1 },
  changePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  changePillUp: { backgroundColor: Colors.successBg },
  changePillDown: { backgroundColor: Colors.errorBg },
  changeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  chartCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    marginBottom: Spacing.md, ...Shadow.sm, overflow: 'hidden',
  },
  chartContainer: { position: 'relative', overflow: 'hidden' },
  gridLine: {
    position: 'absolute', left: 16, right: 16, height: 1,
    backgroundColor: Colors.divider,
  },
  priceDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: Colors.surface },
  periodRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs, marginTop: Spacing.md },
  periodBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.pill,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  periodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  periodTextActive: { color: Colors.textOnDark },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', backgroundColor: Colors.surface,
    borderRadius: Radius.xl, marginBottom: Spacing.md, ...Shadow.sm, overflow: 'hidden',
  },
  statItem: {
    width: '50%', padding: Spacing.base, borderBottomWidth: 1, borderRightWidth: 1,
    borderColor: Colors.divider,
  },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs },
  statValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  allocationCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.base,
    marginBottom: Spacing.md, ...Shadow.sm,
  },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  allocationBar: {
    height: 8, backgroundColor: Colors.background, borderRadius: Radius.pill,
    overflow: 'hidden', marginBottom: Spacing.xs,
  },
  allocationFill: { height: '100%', borderRadius: Radius.pill },
  allocationPct: { fontSize: FontSize.xs, color: Colors.textMuted },
  tradeCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg,
    ...Shadow.md, borderWidth: 1, borderColor: Colors.border,
  },
  tradeToggle: {
    flexDirection: 'row', backgroundColor: Colors.background,
    borderRadius: Radius.pill, padding: 4, marginBottom: Spacing.lg,
  },
  tradeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.pill },
  tradeBtnBuy: { backgroundColor: Colors.success },
  tradeBtnSell: { backgroundColor: Colors.error },
  tradeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  tradeBtnTextActive: { color: Colors.textOnDark },
  inputLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  amountInputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  coinPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.pill,
    paddingHorizontal: 8, paddingVertical: 6, marginRight: Spacing.sm,
  },
  coinPillText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  amountInput: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, paddingVertical: Spacing.md, includeFontPadding: false },
  maxBtn: {
    backgroundColor: Colors.primary + '22', borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  maxBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  fractionRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  fracBtn: {
    flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: Radius.pill,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  fracBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  estimatedRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md,
  },
  estimatedLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  estimatedValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  tradeCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderRadius: Radius.xl, paddingVertical: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  tradeCtaBuy: { backgroundColor: Colors.success },
  tradeCtaSell: { backgroundColor: Colors.error },
  tradeCtaText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  tradeDisclaimer: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },
});
