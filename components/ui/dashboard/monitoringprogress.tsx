import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  consistencyPercent: number;
  message: string;
};

export default function MonitoringProgress({ consistencyPercent, message }: Props) {
  return (
    <View style={styles.card}>
      {/* Dekorasi lingkaran pojok kanan atas */}
      <View style={styles.circleOuter} pointerEvents="none">
        <LinearGradient
          colors={['rgba(180,220,180,0.5)', 'rgba(200,240,200,0.1)']}
          style={styles.circleGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <Text style={styles.title}>Monitoring Progres</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 30,
    marginHorizontal:4,
    gap: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 0,
  },
  circleOuter: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
  },
  circleGradient: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111',
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
    color: '#444444',
  },
});