import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { getExpiredItems } from '../database/queries';
import ItemCard from '../components/ItemCard';

export default function ExpiredScreen() {
  const [items, setItems] = useState([]);
  useEffect(() => getExpiredItems(setItems), []);
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>Expired</Text>
      <FlatList data={items} renderItem={({ item }) => <ItemCard item={item} />} keyExtractor={i => i.id?.toString() || Math.random().toString()} />
    </View>
  );
}
