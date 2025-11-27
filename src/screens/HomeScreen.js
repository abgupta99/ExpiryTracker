import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  TextInput,
  Animated,
} from 'react-native';
// Picker is an optional dependency; require dynamically
let Picker = null;
try {
  // eslint-disable-next-line global-require
  Picker = require('@react-native-picker/picker').Picker;
} catch (e) {
  Picker = null;
}
import theme from '../styles/theme';
import { getExpiringItems, deleteItem, getAllItems } from '../database/queries';
import ItemCard from '../components/ItemCard';
import { Swipeable } from 'react-native-gesture-handler';
import { useIsFocused } from '@react-navigation/native';
import { scheduleReminders } from '../services/notificationService';

export default function HomeScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All', 'Packed Food', 'Meat', 'Vegetable', 'Fruit', 'Drinks', 'Medicine', 'Dairy', 'Other']);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [search, setSearch] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  const fetchItems = useCallback((days = selectedDays, category = selectedCategory, showLoading = true) => {
    if (showLoading) setLoading(true);

    const handleRows = (rows) => {
      let list = rows || [];

      // compute categories and counts from the fetched rows
      const counts = (rows || []).reduce((acc, it) => {
        const c = it.category || 'Other';
        acc[c] = (acc[c] || 0) + 1;
        acc.All = (acc.All || 0) + 1;
        return acc;
      }, { All: 0 });
      const uniqueCats = ['All', ...Object.keys(counts).filter((c) => c !== 'All')];
      setCategories(uniqueCats);
      setCategoryCounts(counts);

      if (category && category !== 'All') {
        list = list.filter((it) => (it.category || 'Other') === category);
      }

      // client-side search filter
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter((it) => (it.name || '').toLowerCase().includes(q));
      }

      setItems(list);
      setLoading(false);
      setRefreshing(false);

      // animate content in
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    };

    if (days === 'all' || days === 'All') {
      getAllItems(handleRows);
    } else {
      // numeric days
      getExpiringItems(Number(days), handleRows);
    }
  }, [selectedDays, selectedCategory, search, fadeAnim]);

  useEffect(() => {
    if (isFocused) fetchItems(selectedDays, selectedCategory, true);
  }, [isFocused, fetchItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems(selectedDays, selectedCategory, false);
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
          // refresh using current filters (days & category)
          fetchItems(selectedDays, selectedCategory, true);
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
    <Swipeable
      renderLeftActions={() => (
        <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteActionText}>🗑️ Delete</Text>
        </TouchableOpacity>
      )}
      onSwipeableOpen={(direction) => {
        // if fully swiped right, open direction will be 'right' — delete immediately
        if (direction === 'right') handleDelete(item.id);
      }}
    >
      <ItemCard
        item={item}
        onPress={() => navigation.navigate('ItemDetail', { item })}
        onLongPress={() => confirmDelete(item.id, item.name)}
      />
    </Swipeable>
  );

  return (
    <View style={styles.appWrap}>

      {/* Search + Filters */}
      <View style={styles.filtersWrap}>
        <TextInput
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            // refetch to reapply search client-side
            fetchItems(selectedDays, selectedCategory, true);
          }}
          placeholder="Search items by name"
          placeholderTextColor={theme.colors.muted}
          style={styles.searchInput}
        />

        {/* Day range and category menus */}
        <View style={{ flexDirection: 'row', marginTop: theme.spacing.xs, alignItems: 'center' }}>
          {Picker ? (
            <View style={{ flex: 1, marginRight: theme.spacing.s, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm }}>
              <Picker
                selectedValue={selectedDays}
                onValueChange={(val) => {
                  setSelectedDays(val);
                  fetchItems(val, selectedCategory, true);
                }}
              >
                <Picker.Item label="2 days" value={2} />
                <Picker.Item label="3 days" value={3} />\
                <Picker.Item label="7 days" value={7} />
                <Picker.Item label="10 days" value={10} />
                <Picker.Item label="All" value={'all'} />
              </Picker>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {['2', '3', '7', '10', 'all'].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => {
                    const val = d === 'all' ? 'all' : Number(d);
                    setSelectedDays(val);
                    fetchItems(val, selectedCategory, true);
                  }}
                  style={[styles.filterChip, String(selectedDays) === d && styles.filterChipActive]}
                >
                  <Text style={styles.filterText}>{d === 'all' ? 'All' : `${d}d`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {Picker ? (
            <View style={{ width: 150, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm }}>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={(val) => {
                  setSelectedCategory(val);
                  fetchItems(selectedDays, val, true);
                }}
              >
                {categories.map((c) => {
                  // c may be a string from DB or our category config value; try to find matching config
                  const conf = require('../config/categories').default.find((x) => x.value === c);
                  const icon = conf ? `${conf.icon} ` : '';
                  return <Picker.Item key={c} label={`${icon}${c} (${categoryCounts[c] || 0})`} value={c} />;
                })}
              </Picker>
            </View>
          ) : (
            <View style={{ width: 150 }}>
              {/* fallback: first category only shown */}
              <Text style={{ color: theme.colors.muted }}>{selectedCategory}</Text>
            </View>
          )}
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
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
            <Text style={styles.emptyText}>
              {selectedDays === 'all' ? 'No items.' : `No items expiring in the next ${selectedDays} day${selectedDays === 1 ? '' : 's'}.`}
            </Text>
            <View style={{ height: 12 }} />
              <Text style={styles.emptyText}>Tap + to add your first item</Text>
          </View>
        )}
      </Animated.View>
        {/* Floating Add button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddItem')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  appWrap: {
    flex: 1,
    backgroundColor: '#f6fbff',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.card,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '700' },
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
  filtersWrap: { paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.s },
  filterRow: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8 },
  filterChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.s,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  filterText: { color: theme.colors.text },
  filterTextActive: { color: theme.colors.primary },
  categoryChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.s,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  categoryText: { color: theme.colors.text },
  categoryTextActive: { color: '#fff' },
  deleteAction: {
    backgroundColor: theme.colors.danger,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 8,
    marginVertical: 8,
  },
  deleteActionText: { color: '#fff', fontWeight: '700' },
});
