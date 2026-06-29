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
        .maybeSingle();

      if (error) { console.error(error); return; }
      if (data) setStats(data);
    };

    fetchStats();
  }, []);

  const totalDistance = stats.total_distance_km ?? 0;
  const displayDistance =
    totalDistance >= 1000
      ? `${(totalDistance / 1000).toFixed(1)} km`
      : `${totalDistance.toFixed(1)} km`;

  const [distVal, distUnit] = displayDistance.split(' ');

  return (
    <View style={styles.row}>
      {/* Total Distance */}
      <View style={styles.card}>
        <Text style={styles.label}>TOTAL JARAK</Text>
        <Text style={styles.value}>
          {distVal}
          <Text style={styles.unit}> {distUnit}</Text>
        </Text>
      </View>

      {/* Total Runs */}
      <View style={styles.card}>
        <Text style={styles.label}>TOTAL LARI</Text>
        <Text style={styles.value}>{stats.completed_runs ?? 0}</Text>
      </View>
    </View>
  );
};

export default StatsCard;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: 28,
    marginBottom: 8,
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingVertical: 16,
    alignItems: 'center',
   
  },
  label: {
    fontSize: 10,
    color: '#999', fontFamily: 'Lexend-Bold',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '700', fontFamily: 'Lexend-Bold',
    color: '#1A1A1A',
  },
  unit: {
    fontSize: 14,
    fontWeight: '500', fontFamily: 'Lexend-Regular',
    color: '#555',
  },
});