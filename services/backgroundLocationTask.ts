import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

// Nama task HARUS unik & konsisten — dipakai untuk start/stop/cek status.
export const BACKGROUND_LOCATION_TASK = 'brecise-background-location';

type LocationListener = (location: Location.LocationObject) => void;

// Listener disimpan di module scope (bukan React state) supaya tracker mana
// pun yang sedang mount bisa "berlangganan" update lokasi dari task native,
// walau task ini jalan independen dari lifecycle komponen.
const listeners = new Set<LocationListener>();

export const addLocationListener = (listener: LocationListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// ✅ PENTING: defineTask harus dipanggil di top-level module ini (bukan di
// dalam komponen/hook), dan file ini harus di-import sekali di entry point
// app (misal app/_layout.tsx) SEBELUM komponen lain render. Ini supaya kalau
// OS "membangunkan" app dari background khusus untuk deliver location update,
// task-nya sudah terdaftar dan tidak hilang.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocationTask] error:', error.message);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    locations.forEach((loc) => listeners.forEach((listener) => listener(loc)));
  }
});