import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
} from 'react-native';
import theme from '../styles/theme';
import { daysUntilExpiry } from '../utils/dateUtils';

export default function ItemCard({ item, onPress, onLongPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const daysLeft = daysUntilExpiry(item.expiryDate);

  const accent = daysLeft < 3 ? theme.colors.danger : daysLeft < 7 ? theme.colors.warn : theme.colors.success;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => onPress && onPress(item)}
      onLongPress={() => onLongPress && onLongPress(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          <Text style={styles.meta}>
            Expires on {item.expiryDate} • {daysLeft} day{daysLeft === 1 ? '' : 's'}
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
  name: { fontSize: theme.typography.body, fontWeight: '700', color: theme.colors.text },
  meta: { marginTop: 6, color: theme.colors.muted, fontSize: theme.typography.small },
});
