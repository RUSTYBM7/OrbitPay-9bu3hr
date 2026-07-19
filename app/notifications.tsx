import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  FlatList, Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallet } from '../hooks/useWallet';
import { Colors, Spacing, FontSize, FontWeight, Radius, Shadow } from '../constants/theme';
import { Notification } from '../services/mockData';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'notifications' },
  { id: 'transaction', label: 'Transactions', icon: 'swap-horiz' },
  { id: 'security', label: 'Security', icon: 'security' },
  { id: 'promotion', label: 'Offers', icon: 'local-offer' },
  { id: 'system', label: 'System', icon: 'info' },
];

const TYPE_COLORS: Record<string, string> = {
  transaction: Colors.success,
  security: Colors.error,
  promotion: Colors.bitcoin,
  system: Colors.info,
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useWallet();

  const [activeCategory, setActiveCategory] = useState('all');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const filtered = notifications.filter(n =>
    !dismissed.has(n.id) &&
    (activeCategory === 'all' || n.type === activeCategory)
  );

  const unreadFiltered = filtered.filter(n => !n.read).length;

  const handleDismiss = useCallback((id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  }, []);

  const renderNotification = ({ item }: { item: Notification }) => {
    const typeColor = TYPE_COLORS[item.type] ?? Colors.primary;
    const timeLabel = (() => {
      const d = new Date(item.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    })();

    return (
      <Pressable
        style={[styles.notifCard, !item.read && styles.notifCardUnread]}
        onPress={() => markNotificationRead(item.id)}
        accessibilityLabel={item.title}
      >
        {/* Unread indicator */}
        {!item.read && <View style={styles.unreadDot} />}

        {/* Icon */}
        <View style={[styles.notifIconWrap, { backgroundColor: typeColor + '18' }]}>
          <MaterialIcons name={item.icon as any} size={22} color={typeColor} />
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <View style={styles.notifTop}>
            <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.notifTime}>{timeLabel}</Text>
          </View>
          <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
          <View style={styles.notifTypeBadge}>
            <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
            <Text style={[styles.notifTypeText, { color: typeColor }]}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
        </View>

        {/* Dismiss */}
        <Pressable
          style={styles.dismissBtn}
          onPress={() => handleDismiss(item.id)}
          hitSlop={12}
          accessibilityLabel="Dismiss notification"
        >
          <MaterialIcons name="close" size={16} color={Colors.textMuted} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadFiltered > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadFiltered}</Text>
            </View>
          )}
        </View>
        <Pressable
          style={styles.markAllBtn}
          onPress={markAllNotificationsRead}
          hitSlop={8}
          disabled={unreadFiltered === 0}
        >
          <Text style={[styles.markAllText, unreadFiltered === 0 && { opacity: 0.4 }]}>
            Mark all read
          </Text>
        </Pressable>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catBar}>
        {CATEGORIES.map(cat => {
          const catCount = notifications.filter(n =>
            !dismissed.has(n.id) && !n.read &&
            (cat.id === 'all' || n.type === cat.id)
          ).length;
          return (
            <Pressable
              key={cat.id}
              style={[styles.catTab, activeCategory === cat.id && styles.catTabActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <MaterialIcons
                name={cat.icon as any}
                size={14}
                color={activeCategory === cat.id ? Colors.textOnDark : Colors.textSecondary}
              />
              <Text style={[styles.catTabText, activeCategory === cat.id && styles.catTabTextActive]}>
                {cat.label}
              </Text>
              {catCount > 0 && (
                <View style={[styles.catBadge, activeCategory === cat.id && styles.catBadgeActive]}>
                  <Text style={[styles.catBadgeText, activeCategory === cat.id && styles.catBadgeTextActive]}>
                    {catCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="notifications-none" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>No notifications in this category</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
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
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerBadge: {
    backgroundColor: Colors.error, borderRadius: Radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  headerBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  markAllBtn: { paddingVertical: 6, paddingHorizontal: Spacing.sm },
  markAllText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  catBar: { paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  catTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 9, borderRadius: Radius.pill,
    backgroundColor: Colors.surface, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  catTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catTabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  catTabTextActive: { color: Colors.textOnDark, fontWeight: FontWeight.semibold },
  catBadge: {
    backgroundColor: Colors.error, borderRadius: Radius.pill, minWidth: 18,
    height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  catBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  catBadgeText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textOnDark },
  catBadgeTextActive: { color: Colors.textOnDark },
  listContent: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.base, ...Shadow.sm, position: 'relative', overflow: 'hidden',
  },
  notifCardUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  unreadDot: {
    position: 'absolute', top: Spacing.md, right: Spacing.md + 28,
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary,
  },
  notifIconWrap: {
    width: 46, height: 46, borderRadius: Radius.circle,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  notifTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, flex: 1 },
  notifTitleUnread: { color: Colors.textPrimary, fontWeight: FontWeight.bold },
  notifTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: Spacing.sm },
  notifMessage: { fontSize: FontSize.sm, color: Colors.textMuted, lineHeight: 18, marginBottom: Spacing.sm },
  notifTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeDot: { width: 6, height: 6, borderRadius: 3 },
  notifTypeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  dismissBtn: { padding: 4, marginLeft: Spacing.sm },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: Spacing.xxxl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.base },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
});
