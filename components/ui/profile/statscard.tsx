import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type UserStats = {
  total_distance_km: number;
  completed_runs: number;
};

const StatsCard = () => {
  const [stats, setStats] = useState<UserStats>({
    total_distance_km: 0,
    completed_runs: 0,
  });

  useEffect(() => {
  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_stats')
      .select('total_distance_km, completed_runs')
      .eq('user_id', user.id)
      .maybeSingle(); // ← ganti dari .single()

    if (error) { console.error(error); return; }
    if (data) setStats(data);
    // Kalau data null (belum ada row), state tetap default 0
  };

  fetchStats();
}, []);

  const totalDistance = stats.total_distance_km ?? 0;
  const displayDistance =
    totalDistance >= 1000
      ? `${(totalDistance / 1000).toFixed(1)} km`
      : `${totalDistance.toFixed(1)} km`;

  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.label}>TOTAL DISTANCE</Text>
        <Text style={styles.value}>
          {displayDistance.split(' ')[0]}
          <Text style={styles.unit}> {displayDistance.split(' ')[1]}</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.card}>
        <Text style={styles.label}>TOTAL RUNS</Text>
        <Text style={styles.value}>{stats.completed_runs ?? 0}</Text>
      </View>
    </View>
  );
};

export default StatsCard;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  label: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
});