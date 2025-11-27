import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, Platform, Text, TouchableOpacity, StyleSheet } from 'react-native';
import theme from '../styles/theme';
import { addItem } from '../database/queries';
import { scheduleReminders } from '../services/notificationService';
import { formatDate } from '../utils/dateUtils';
import DateTimePicker from '@react-native-community/datetimepicker';

// Try to load native Picker if available; fallback to null
let Picker = null;
try {
  // eslint-disable-next-line global-require
  Picker = require('@react-native-picker/picker').Picker;
} catch (e) {
  Picker = null;
}

const defaultExpiry = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return formatDate(d);
};

export default function AddItemScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState(defaultExpiry());
  const [showPicker, setShowPicker] = useState(false);
  const [category, setCategory] = useState('Other');

  useEffect(() => {
    const preset = route?.params?.presetCategory;
    if (preset) setCategory(preset);
  }, [route]);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Please enter an item name');
      return;
    }
    console.log('in ADD');
  addItem({ name: trimmed, expiryDate, category, quantity: 1, notes: '', reminderDays: 3 }, (insertId) => {
      console.log('addItem callback, insertId=', insertId);
      if (!insertId) {
        console.log('in add item error');
        Alert.alert('Error', 'Failed to save item');
        return;
      }
      scheduleReminders();
      navigation.goBack();
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor={theme.colors.muted}
      />

      {Platform.OS === 'web' ? (
        <TextInput
          placeholder="Expiry YYYY-MM-DD"
          value={expiryDate}
          onChangeText={setExpiryDate}
          style={styles.input}
          placeholderTextColor={theme.colors.muted}
        />
      ) : (
        <>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.inputButton}>
            <Text style={styles.inputButtonText}>Expiry: {expiryDate}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={new Date(expiryDate)}
              mode="date"
              display="calendar"
              onChange={(e, d) => {
                setShowPicker(Platform.OS === 'ios');
                if (d) setExpiryDate(formatDate(d));
              }}
            />
          )}
        </>
      )}

      {/* Category selector */}
      {Picker ? (
        <View style={styles.pickerWrap}>
          <Picker selectedValue={category} onValueChange={(v) => setCategory(v)}>
            <Picker.Item label="Food" value="Food" />
            <Picker.Item label="Medicine" value="Medicine" />
            <Picker.Item label="Dairy" value="Dairy" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
      ) : (
        <View style={styles.row}>{['Food', 'Medicine', 'Dairy', 'Other'].map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={[
              styles.chip,
              { borderColor: category === c ? theme.colors.primary : theme.colors.border },
            ]}
          >
            <Text style={{ color: category === c ? theme.colors.primary : theme.colors.text }}>{c}</Text>
          </TouchableOpacity>
        ))}</View>
      )}

      <View style={{ marginTop: theme.spacing.m }}>
        <Button title="Save" onPress={handleAdd} color={theme.colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.m, backgroundColor: theme.colors.background },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.s,
    marginBottom: theme.spacing.s,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  inputButton: {
    padding: theme.spacing.s,
    marginBottom: theme.spacing.s,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  inputButtonText: { color: theme.colors.text },
  pickerWrap: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.sm, marginBottom: theme.spacing.s, backgroundColor: theme.colors.surface },
  row: { flexDirection: 'row', marginBottom: theme.spacing.s, justifyContent: 'space-between' },
  chip: { padding: theme.spacing.xs, borderWidth: 1, borderRadius: theme.radii.sm, flex: 1, marginHorizontal: 4, alignItems: 'center' },
});
