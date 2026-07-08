// services/interstitialAdService.ts
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

let InterstitialAd: any, AdEventType: any, TestIds: any;
if (!isExpoGo) {
  const ads = require('react-native-google-mobile-ads');
  InterstitialAd = ads.InterstitialAd;
  AdEventType = ads.AdEventType;
  TestIds = ads.TestIds;
}

const PROD_INTERSTITIAL_ID = 'ca-app-pub-6314173942507588/1903282176';

// EXPO_PUBLIC_ADS_TEST_MODE=true di eas.json profile preview
// bikin build preview tetap pakai test ads walau __DEV__ = false (release mode)
const isTestBuild = process.env.EXPO_PUBLIC_ADS_TEST_MODE === 'true';
const adUnitId = (__DEV__ || isTestBuild) ? TestIds?.INTERSTITIAL : PROD_INTERSTITIAL_ID;

let interstitial: any = null;
let isLoaded = false;

function createAndLoadAd() {
  if (isExpoGo || !InterstitialAd) return;

  interstitial = InterstitialAd.createForAdRequest(adUnitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    console.log('✅ Interstitial ad loaded');
    isLoaded = true;
  });

  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    isLoaded = false;
    createAndLoadAd(); // preload berikutnya
  });

  interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
    console.log('❌ Interstitial ad error:', JSON.stringify(error));
    isLoaded = false;
  });

  interstitial.load();
}

/** Panggil sekali di root layout saat app start */
export function initInterstitialAd() {
  if (isExpoGo) return;
  createAndLoadAd();
}

/** Panggil di titik "latihan selesai". Return true kalau berhasil ditampilkan. */
export function showInterstitialAd(): boolean {
  if (isExpoGo || !interstitial) return false;

  if (isLoaded) {
    interstitial.show();
    return true;
  }
  console.log('⚠️ Interstitial belum siap, skip.');
  return false;
}