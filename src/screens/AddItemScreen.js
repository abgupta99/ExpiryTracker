import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Alert, Platform, Text, TouchableOpacity } from 'react-native';
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
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput placeholder="Name" value={name} onChangeText={setName} style={{ borderWidth: 1, padding: 8, marginBottom: 8 }} />
      {Platform.OS === 'web' ? (
        <TextInput placeholder="Expiry YYYY-MM-DD" value={expiryDate} onChangeText={setExpiryDate} style={{ borderWidth: 1, padding: 8, marginBottom: 8 }} />
      ) : (
        <>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={{ padding: 12, borderWidth: 1, marginBottom: 8 }}>
            <Text>Expiry: {expiryDate}</Text>
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
        <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 6, marginBottom: 8 }}>
          <Picker selectedValue={category} onValueChange={(v) => setCategory(v)}>
            <Picker.Item label="Food" value="Food" />
            <Picker.Item label="Medicine" value="Medicine" />
            <Picker.Item label="Dairy" value="Dairy" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', marginBottom: 8, justifyContent: 'space-between' }}>
          {['Food', 'Medicine', 'Dairy', 'Other'].map((c) => (
            <TouchableOpacity key={c} onPress={() => setCategory(c)} style={{ padding: 8, borderWidth: 1, borderColor: category === c ? '#007aff' : '#ddd', borderRadius: 6 }}>
              <Text style={{ color: category === c ? '#007aff' : '#000' }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <Button title="Save" onPress={handleAdd} />
    </View>
  );
}
