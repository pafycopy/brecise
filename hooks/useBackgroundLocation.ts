import { useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import {
  BACKGROUND_LOCATION_TASK,
  addLocationListener,
} from '@/services/backgroundLocationTask';

export type PermissionResult = {
  granted: boolean;        // izin foreground minimal didapat
  backgroundGranted: boolean; // izin background didapat (tracking lanjut walau layar mati)
};

/**
 * Hook untuk tracking lokasi yang tetap jalan walau layar HP mati / app
 * di-minimize. Menggantikan Location.watchPositionAsync yang cuma jalan
 * saat app di foreground.
 *
 * Pemakaian sama seperti sebelumnya: kasih callback onLocation, lalu panggil
 * start()/stop() menggantikan startLocationWatch()/subscription.remove().
 */
export function useBackgroundLocation(onLocation: (loc: Location.LocationObject) => void) {
  const removeListenerRef = useRef<(() => void) | null>(null);
  const onLocationRef = useRef(onLocation);
  onLocationRef.current = onLocation;

  const requestPermissions = useCallback(async (): Promise<PermissionResult> => {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      return { granted: false, backgroundGranted: false };
    }
    const bg = await Location.requestBackgroundPermissionsAsync();
    return { granted: true, backgroundGranted: bg.status === 'granted' };
  }, []);

  const start = useCallback(async () => {
    // Listener dipasang dulu supaya tidak kelewat update pertama.
    removeListenerRef.current?.();
    removeListenerRef.current = addLocationListener((loc) => onLocationRef.current(loc));

    const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK,
    ).catch(() => false);
    if (alreadyRunning) return;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000,
      distanceInterval: 2,
      // Android: wajib ada foreground service supaya OS tidak mematikan
      // tracking saat app di-background — muncul sebagai notifikasi persisten
      // selama lari berlangsung.
      foregroundService: {
        notificationTitle: 'Brecise sedang melacak larimu',
        notificationBody: 'Ketuk untuk kembali ke aplikasi',
        notificationColor: '#5BFF7A',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true, // iOS: indikator biru di status bar
    });
  }, []);

  const stop = useCallback(async () => {
    removeListenerRef.current?.();
    removeListenerRef.current = null;
    const isRunning = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK,
    ).catch(() => false);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  }, []);

  return { requestPermissions, start, stop };
}