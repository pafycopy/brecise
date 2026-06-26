import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Period = 'hari'|'minggu' | 'bulan' | 'tahun';

type Props = {
  totalWorkout: number;
  totalDistance: number;
  // Opsional: kalau mau data berbeda per periode
  dataByPeriod?: Record<Period, { workout: number; distance: number }>;
};

const PERIODS: { key: Period; label: string }[] = [
  { key: 'hari', label: 'Hari' },
  { key: 'minggu', label: 'Minggu' },
  { key: 'bulan',  label: 'Bulan'  },
  { key: 'tahun',  label: 'Tahun'  },
];

export default function StatsRow({ totalWorkout, totalDistance, dataByPeriod }: Props) {
  const [activePeriod, setActivePeriod] = useState<Period>('minggu');

  // Pakai data per periode jika tersedia, fallback ke props
  const workout  = dataByPeriod ? dataByPeriod[activePeriod].workout  : totalWorkout;
  const distance = dataByPeriod ? dataByPeriod[activePeriod].distance : totalDistance;

  return (
    <View style={styles.wrapper}>
      {/* Filter pills */}
      <View style={styles.filterRow}>
        {PERIODS.map(({ key, label }) => {
          const isActive = activePeriod === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => setActivePeriod(key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Cards */}
      <View style={styles.container}>
        {/* Card Workout */}
        <View style={styles.card}>
          <Text style={styles.label}>TOTAL WORKOUT</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{workout}</Text>
            <Ionicons name="barbell-sharp" size={28} color="#4CD964" style={styles.icon} />
          </View>
        </View>

        {/* Card Distance */}
        <View style={styles.card}>
          <Text style={styles.label}>TOTAL JARAK</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>
              {distance}
              <Text style={styles.unit}> km</Text>
            </Text>
            <Ionicons name="walk" size={28} color="#007AFF" style={styles.icon} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 10 },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  pill: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  pillActive: {
    backgroundColor: '#6BFF8F',
  },
  pillText: {
    fontSize: 12, fontWeight: '600', color: '#888',
  },
  pillTextActive: {
    color: '#191C1E',
  },

  container: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  label: {
    fontSize: 12, fontWeight: '700', color: '#111', letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: 12, marginTop: 32, 
  },
  value: {
    marginHorizontal: 12, fontSize: 32, fontWeight: '800', color: '#111',
  },
  unit: {
    fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 3,
  },
  icon: {
    marginBottom: 4, marginHorizontal: 12,
  },
});