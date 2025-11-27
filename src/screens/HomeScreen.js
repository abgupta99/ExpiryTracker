import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import theme from '../styles/theme';
import { getExpiringItems, deleteItem } from '../database/queries';
import ItemCard from '../components/ItemCard';
import { useIsFocused } from '@react-navigation/native';
import { scheduleReminders } from '../services/notificationService';

export default function HomeScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const fetchItems = useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    getExpiringItems(7, (rows) => {
      setItems(rows || []);
      setLoading(false);
      setRefreshing(false);
    });
  }, []);

  useEffect(() => {
    if (isFocused) fetchItems(true);
  }, [isFocused, fetchItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems(false);
  };

  const confirmDelete = (id, name) => {
    Alert.alert(
      'Delete item',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(id),
        },
      ],
      { cancelable: true }
    );
  };

  const handleDelete = async (id) => {
    try {
      deleteItem(id, (res) => {
        // res is truthy on success (changes number or true for storage fallback)
        if (res) {
          fetchItems(true);
          // reschedule reminders after deletion
          scheduleReminders().catch((e) => console.warn('scheduleReminders failed', e));
        } else {
          Alert.alert('Delete failed', 'Could not delete the item.');
        }
      });
    } catch (e) {
      console.error('handleDelete error', e);
      Alert.alert('Error', 'Unexpected error while deleting item.');
    }
  };

  const renderItem = ({ item }) => (
    <ItemCard
      item={item}
      onPress={() => navigation.navigate('ItemDetail', { item })}
      onLongPress={() => confirmDelete(item.id, item.name)}
    />
  );

  return (
    <View style={styles.appWrap}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Expiry Tracker</Text>
        <Text style={styles.heroSubtitle}>Items expiring soon</Text>
        <View style={styles.heroActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddItem')}
            style={styles.addButton}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2b6cb0" />
          </View>
        ) : items && items.length > 0 ? (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(i, idx) => (i.id ? String(i.id) : `item-${idx}`)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No items expiring in the next 7 days.</Text>
            <View style={{ height: 12 }} />
            <TouchableOpacity
              onPress={() => navigation.navigate('AddItem')}
              style={styles.ghostButton}
              activeOpacity={0.8}
            >
              <Text style={styles.ghostButtonText}>Add your first item</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footerRow}>
        <Button title="Scan" onPress={() => navigation.navigate('Scan')} />
        <Button title="Premium" onPress={() => navigation.navigate('Premium')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appWrap: {
    flex: 1,
    backgroundColor: '#f6fbff',
  },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 60 : 36,
    paddingBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: theme.radii.lg,
    borderBottomRightRadius: theme.radii.lg,
    ...theme.shadow.card,
  },
  heroTitle: { color: '#fff', fontSize: theme.typography.h1, fontWeight: '700' },
  heroSubtitle: { color: theme.colors.primarySoft, marginTop: 6, fontSize: theme.typography.small },
  heroActions: { marginTop: theme.spacing.s, flexDirection: 'row', justifyContent: 'flex-end' },
  addButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.radii.md,
    ...theme.shadow.card,
  },
  addButtonText: { color: theme.colors.primary, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.s },
  listContainer: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  emptyText: { color: theme.colors.muted, fontSize: theme.typography.body },
  ghostButton: {
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.radii.md,
  },
  ghostButtonText: { color: theme.colors.text },
  footerRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
});
