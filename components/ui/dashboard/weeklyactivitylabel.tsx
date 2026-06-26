import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  label: string;
  sublabel: string;
};

export default function WeeklyActivityLabel({ label, sublabel }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sublabel}>{sublabel}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 6,
  },
  sublabel: {
    fontSize: 12,

    color: '#111',
    letterSpacing: 0.8,
    fontFamily:'Lexend-Bold'
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4CD964',
  },
});