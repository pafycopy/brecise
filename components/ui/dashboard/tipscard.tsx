import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Tip = {
  id: number;
  title: string;
  description: string;
  icon: string;
  iconBg: string;
};

type Props = {
  tip: Tip;
  onPress?: () => void;
};

export default function TipsCard({ tip, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.iconBox, { backgroundColor: tip.iconBg }]}>
        <Ionicons name={tip.icon as any} size={20} color="#111" />
      </View>
      <View style={styles.textArea}>
        <Text style={styles.title}>{tip.title}</Text>
        <Text style={styles.description} numberOfLines={3}>{tip.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#BBB" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 30,
    marginHorizontal: 4,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 1,
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  textArea: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 3 },
  description: { fontSize: 12, lineHeight: 18, color: '#777' },
});