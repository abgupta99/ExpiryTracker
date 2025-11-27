import React from 'react';
import { View, Text, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PremiumScreen({ navigation }) {
  const buyPremium = async () => {
    // Placeholder: implement expo-in-app-purchases flow
    await AsyncStorage.setItem('premium', 'true');
    alert('Marked as premium (placeholder)');
    navigation.goBack();
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>Premium features</Text>
      <Button title="Buy Premium (placeholder)" onPress={buyPremium} />
    </View>
  );
}
