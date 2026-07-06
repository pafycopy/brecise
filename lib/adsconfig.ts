// lib/adsConfig.ts
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

// 🔴 Tambahkan device ID lain di sini kalau testing di HP lain
const TEST_DEVICE_IDS = ['00FB0644AB9F4329DBBC90966C37DA65'];

export async function configureAds() {
  if (isExpoGo) return;

  const ads = require('react-native-google-mobile-ads');
  const mobileAds = ads.default;

  await mobileAds().setRequestConfiguration({
    testDeviceIdentifiers: TEST_DEVICE_IDS,
  });

  const statuses = await mobileAds().initialize();
  console.log('✅ AdMob SDK initialized:', JSON.stringify(statuses));
  return statuses;
}