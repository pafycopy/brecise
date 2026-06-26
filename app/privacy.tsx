import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const DATA_COLLECTED = [
  'Nama pengguna',
  'Alamat email',
  'Umur, jenis kelamin',
  'Tinggi badan, berat badan',
  'Data aktivitas dan progres latihan',
];

const PURPOSES = [
  'Membuat dan menyesuaikan program latihan',
  'Menampilkan progres latihan pengguna',
  'Mengirimkan pengingat jadwal latihan',
  'Meningkatkan kualitas layanan aplikasi',
];

const RIGHTS = [
  'Melihat data yang tersimpan',
  'Memperbarui data pribadi',
  'Menghapus program latihan kapan saja',
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kebijakan Privasi</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.Title}>Kebijakan Privacy Brecise</Text>

        <Text style={styles.lastUpdated}>Terakhir diperbarui: 17 Juni 2026</Text>

        <Text style={styles.intro}>
          BRECISE menghargai privasi pengguna dan berkomitmen untuk melindungi data pribadi yang diberikan selama menggunakan aplikasi.
        </Text>

        {/* 1. Data Dikumpulkan */}
        <Text style={styles.sectionTitle}>1. Data yang Dikumpulkan</Text>
        <View style={styles.list}>
          {DATA_COLLECTED.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.dot} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* 2. Tujuan Penggunaan Data */}
        <Text style={styles.sectionTitle}>2. Tujuan Penggunaan Data</Text>
        <View style={styles.list}>
          {PURPOSES.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.dot} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* 3. Penyimpanan Data */}
        <Text style={styles.sectionTitle}>3. Penyimpanan Data</Text>
        <Text style={styles.paragraph}>
          Data pengguna disimpan secara aman menggunakan layanan penyimpanan cloud berbasis Supabase dengan sistem keamanan terenkripsi.
        </Text>

        {/* 4. Kerahasiaan Data */}
        <Text style={styles.sectionTitle}>4. Kerahasiaan Data</Text>
        <Text style={styles.paragraph}>
          BRECISE tidak menjual, menyewakan, atau membagikan data pribadi pengguna kepada pihak lain tanpa persetujuan pengguna, kecuali diwajibkan oleh hukum.
        </Text>

        {/* 5. Hak Pengguna */}
        <Text style={styles.sectionTitle}>5. Hak Pengguna</Text>
        <View style={styles.list}>
          {RIGHTS.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.dot} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* 6. Perubahan Kebijakan */}
        <Text style={styles.sectionTitle}>6. Perubahan Kebijakan</Text>
        <Text style={styles.paragraph}>
          Kebijakan privasi ini dapat diperbarui sewaktu-waktu untuk menyesuaikan dengan pengembangan aplikasi. Perubahan akan diinformasikan melalui pembaruan pada aplikasi.
        </Text>

        {/* 7. Kontak */}
        <View style={styles.contactBox}>
          <View style={styles.contactHeader}>
            <Ionicons name="mail" size={16} color="#2E7D32" />
            <Text style={styles.contactTitle}>7. Kontak</Text>
          </View>
          <Text style={styles.contactText}>
            Apabila terdapat pertanyaan mengenai kebijakan privasi ini, pengguna dapat menghubungi pengembang melalui alamat email yang tersedia:
          </Text>
          <Text style={styles.contactEmail}>breciseapp.@gmail.com</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 0,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 32, height: 32, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  Title: { fontSize: 24, fontWeight: '700', color: '#111' },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  lastUpdated: { fontSize: 12, color: '#999', marginBottom: 12 },
  intro: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 24 },

  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: '#111',
    marginBottom: 10, marginTop: 4,
  },
  paragraph: {
    fontSize: 14, color: '#555', lineHeight: 21, marginBottom: 22,
  },

  list: { gap: 8, marginBottom: 22 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#2E7D32', marginTop: 7,
  },
  listText: { fontSize: 14, color: '#333', lineHeight: 20, flex: 1 },

  contactBox: {
    backgroundColor: '#F0FFF4', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#CDE9D2',
    marginTop: 8,
  },
  contactHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  contactTitle: { fontSize: 14, fontWeight: '800', color: '#111' },
  contactText: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 8 },
  contactEmail: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
});