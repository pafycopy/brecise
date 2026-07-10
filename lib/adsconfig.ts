// lib/adsConfig.ts
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

// EXPO_PUBLIC_ADS_TEST_MODE=true di-set khusus di profile "preview" (eas.json).
// __DEV__ otomatis true kalau dijalankan via dev client / expo run:android.
const isTestBuild = process.env.EXPO_PUBLIC_ADS_TEST_MODE === 'true';

// ✅ Override manual: set EXPO_PUBLIC_ADS_FORCE_REAL=true pas jalanin
// `expo run:android` kalau mau lihat iklan ASLI walau ini dev build.
// Pemakaian (PowerShell):
//   $env:EXPO_PUBLIC_ADS_FORCE_REAL="true"; npx expo run:android
// Biar balik ke test ads lagi, tinggal jalanin `npx expo run:android` biasa
// tanpa env var itu (atau restart terminal baru).
const forceReal = process.env.EXPO_PUBLIC_ADS_FORCE_REAL === 'true';

export const isDevOrPreview = (__DEV__ || isTestBuild) && !forceReal;

// 🔴 Tambahkan device ID lain di sini kalau testing di HP lain
const TEST_DEVICE_IDS = [
  '00FB0644AB9F4329DBBC90966C37DA65',
  '7FAB24ADAB6F889C69C04ADCA1A3264C',
];

export async function configureAds() {
  if (isExpoGo) return;

  const ads = require('react-native-google-mobile-ads');
  const mobileAds = ads.default;

  // Device cuma didaftarin sebagai test device kalau BUKAN mode force-real.
  // ⚠️ Kalau forceReal aktif dan iklan asli muncul: LIHAT saja, JANGAN diklik.
  await mobileAds().setRequestConfiguration({
    testDeviceIdentifiers: isDevOrPreview ? TEST_DEVICE_IDS : [],
  });

  const statuses = await mobileAds().initialize();
  console.log(
    '✅ AdMob SDK initialized:',
    JSON.stringify(statuses),
    '| test device mode:', isDevOrPreview,
    forceReal ? '| ⚠️ FORCE REAL ADS AKTIF' : ''
  );
  return statuses;
}