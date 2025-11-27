import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView, Platform } from 'react-native';
import { deleteItem } from '../database/queries';
import theme from '../styles/theme';
import { daysUntilExpiry } from '../utils/dateUtils';

export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params || {};
  if (!item) return <View style={styles.empty}><Text style={styles.emptyText}>No item selected</Text></View>;

  const daysLeft = daysUntilExpiry(item.expiryDate);

  const confirmDelete = () => {
    Alert.alert(
      'Delete item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ],
      { cancelable: true }
    );
  };

  const handleDelete = () => {
    deleteItem(item.id, () => navigation.goBack());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>{daysLeft} day{daysLeft === 1 ? '' : 's'} left • {item.category || '—'}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Expires</Text>
          <Text style={styles.value}>{item.expiryDate}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>{item.category || '—'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Quantity</Text>
          <Text style={styles.value}>{item.quantity ?? '—'}</Text>
        </View>

        <View style={styles.rowNotes}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.notes}>{item.notes || '—'}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => navigation.navigate('AddItem', { item })}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionText, styles.editText]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={confirmDelete}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.m },
  emptyText: { color: theme.colors.muted },
  hero: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderBottomLeftRadius: theme.radii.lg,
    borderBottomRightRadius: theme.radii.lg,
    ...theme.shadow.card,
  },
  title: { color: '#fff', fontSize: theme.typography.h1, fontWeight: '700' },
  subtitle: { color: theme.colors.primarySoft, marginTop: 6 },
  card: {
    margin: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.m,
    ...theme.shadow.card,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.xs },
  rowNotes: { paddingVertical: theme.spacing.s },
  label: { color: theme.colors.muted, fontSize: theme.typography.small },
  value: { color: theme.colors.text, fontSize: theme.typography.body, fontWeight: '600' },
  notes: { marginTop: theme.spacing.xs, color: theme.colors.text },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: theme.spacing.m },
  actionBtn: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.radii.md,
    alignItems: 'center',
  },
  editBtn: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary },
  deleteBtn: { backgroundColor: theme.colors.danger },
  actionText: { fontWeight: '700' },
  editText: { color: theme.colors.primary },
  deleteText: { color: '#fff' },
});
