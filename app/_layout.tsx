import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { supabase, clearInvalidSession } from '@/lib/supabase'; // ← tambah clearInvalidSession
import AssessmentFlow from '@/components/ui/assessment/assessmentflow';
import { useAssessmentStore } from '@/store/assessmentStore';

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
    'Lexend-Bold':    require('../assets/font/static/Lexend-Bold.ttf'),
    'Lexend-Regular': require('../assets/font/static/Lexend-Regular.ttf'),
    'Lexend-Black':   require('../assets/font/static/Lexend-Black.ttf'),
  });

  // ── Session ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const initSession = async () => {
      // ✅ Bersihkan session invalid (refresh token not found) sebelum getSession
      await clearInvalidSession();

      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setIsAuthLoading(false);
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Kalau event PASSWORD_RECOVERY, set flag reset & jangan update session biasa
      if (_event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
        return;
      }

      // Kalau lagi reset password, abaikan session update agar tidak redirect dashboard
      if (_event === 'SIGNED_IN' && isResettingPassword) {
        return;
      }

      // ✅ Kalau SIGNED_OUT (termasuk karena token invalid), clear session
      if (_event === 'SIGNED_OUT') {
        setSession(null);
        return;
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