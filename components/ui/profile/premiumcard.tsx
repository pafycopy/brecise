import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PremiumCard = () => {
  return (
    <View style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.joinText}>Join</Text>
        <Text style={styles.title}>Easy Stride Premium</Text>
        <Text style={styles.subtitle}>
          Akses rencana latihan terstruktur{'\n'}dan latihan yang dipandu.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} activeOpacity={0.8}>
        <Text style={styles.buttonText}>SUBSCRIBE</Text>
      </TouchableOpacity>

      {/* dekorasi lingkaran sudut kanan atas */}
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
  textBlock: {
    marginBottom: 16,
  },
  joinText: {
    fontSize: 12,
    color: '#A5D6A7',
    marginBottom: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#A5D6A7',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
  circle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -30,
    right: -20,
  },
  circle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: 20,
    right: 60,
  },
});