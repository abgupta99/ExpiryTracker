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
} from 'react-native';
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
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Expiring Soon</Text>
        <View style={styles.headerButtons}>
          <Button title="Add" onPress={() => navigation.navigate('AddItem')} />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : items && items.length > 0 ? (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(i, idx) => (i.id ? String(i.id) : `item-${idx}`)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No items expiring in the next 7 days.</Text>
          <View style={{ height: 12 }} />
          <Button title="Add your first item" onPress={() => navigation.navigate('AddItem')} />
        </View>
      )}

      <View style={styles.footerRow}>
        <Button title="Scan" onPress={() => navigation.navigate('Scan')} />
        <Button title="Premium" onPress={() => navigation.navigate('Premium')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '600' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
});
