import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { daysUntilExpiry } from '../utils/dateUtils';

export default function ItemCard({ item, onPress }) {
  const daysLeft = daysUntilExpiry(item.expiryDate);
  const color = daysLeft < 3 ? '#ffdddd' : '#fffde7';
  return (
    <TouchableOpacity onPress={() => onPress && onPress(item)}>
      <View style={{ padding: 8, backgroundColor: color, marginBottom: 8, borderRadius: 6 }}>
        <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
        <Text>Expires on {item.expiryDate} ({daysLeft} days)</Text>
      </View>
    </TouchableOpacity>
  );
}
