import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const FEATURES = [
  'Program latihan lari otomatis untuk pelari pemula.',
  'Panduan latihan kekuatan (strength training).',
  'Panduan pemanasan dan pendinginan untuk pelari.',
  'Pencatatan progres latihan.',
  'Pengingat jadwal latihan.',
  'Laporan perkembangan mingguan.',
];

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tentang BRECISE</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Image
              source={require('@/assets/images/breciselogo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Version */}
        <Text style={styles.sectionTitleCenter}>BRECISE</Text>
        <Text style={styles.versionText}>Versi: 1.0.0</Text>

        {/* Description */}
        <Text style={styles.paragraph}>
          BRECISE (Breathing Exercise) adalah aplikasi kebugaran yang dirancang untuk membantu pelari pemula memulai dan menjalankan program latihan lari secara terstruktur. Aplikasi ini menyediakan program latihan yang disusun berdasarkan prinsip-prinsip latihan lari pemula serta dilengkapi dengan panduan latihan pendukung untuk membantu pengguna membangun kebiasaan berolahraga secara bertahap dan aman.
        </Text>

        {/* Fitur Utama */}
        <Text style={styles.sectionHeading}>Fitur Utama</Text>
        <View style={styles.list}>
          {FEATURES.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.dot} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Tujuan Aplikasi */}
        <Text style={styles.sectionHeading}>Tujuan Aplikasi</Text>
        <Text style={styles.paragraph}>
          BRECISE bertujuan membantu pengguna meningkatkan konsistensi latihan, membangun kebugaran dasar, dan mengurangi risiko cedera melalui program latihan yang terstruktur.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 0,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 32, height: 32, alignItems: 'flex-start', justifyContent: 'flex-start' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },

  content: { paddingHorizontal: 24, paddingTop: 24 },

  logoSection: { alignItems: 'center', marginBottom: 16, gap: 10 },
  logoBox: {
    width: 96, height: 96, borderRadius: 8,
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  logoImage: {
    width: 64, height: 64,
  },
  appName: { fontSize: 16, fontWeight: '800', color: '#111' },

  sectionTitleCenter: {
    fontSize: 18, fontWeight: '800', color: '#111',
    textAlign: 'center', marginTop: 8,
  },
  versionText: {
    fontSize: 13, color: '#999',
    textAlign: 'center', marginTop: 2, marginBottom: 20,
  },

  paragraph: {
    fontSize: 14, color: '#555', lineHeight: 22,
    marginBottom: 24, textAlign: 'left',
  },

  sectionHeading: {
    fontSize: 15, fontWeight: '800', color: '#111',
    marginBottom: 12,
  },

  list: { gap: 10, marginBottom: 24 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#2E7D32', marginTop: 7,
  },
  listText: { fontSize: 14, color: '#333', lineHeight: 21, flex: 1 },
});