import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  title: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  exercise?: string;
  thumbnail?: string;  // ← tambah agar tidak error
  icon?: string;
  iconColor?: string;
  onPress?: () => void;
};

export default function ExerciseCard({
  title, subtitle, description,
  duration, exercise,
  icon, iconColor,
  onPress,
}: Props) {
  return (
    <View style={styles.card}>

      {/* TOP */}
      <View style={styles.topContainer}>
        {icon && (
          <View style={[styles.iconWrapper, { backgroundColor: iconColor || '#F3F3F3' }]}>
            <Ionicons name={icon as any} size={22} color="#111" />
          </View>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {/* DESCRIPTION */}
      {description ? <Text style={styles.description}>{description}</Text> : null}

      {/* BADGES */}
      <View style={styles.bottomRow}>
        {exercise && (
          <View style={styles.infoBadge}>
            <Ionicons name="barbell-outline" size={14} color="#555" />
            <Text style={styles.infoText}>{exercise}</Text>
          </View>
        )}
        {duration && (
          <View style={styles.infoBadge}>
            <Ionicons name="time-outline" size={14} color="#555" />
            <Text style={styles.infoText}>{duration}</Text>
          </View>
        )}
      </View>

      {/* FOOTER — clickable */}
      <TouchableOpacity style={styles.footer} onPress={onPress} activeOpacity={0.75}>
        <Text style={styles.footerText}>{exercise ?? 'Lihat Exercise'}</Text>
        <Ionicons name="chevron-forward" size={20} color="#111" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  topContainer: { flexDirection: 'column', alignItems: 'flex-start' },
  iconWrapper: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  titleContainer: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#111' },
  subtitle: { marginTop: 4, fontSize: 13, color: '#777' },
  description: { marginTop: 16, fontSize: 14, lineHeight: 22, color: '#666' },
  bottomRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  infoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F3F3F3', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  infoText: { fontSize: 12, fontWeight: '600', color: '#555' },
  footer: {
    marginTop: 18, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: '#EAEAEA',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  footerText: { fontSize: 14, fontWeight: '700', color: '#111' },
});