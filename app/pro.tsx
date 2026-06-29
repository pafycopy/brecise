import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProStore } from '@/store/proStore';
import {
  initIAP, closeIAP, getProProduct,
  purchasePro, restorePurchases,
  setupPurchaseListeners,
} from '@/lib/proService';
import type { ProductAndroid } from 'react-native-iap';

const FEATURES = [
  { icon: 'calendar-outline',  label: 'Pengalaman aplikasi lebih bersih dan cepat' },
  { icon: 'ban-outline',       label: 'Tanpa iklan selamanya' },
  { icon: 'heart-outline', label: 'Mendukung perkembangan Brecise' },
  { icon: 'infinite-outline',  label: 'Bayar sekali, nikmati selamanya' },
];

export default function ProScreen() {
  const router = useRouter();
  const isPro = useProStore((s) => s.isPro);

  const [product, setProduct] = useState<ProductAndroid | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingBuy, setLoadingBuy] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const setup = async () => {
      const connected = await initIAP();
      if (!connected) { setLoadingProduct(false); return; }
      cleanup = setupPurchaseListeners();
      const p = await getProProduct();
      setProduct(p);
      setLoadingProduct(false);
    };
    setup();
    return () => { cleanup?.(); closeIAP(); };
  }, []);

  const handleBuy = async () => {
    setLoadingBuy(true);
    const result = await purchasePro();
    setLoadingBuy(false);
    if (!result.success && result.error !== 'cancelled') {
      Alert.alert('Pembelian gagal', result.error ?? 'Coba lagi nanti.');
    }
  };

  const handleRestore = async () => {
    setLoadingRestore(true);
    const result = await restorePurchases();
    setLoadingRestore(false);
    if (!result.success) {
      Alert.alert('Gagal', 'Tidak dapat memulihkan pembelian. Coba lagi nanti.');
      return;
    }
    if (result.restored) {
      Alert.alert('Berhasil! 🎉', 'Pembelian Pro kamu berhasil dipulihkan.');
    } else {
      Alert.alert('Tidak ditemukan', 'Tidak ada pembelian Pro yang bisa dipulihkan.');
    }
  };

  // ── Sudah Pro ─────────────────────────────────────────────────────────────
  if (isPro) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <View style={styles.alreadyProContainer}>
          <View style={styles.badgeIcon}>
            <Ionicons name="star" size={28} color="#fff" />
          </View>
          <Text style={styles.alreadyProTitle}>Kamu sudah Pro! 🎉</Text>
          <Text style={styles.alreadyProSub}>
            Nikmati Brecise tanpa iklan selamanya.{'\n'}Terima kasih sudah mendukung kami!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Belum Pro ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>

        {/* Badge icon — seperti di referensi */}
        <View style={styles.heroIconWrap}>
          <View style={styles.badgeIcon}>
            <Ionicons name="star" size={28} color="#fff" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.heroTitle}>Brecise{'\n'}Pro</Text>
        <Text style={styles.heroSub}>Satu kali bayar, tanpa iklan selamanya.</Text>

        {/* Feature list — clean tanpa box */}
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Ionicons name={f.icon as any} size={18} color="#1B2E1F" />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Dark payment card */}
        <View style={styles.payCard}>
          <Text style={styles.payCardTitle}>Beli Sekarang</Text>
          <Text style={styles.payCardSub}>
            Akses penuh tanpa iklan{'\n'}dengan satu kali pembayaran.
          </Text>

          {/* Price row */}
          <View style={styles.priceRow}>
            <View style={styles.priceLeft}>
              <View style={styles.priceCheck}>
                <Ionicons name="checkmark" size={14} color="#6BFF8F" />
              </View>
              <View>
                <Text style={styles.priceName}>Lifetime</Text>
                {loadingProduct ? (
                  <ActivityIndicator color="#6BFF8F" size="small" style={{ marginTop: 2 }} />
                ) : (
                  <Text style={styles.priceAmount}>
                    {product ? `${product.displayPrice} / Selamanya` : 'Tidak tersedia'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Buy button */}
          <TouchableOpacity
            style={[styles.btnBuy, (!product || loadingBuy) && styles.btnDisabled]}
            onPress={handleBuy}
            disabled={!product || loadingBuy}
            activeOpacity={0.85}
          >
            {loadingBuy
              ? <ActivityIndicator color="#111" />
              : <Text style={styles.btnBuyText}>Beli Sekarang</Text>
            }
          </TouchableOpacity>

          {/* Restore */}
          <TouchableOpacity
            style={styles.btnRestore}
            onPress={handleRestore}
            disabled={loadingRestore}
          >
            {loadingRestore
              ? <ActivityIndicator color="#888" size="small" />
              : <Text style={styles.btnRestoreText}>Pulihkan Pembelian</Text>
            }
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Pembayaran diproses melalui Google Play.{'\n'}Tidak ada biaya berulang.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 },

  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EFEFEF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },

  // ── Badge icon ──
  heroIconWrap: { alignItems: 'center', marginBottom: 20 },
  badgeIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#1B2E1F',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Hero text ──
  heroTitle: {
    fontSize: 40, fontWeight: '800', color: '#111',
    lineHeight: 46, marginBottom: 10, textAlign: 'center',
  },
  heroSub: {
    fontSize: 14, color: '#888',
    textAlign: 'center', marginBottom: 36, lineHeight: 20,
  },

  // ── Feature list ──
  featureList: { gap: 20, marginBottom: 36 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  featureIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  featureLabel: {
    fontSize: 14, color: '#333',
    fontWeight: '500', flex: 1, lineHeight: 20,
  },

  // ── Dark payment card ──
  payCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
  },
  payCardTitle: {
    fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 6,
  },
  payCardSub: {
    fontSize: 13, color: '#888', lineHeight: 19, marginBottom: 20,
  },

  // Price row
  priceRow: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14, padding: 16,
    marginBottom: 20,
    borderWidth: 1.5, borderColor: '#2E2E2E',
  },
  priceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceCheck: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#1B2E1F',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#6BFF8F',
  },
  priceName: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  priceAmount: { fontSize: 13, color: '#6BFF8F', fontWeight: '600' },

  // Buttons
  btnBuy: {
    backgroundColor: '#6BFF8F', borderRadius: 40,
    height: 54, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.4 },
  btnBuyText: { fontSize: 15, fontWeight: '800', color: '#111' },

  btnRestore: {
    height: 48, alignItems: 'center', justifyContent: 'center',
    borderRadius: 40, borderWidth: 1, borderColor: '#2E2E2E',
    marginBottom: 16,
  },
  btnRestoreText: { fontSize: 13, color: '#888', fontWeight: '600' },

  disclaimer: {
    fontSize: 11, color: '#444', textAlign: 'center', lineHeight: 16,
  },

  // ── Already Pro ──
  alreadyProContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  alreadyProTitle: { fontSize: 24, fontWeight: '800', color: '#111', textAlign: 'center', fontFamily: 'Lexend-Black' },
  alreadyProSub: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, fontFamily: 'Lexend-Regular' },
});