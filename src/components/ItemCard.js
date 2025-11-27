import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import theme from '../styles/theme';
import { daysUntilExpiry } from '../utils/dateUtils';

export default function ItemCard({ item, onPress, onLongPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const daysLeft = daysUntilExpiry(item.expiryDate);

  const isExpired = (() => {
    try {
      const d = typeof item.expiryDate === 'string' ? new Date(item.expiryDate) : item.expiryDate;
      return d && d < new Date();
    } catch (e) {
      return false;
    }
  })();

  const accent = isExpired ? theme.colors.danger : daysLeft < 3 ? theme.colors.warn : theme.colors.success;
  const statusText = isExpired ? 'Expired' : daysLeft < 3 ? 'Use soon' : 'Good';

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  const categoryMap = {
    'Packed Food': { color: '#f97316', label: '🍱' },
    Meat: { color: '#ef4444', label: '🍖' },
    Vegetable: { color: '#16a34a', label: '🥬' },
    Fruit: { color: '#f43f5e', label: '�' },
    Drinks: { color: '#0ea5e9', label: '🥤' },
    Medicine: { color: '#06b6d4', label: '💊' },
    Dairy: { color: '#8b5cf6', label: '�' },
    Other: { color: '#64748b', label: '✨' },
  };
  const cat = categoryMap[item.category] || categoryMap.Other;

  return (
    <TouchableWithoutFeedback
      onPress={() => onPress && onPress(item)}
      onLongPress={() => onLongPress && onLongPress(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        <View style={[styles.catIconWrap]}> 
          <View style={[styles.catIcon, { backgroundColor: cat.color }]}> 
            <Text style={styles.catIconText}>{cat.label}</Text>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.badge, { backgroundColor: accent }]}>
                  <Text style={styles.badgeText}>{statusText}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => onPress && onPress(item)}
                  style={styles.iconButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.iconText}>›</Text>
                </TouchableOpacity>
              </View>
          </View>
          <Text style={styles.meta}>
            Expiring in {daysLeft} day{daysLeft === 1 ? '' : 's'}
          </Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.m,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  accent: {
    width: theme.spacing.xs,
  },
  content: {
    flex: 1,
    padding: theme.spacing.s,
  },
  catIconWrap: { justifyContent: 'center', paddingHorizontal: theme.spacing.s },
  catIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  catIconText: { fontSize: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: theme.typography.body, fontWeight: '700', color: theme.colors.text },
  meta: { marginTop: 6, color: theme.colors.muted, fontSize: theme.typography.small },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radii.round,
    alignSelf: 'flex-start',
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  iconButton: {
    marginLeft: theme.spacing.s,
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  iconText: { color: theme.colors.muted, fontSize: 20, fontWeight: '700' },
});
