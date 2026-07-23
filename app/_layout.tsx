import '@/services/backgroundLocationTask';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { supabase, clearInvalidSession } from '@/lib/supabase';
import AssessmentFlow from '@/components/ui/assessment/assessmentflow';
import { useAssessmentStore } from '@/store/assessmentStore';
import { useUserStore } from '@/store/userStore';
import { setupPurchaseListeners, initIAP, closeIAP, checkProStatus, restorePurchases } from '@/lib/proService';
import { useNotificationStore } from '@/store/notificationStore';
import { useWorkoutStore } from '@/store/supabaseWorkoutStore';
import { useProStore } from '@/store/proStore';
import { scheduleWeeklyReport } from '@/lib/notifications';
import { configureAds } from '@/lib/adsconfig';
import { initInterstitialAd } from '@/services/interstitialAdService';
// ✅ NEW: engine coach mark / spotlight tutorial
import { CoachMarkProvider } from '@/components/ui/coachmark/CoachMarkProvider';

SplashScreen.preventAutoHideAsync();

// ── Helper: reset semua Zustand store yang nyimpen data per-akun ────────────
const resetAllUserStores = () => {
  useWorkoutStore.getState().resetStore();
  useProStore.getState().resetStore();
  useAssessmentStore.getState().resetStore();
  // userStore (nama, lokasi, avatar, dll) juga direset — sebelumnya store
  // ini tidak pernah di-reset di sini, itu penyebab nama & data profil
  // "nyangkut" ke akun baru.
  useUserStore.getState().resetStore();
};

// ── Helper: load data akun (dipanggil tiap ada session baru / berbeda) ──────
const loadUserData = () => {
  checkProStatus();
  useWorkoutStore.getState().fetchWorkouts();
  useAssessmentStore.getState().syncFromSupabase();
  // userStore juga di-sync ulang tiap ada session baru (login, ganti akun,
  // token refresh, resume app), bukan cuma pas tombol login di AuthScreen.
  useUserStore.getState().syncFromSupabase();
  // FIX: restorePurchases() di IAP setup effect bisa race dan jalan
  // SEBELUM session Supabase ready (dua useEffect independen, gak ada
  // jaminan urutan). Kalau itu kejadian, saveProToSupabase() di dalamnya
  // gagal diam-diam karena belum ada user login. Panggil lagi di sini,
  // karena loadUserData() cuma jalan pas session SUDAH pasti ada.
  restorePurchases().catch(() => {});
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<any>(undefined);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { isCompleted, hasSynced } = useAssessmentStore();
  const [showAssessment, setShowAssessment] = useState(false);
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Lexend-Bold': require('../assets/font/static/Lexend-Bold.ttf'),
    'Lexend-Regular': require('../assets/font/static/Lexend-Regular.ttf'),
    'Lexend-Black': require('../assets/font/static/Lexend-Black.ttf'),
  });

  // ── IAP setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cleanupListeners: (() => void) | undefined;

    const setupIAP = async () => {
      const connected = await initIAP();
      if (connected) {
        cleanupListeners = setupPurchaseListeners();
        // Jaring pengaman — kalau dulu ada pembelian yang gagal ke-sync ke
        // Supabase (misal koneksi putus pas itu), restore otomatis ini
        // bakal nangkep & benerin status Pro di background secara silent,
        // tanpa user perlu sadar ada masalah atau klik tombol manual.
        restorePurchases().catch(() => {});
      }
    };

    setupIAP();

    return () => {
      cleanupListeners?.();
      closeIAP();
    };
  }, []);

  // ✨ ADS: init AdMob SDK + preload interstitial, sekali saat app start
  useEffect(() => {
    configureAds().then(() => initInterstitialAd());
  }, []);

  // ── Session ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let lastUserId: string | null = null;

    const initSession = async () => {
      await clearInvalidSession();
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setIsAuthLoading(false);

      if (data.session) {
        lastUserId = data.session.user.id;
        loadUserData();
      }
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
        return;
      }

      if (_event === 'SIGNED_IN' && isResettingPassword) {
        return;
      }

      if (_event === 'SIGNED_OUT') {
        // Reset semua store biar data akun lama ga nyangkut
        resetAllUserStores();
        lastUserId = null;
        setSession(null);
        return;
      }

      if (session) {
        const newUserId = session.user.id;

        // Reset store kalau user berubah (ganti akun tanpa logout eksplisit,
        // misalnya lewat OAuth langsung ganti akun)
        if (lastUserId && lastUserId !== newUserId) {
          resetAllUserStores();
        }
        lastUserId = newUserId;

        loadUserData();
      }

      setSession(session ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Deep link handler ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      if (
        !url ||
        url === 'brecise://' ||
        url === 'brecise:///' ||
        (url.startsWith('exp://') && !url.includes('auth/callback'))
      ) {
        return;
      }

      if (url.includes('access_token=')) {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setSession(data.session);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => subscription.remove();
  }, []);

  // ── Splash ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      setTimeout(() => setIsNavigationReady(true), 300);
    }
  }, [fontsLoaded, fontError]);

  // ── Routing ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (session === undefined) return;
    if (!isNavigationReady) return;
    if (isAuthLoading) return;
    if (isResettingPassword) return;

    const inAuthGroup = (segments as string[]).includes('auth');

    if (!session && !inAuthGroup) {
      router.replace('/auth');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [session, segments, isNavigationReady, isAuthLoading, isResettingPassword]);

  // ── Assessment ────────────────────────────────────────────────────────────
  // FIX: sebelumnya popup assessment nunggu `hasSynced` dulu (biar gak
  // "flash" muncul padahal akun itu sebenarnya sudah punya program), TAPI
  // masih ditambah delay artifisial 700ms sebelum ditampilkan. Delay itu
  // dihapus — begitu `hasSynced` true dan ternyata belum isCompleted,
  // assessment langsung ditampilkan sebagai layar pertama yang dilihat user
  // (bukan dashboard dulu baru nongol assessment beberapa saat kemudian).
  useEffect(() => {
    if (session && hasSynced && !isCompleted && !isResettingPassword) {
      setShowAssessment(true);
    }
  }, [session, isCompleted, hasSynced, isResettingPassword]);

  // ── Refresh Laporan Mingguan ─────────────────────────────────────────────
  useEffect(() => {
    if (!session || isAuthLoading) return;

    const refreshWeeklyReportIfNeeded = async () => {
      const { weeklyReportEnabled } = useNotificationStore.getState();
      if (!weeklyReportEnabled) return;

      const { workoutsByDate } = useWorkoutStore.getState();

      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const weeklyWorkouts = Object.entries(workoutsByDate)
        .filter(([dateKey]) => {
          const date = new Date(dateKey);
          return date >= sevenDaysAgo && date <= now;
        })
        .flatMap(([, workouts]) => workouts ?? []);

      const completed = weeklyWorkouts.filter((w) => w.status === 'completed');
      const totalSessions = completed.length;
      const totalDistance = completed.reduce(
        (sum, w) => sum + (w.trackingResult?.actualDistance ?? 0),
        0
      );

      await scheduleWeeklyReport(totalSessions, Math.round(totalDistance * 10) / 10, 0);
    };

    refreshWeeklyReportIfNeeded();

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        refreshWeeklyReportIfNeeded();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => appStateSubscription.remove();
  }, [session, isAuthLoading]);

  // ── Handle close assessment (user MENOLAK / keluar sebelum selesai) ───────
  const handleAssessmentClose = () => {
    setShowAssessment(false);
    setTimeout(() => router.replace('/(tabs)/dashboard'), 300);
  };

  // ── Handle assessment selesai (program berhasil dibuat) ───────────────────
  // ✅ FIX: TIDAK redirect ke dashboard di sini. AssessmentFlow sendiri yang
  // langsung router.push ke '/(tabs)/training' (Plan) setelah ini dipanggil.
  // Sebelumnya kedua kasus (menolak vs selesai) sama-sama lewat
  // handleAssessmentClose, jadi 300ms setelah user selesai bikin program,
  // timer redirect-ke-dashboard di atas menimpa push ke training tadi.
  const handleAssessmentDone = () => {
    setShowAssessment(false);
  };

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      {/* ✅ NEW: bungkus seluruh app dengan CoachMarkProvider, sekali di root,
          supaya overlay spotlight bisa muncul di atas layar mana pun (Stack,
          AssessmentFlow, dst) tanpa perlu didaftarkan ulang per halaman. */}
      <CoachMarkProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#E0E3E5' }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="about" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="pro" />
          </Stack>

          <AssessmentFlow
            visible={showAssessment}
            onClose={handleAssessmentClose}
            onDone={handleAssessmentDone}
          />
          {isAuthLoading && (
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              justifyContent: 'center', alignItems: 'center',
              backgroundColor: '#FFFFFF',
            }}>
              <ActivityIndicator size="large" color="#6BFF8F" />
            </View>
          )}
        </SafeAreaView>
      </CoachMarkProvider>
    </SafeAreaProvider>
  );
}