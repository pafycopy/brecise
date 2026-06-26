import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUserStore } from '@/store/userStore';

const ProfileHeader = () => {
  const { name, location, avatarUri } = useUserStore();

  return (
    <View style={styles.outerContainer}>
      {/* Card pembungkus */}
      <View style={styles.card}>
        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => router.push('/editprofile' as any)}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: avatarUri ?? 'https://www.gravatar.com/avatar/?d=mp&s=200' }}
            style={styles.avatar}
          />
          <View style={styles.editBadge}>
            <Ionicons name="pencil" size={10} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Nama */}
        <Text style={styles.name}>{name}</Text>

        {/* Lokasi */}
        <TouchableOpacity
          style={styles.locationRow}
          onPress={() => router.push('/editprofile' as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="location-sharp" size={13} color="#888" />
          <Text style={styles.location}>{location}</Text>
          <Ionicons name="chevron-forward" size={12} color="#bbb" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileHeader;

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#F0F0F0',
    backgroundColor: '#F5F5F5',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#2E7D32',
    borderRadius: 11,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 13,
    color: '#888',
  },
});