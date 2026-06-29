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
import { setupPurchaseListeners, initIAP, closeIAP, checkProStatus } from '@/lib/proService';
import { useNotificationStore } from '@/store/notificationStore';
import { useWorkoutStore } from '@/store/supabaseWorkoutStore';
import { scheduleWeeklyReport } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<any>(undefined);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { isCompleted } = useAssessmentStore();
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
      }
    };

    setupIAP();

    return () => {
      cleanupListeners?.();
      closeIAP();
    };
  }, []);

  // ── Session ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const initSession = async () => {
      await clearInvalidSession();
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setIsAuthLoading(false);

      // Cek status Pro setelah session siap
      if (data.session) {
        checkProStatus();
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
        setSession(null);
        return;
      }

      // Cek Pro setiap kali session berubah (login baru)
      if (session) {
        checkProStatus();
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
  useEffect(() => {
    if (session && !isCompleted && !isResettingPassword) {
      const timer = setTimeout(() => setShowAssessment(true), 700);
      return () => clearTimeout(timer);
    }
  }, [session, isCompleted, isResettingPassword]);

  // ── Refresh Laporan Mingguan ─────────────────────────────────────────────
  // Karena notifikasi mingguan dijadwalkan secara lokal (expo-notifications),
  // isinya tidak otomatis ter-update sendiri tiap minggu. Untuk meminimalkan
  // data yang basi, kita hitung ulang & re-schedule setiap kali user
  // membuka app (saat login sudah siap) dan setiap kali app kembali ke
  // foreground. Ini bukan solusi real-time, tapi memastikan data selalu
  // sefresh kunjungan terakhir user ke app.
  useEffect(() => {
    if (!session || isAuthLoading) return;

    const refreshWeeklyReportIfNeeded = async () => {
      const { weeklyReportEnabled } = useNotificationStore.getState();
      if (!weeklyReportEnabled) return;

      const { workoutsByDate } = useWorkoutStore.getState();

      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6); // termasuk hari ini = 7 hari
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

    // Refresh sekali saat app baru dibuka & session siap
    refreshWeeklyReportIfNeeded();

    // Refresh lagi setiap kali app kembali ke foreground (misal dari background)
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        refreshWeeklyReportIfNeeded();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => appStateSubscription.remove();
  }, [session, isAuthLoading]);

  // ── Handle close assessment ───────────────────────────────────────────────
  const handleAssessmentClose = () => {
    setShowAssessment(false);
    setTimeout(() => router.replace('/(tabs)/dashboard'), 300);
  };

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#E5E5E5' }}>
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
    </SafeAreaProvider>
  );
}