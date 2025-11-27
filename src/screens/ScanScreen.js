import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addItem } from '../database/queries';

// Lazy require camera to avoid bundler/native crashes when the module isn't installed
let Camera = null;
try {
  // eslint-disable-next-line global-require
  Camera = require('react-native-vision-camera').Camera;
} catch (e) {
  Camera = null;
}

export default function ScanScreen({ navigation }) {
  const [manualMode, setManualMode] = useState(!Camera);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Other');
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 3 * 24 * 3600 * 1000));
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    // no-op: placeholder if we later request permissions for Camera
  }, []);

  const onScanSimulate = () => {
    const scanned = {
      name: name || `Scanned item ${Date.now()}`,
      expiryDate: expiryDate.toISOString(),
      category,
      quantity: 1,
      notes: 'Scanned (simulated)',
      reminderDays: 3,
    };

    addItem(scanned, (id) => {
      if (id) {
        Alert.alert('Saved', 'Scanned item saved.');
        // Go back to home to show list; prefer navigate to Home to ensure refresh
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', 'Could not save scanned item.');
      }
    });
  };

  const onChangeDate = (event, selected) => {
    setShowPicker(Platform.OS === 'ios');
    if (selected) setExpiryDate(selected);
  };

  const tryEnableCamera = () => {
    try {
      // attempt to dynamically require the native module at runtime
      // eslint-disable-next-line global-require
      const mod = require('react-native-vision-camera');
      if (mod && mod.Camera) {
        Camera = mod.Camera;
        setManualMode(false);
        return;
      }
    } catch (e) {
      // fallthrough to alert
    }

    Alert.alert(
      'Camera not available',
      'react-native-vision-camera is not installed or not available in this runtime.\n\nTo enable camera scanning:\n• Run `npm install react-native-vision-camera`\n• For Expo managed projects you need a custom dev client / EAS dev build.\n• See https://mrousavy.com/react-native-vision-camera for setup details.',
      [{ text: 'OK' }],
    );
  };

  if (Camera && !manualMode) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera Scan (vision-camera detected)</Text>
        <View style={styles.cameraPlaceholder}>
          <Text style={{ color: '#fff' }}>Camera preview would appear here.</Text>
        </View>
        <View style={styles.buttonRow}>
          <Button title="Simulate Scan" onPress={onScanSimulate} />
          <View style={{ width: 12 }} />
          <Button title="Manual" onPress={() => setManualMode(true)} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan (manual fallback)</Text>

      <TextInput placeholder="Item name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Category" value={category} onChangeText={setCategory} style={styles.input} />

      <View style={{ marginVertical: 8 }}>
        <Button title={`Expiry: ${expiryDate.toDateString()}`} onPress={() => setShowPicker(true)} />
        {showPicker && (
          <DateTimePicker value={expiryDate} mode="date" display="default" onChange={onChangeDate} />
        )}
      </View>

      <View style={styles.buttonRow}>
        <Button title="Simulate Scan (save)" onPress={onScanSimulate} />
        <View style={{ width: 12 }} />
        <Button title="Try Camera" onPress={tryEnableCamera} />
      </View>

      <View style={{ height: 12 }} />
      <Button title="Cancel" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  cameraPlaceholder: { flex: 1, backgroundColor: '#000', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 8 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});
