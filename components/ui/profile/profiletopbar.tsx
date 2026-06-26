import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';

export default function ProfileTopBar() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Anda</Text>

      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => router.push('/settings' as any)}
        activeOpacity={0.7}
      >
        <Image
          source={require('@/assets/images/setting.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#Fff',
    borderRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#Fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 26,
    height: 26,
  },
});