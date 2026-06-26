import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  title: string;
  subtitle?: string;
  description: string;
  gif?: string;
  onPressVideo?: () => void;
};

export default function WarmupCard({
  title,
  subtitle,
  description,
  gif,
  onPressVideo,
}: Props) {
  return (
    <View style={styles.card}>

      {/* GIF Display */}
      {gif ? (
        <View style={styles.gifContainer}>
          <Image source={{ uri: gif }} style={styles.gifImage} resizeMode="cover" />
        </View>
      ) : null}

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Subtitle — "Mengapa Hal Ini Penting:" */}
      {subtitle ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : null}

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gifContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F4F4F4',
    marginBottom: 16,
    overflow: 'hidden',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
    marginBottom: 16,
  },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 8,
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  videoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
});