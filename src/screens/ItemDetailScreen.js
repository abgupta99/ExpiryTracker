import React from 'react';
import { View, Text, Button } from 'react-native';
import { deleteItem } from '../database/queries';

export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params || {};
  if (!item) return <View><Text>No item</Text></View>;

  const handleDelete = () => {
    deleteItem(item.id, () => navigation.goBack());
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
      <Text>Expires: {item.expiryDate}</Text>
      <Text>Category: {item.category}</Text>
      <Text>Notes: {item.notes || '—'}</Text>
      <Button title="Delete" onPress={handleDelete} />
    </View>
  );
}
