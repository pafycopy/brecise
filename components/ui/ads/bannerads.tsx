// components/ui/ads/bannerads.tsx
import React, { useState, useRef, useCallback } from 'react';
import { View } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

let BannerAd: any, BannerAdSize: any, TestIds: any;
if (!isExpoGo) {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
}

const PROD_AD_UNIT_ID = 'ca-app-pub-6314173942507588/1634442028';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 30000; // 30 detik, naik tiap retry

// EXPO_PUBLIC_ADS_TEST_MODE=true di eas.json profile preview
// bikin build preview tetap pakai test ads walau __DEV__ = false (release mode)
const isTestBuild = process.env.EXPO_PUBLIC_ADS_TEST_MODE === 'true';

// Override manual: set EXPO_PUBLIC_ADS_FORCE_REAL=true pas expo run:android
// kalau mau lihat iklan ASLI walau ini dev build.
const forceReal = process.env.EXPO_PUBLIC_ADS_FORCE_REAL === 'true';
const useTestAds = (__DEV__ || isTestBuild) && !forceReal;

const BannerAdComponent = () => {
  const [retryKey, setRetryKey] = useState(0); // buat force re-mount BannerAd
  const [hidden, setHidden] = useState(false);
  // ✅ FIX: sebelumnya container banner selalu reserve ruang (bikin kotak
  // putih blank kelihatan) dari awal mount, padahal ad-nya baru beneran
  // tampil setelah onAdLoaded jalan (butuh waktu, kadang beberapa detik).
  // Sekarang container di-collapse (height 0) sampai ad BENERAN loaded,
  // baru container di-expand ke ukuran normal.
  const [loaded, setLoaded] = useState(false);
  const retryCount = useRef(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFailedToLoad = useCallback((error: any) => {
    console.log('❌ Banner ad failed to load:', JSON.stringify(error));
    setLoaded(false);

    if (retryCount.current < MAX_RETRIES) {
      retryCount.current += 1;
      const delay = RETRY_DELAY_MS * retryCount.current; // 30s, 60s, 90s
      console.log(`🔄 Retry banner #${retryCount.current} dalam ${delay / 1000}s`);
      retryTimeout.current = setTimeout(() => {
        setRetryKey((k) => k + 1); // remount BannerAd, trigger request baru
      }, delay);
    } else {
      // Udah nyerah retry, sembunyiin space banner biar UI nggak nyisain celah kosong
      console.log('⚠️ Banner nyerah setelah', MAX_RETRIES, 'kali retry');
      setHidden(true);
    }
  }, []);

  const handleAdLoaded = useCallback(() => {
    console.log('✅ Banner ad loaded', useTestAds ? '(test ad)' : '(⚠️ IKLAN ASLI — jangan diklik)');
    retryCount.current = 0; // reset counter kalau sukses
    setLoaded(true); // baru expand container sekarang
  }, []);

  React.useEffect(() => {
    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, []);

  if (isExpoGo || !BannerAd || hidden) return null;

  const adUnitId = useTestAds ? TestIds.ADAPTIVE_BANNER : PROD_AD_UNIT_ID;

  return (
    <View
      style={{
        alignItems: 'center',
        height: loaded ? undefined : 0,
        overflow: 'hidden',
      }}
    >
      <BannerAd
        key={retryKey} // ganti key = React remount komponen = request baru
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleFailedToLoad}
      />
    </View>
  );
};

export default BannerAdComponent;