import React, { useEffect } from 'react';
import { View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { setupDatabase } from './src/database/db';
import { scheduleReminders } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    setupDatabase();
    scheduleReminders();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
    </View>
  );
}
