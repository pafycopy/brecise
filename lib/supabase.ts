import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { AppState } from 'react-native';
import { router } from 'expo-router';

const SUPABASE_URL      = 'https://edbesyritkmfadbstswd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkYmVzeXJpdGttZmFkYnN0c3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTY2NDEsImV4cCI6MjA5NTI3MjY0MX0.Gy-tBr87oRzx1kDnQkRsNSg1C76vpkR2n4YnIe-iWjs';

WebBrowser.maybeCompleteAuthSession();

const ExpoSecureStoreAdapter = {
  getItem:    (key: string) => SecureStore.getItemAsync(key),
  setItem:    (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:            ExpoSecureStoreAdapter,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
    flowType:           'implicit',
  },
});

// ── Auto refresh token saat app kembali ke foreground ────────────────────────
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// ── Handler: refresh token invalid → sign out & redirect ke login ─────────────
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    // Token berhasil diperbarui, tidak perlu apa-apa
    return;
  }

  if (event === 'SIGNED_OUT') {
    // Session habis atau di-revoke → ke halaman login
    try {
      router.replace('/auth');
    } catch (_) {
      // router belum siap saat app baru launch, abaikan
    }
    return;
  }
});

// ── Helper: cek & bersihkan session invalid saat app launch ──────────────────
// Dipanggil dari _layout.tsx sebelum cek session
export async function clearInvalidSession(): Promise<void> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      const isInvalidToken =
        msg.includes('refresh token not found') ||
        msg.includes('invalid refresh token') ||
        msg.includes('token expired');

      if (isInvalidToken) {
        // Hapus session rusak dari SecureStore
        await supabase.auth.signOut({ scope: 'local' });
      }
    }
  } catch (_) {
    // Abaikan error di sini, biarkan _layout handle redirect
  }
}