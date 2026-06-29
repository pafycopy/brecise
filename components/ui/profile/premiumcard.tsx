import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProStore } from '@/store/proStore';

const PremiumCard = () => {
  const router = useRouter();
  const isPro = useProStore((s) => s.isPro);

  // ── Sudah Pro: card tidak ditampilkan ─────────────────────────────────────
  if (isPro) return null;

  // ── Belum Pro ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.joinText}>Upgrade</Text>
        <Text style={styles.title}>Brecise Pro</Text>
        <Text style={styles.subtitle}>
          Bayar sekali, hilangkan iklan{'\n'}selamanya. Tanpa langganan.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={() => router.push('/pro' as any)}
      >
        <Ionicons name="flash" size={14} color="#111" style={{ marginRight: 6 }} />
        <Text style={styles.buttonText}>BELI SEKARANG</Text>
      </TouchableOpacity>

      <View style={styles.circle1} pointerEvents="none" />
      <View style={styles.circle2} pointerEvents="none" />
    </View>
  );
};

export default PremiumCard;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#1B2E1F',
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
  },
  textBlock: { marginBottom: 16 },
  joinText: { fontSize: 12, color: '#A5D6A7', marginBottom: 2, fontFamily: 'Lexend-Regular' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 6, fontFamily: 'Lexend-Bold' },
  subtitle: { fontSize: 12, color: '#A5D6A7', lineHeight: 18, fontFamily: 'Lexend-Regular' },
  button: {
    backgroundColor: '#6BFF8F',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: { color: '#111', fontWeight: '800', fontSize: 14, letterSpacing: 1, fontFamily: 'Lexend-Black' },
  circle1: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -30, right: -20,
  },
  circle2: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)', top: 20, right: 60,
  },
});