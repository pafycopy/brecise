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
          <Text style={styles.label}>TOTAL LATIHAN</Text>

          {/* ✅ CHANGED: ikon sekarang di TENGAH, di ATAS angka (tersusun
              vertikal) — ikon aslinya (barbell-sharp, hijau) gak diubah,
              cuma posisinya aja yang dipindah dari samping angka jadi
              di atas angka. */}
          <Ionicons
            name="barbell-sharp"
            size={28}
            color="#4CD964"
            style={styles.icon}
          />

          <Text style={styles.value}>{workout}</Text>
        </View>

        {/* Card Distance */}
        <View style={styles.card}>
          <Text style={styles.label}>TOTAL JARAK</Text>

          <Ionicons
            name="walk"
            size={28}
            color="#007AFF"
            style={styles.icon}
          />

          <Text style={styles.value}>
            {distance}
            <Text style={styles.unit}> km</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

// ✅ FIX: includeFontPadding: false ditambah ke semua Text style, konsisten
// dengan fix di TipsCard.
const styles = StyleSheet.create({
  wrapper: { gap: 10 },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    marginBottom: 6
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
    fontSize: 12, fontWeight: '600', color: '#888', includeFontPadding: false,
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
    shadowOpacity: 0,
    shadowRadius: 8,
    // ✅ CHANGED: alignItems tetap center biar konten (label, ikon, angka)
    // rata tengah horizontal, sesuai gambar referensi.
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
  },
  label: {
    fontSize: 12, fontWeight: '700', color: '#111', letterSpacing: 0.5, includeFontPadding: false,
  },
  // ✅ CHANGED: ikon sekarang jadi elemen tersendiri di TENGAH card,
  // dengan jarak dari label di atas dan angka di bawahnya.
  icon: {
    marginTop: 14,
    marginBottom: 10,
  },
  // ✅ CHANGED: value sekarang berdiri sendiri (bukan di dalam valueRow
  // bareng ikon lagi), rata tengah, tanpa marginHorizontal aneh.
  value: {
    fontSize: 32, fontWeight: '800', color: '#111', includeFontPadding: false,
  },
  unit: {
    fontSize: 14, fontWeight: '600', color: '#111', includeFontPadding: false,
  },
});