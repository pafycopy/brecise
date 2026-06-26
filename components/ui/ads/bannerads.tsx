// BannerAdComponent.tsx
import React from 'react';
import { View } from 'react-native';
import Constants from 'expo-constants';

// Hanya load AdMob kalau bukan Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

let BannerAd: any, BannerAdSize: any, TestIds: any;
if (!isExpoGo) {
  const ads = require('react-native-google-mobile-ads');
  BannerAd = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
}

const PROD_AD_UNIT_ID = 'ca-app-pub-4673696615107294/8587040791';
const adUnitId = __DEV__ ? TestIds?.ADAPTIVE_BANNER : PROD_AD_UNIT_ID;

const BannerAdComponent = () => {
  if (isExpoGo || !BannerAd) return null; // skip di Expo Go

  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
};

export default BannerAdComponent;