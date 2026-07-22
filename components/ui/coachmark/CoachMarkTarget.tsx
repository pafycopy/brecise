import React, { useEffect, useRef } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { useCoachMark } from './CoachMarkProvider';

type Props = {
  id: string;
  children: React.ReactNode;
};

// Bungkus elemen UI apapun yang mau dijadikan target coach mark, contoh:
// <CoachMarkTarget id="home-streak"><StreakCard /></CoachMarkTarget>
// id ini HARUS sama persis dengan CoachMarkStep.id di config tour.
export default function CoachMarkTarget({ id, children }: Props) {
  const { registerTarget, unregisterTarget, notifyLayout } = useCoachMark();
  const viewRef = useRef<View>(null);

  useEffect(() => {
    registerTarget(id, viewRef);
    return () => unregisterTarget(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ FIX: setiap kali ukuran/posisi elemen ini berubah (data baru selesai
  // di-fetch, font selesai load, gambar selesai decode, dll), lapor ke
  // provider. Kalau elemen ini sedang jadi target step yang aktif, provider
  // otomatis ngukur ulang & majuin kotak highlight ke posisi final yang
  // benar — jadi gak lagi bergantung ke tebakan waktu.
  const handleLayout = (_e: LayoutChangeEvent) => {
    notifyLayout(id);
  };

  return (
    <View ref={viewRef} collapsable={false} onLayout={handleLayout}>
      {children}
    </View>
  );
}