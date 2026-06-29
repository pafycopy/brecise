import { useState, useRef, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Vibration,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFinishWorkout } from '@/hooks/useFinishWorkout';
import { formatPaceDisplay } from '@/constants/workoutformconfig';

const MIN_SPEED_MS  = 0.5 / 3.6;
const HOLD_DURATION = 2000;
const BEEP_SOUND    = require('@/assets/sounds/success.mp3');

// Status pace relatif terhadap range target
type PaceStatus = 'in_range' | 'too_fast' | 'too_slow' | 'no_target';

export default function RunningTracker() {
  const router = useRouter();
  const {
    uid, dateKey, workoutType, workoutName,
    // ── Parameter baru untuk range pace ──────────────────────────────────────
    // Dikirim dari halaman sebelumnya sebagai string query params
    paceMin: paceMinParam,   // string | undefined, menit desimal
    paceMax: paceMaxParam,   // string | undefined, menit desimal
  } = useLocalSearchParams<{
    uid: string;
    dateKey: string;
    workoutType: string;
    workoutName: string;
    paceMin?: string;
    paceMax?: string;
  }>();

  const player = useAudioPlayer(BEEP_SOUND);

  // Parse pace range dari params (0 = tidak ada target)
  const targetPaceMin = paceMinParam ? parseFloat(paceMinParam) : 0;
  const targetPaceMax = paceMaxParam ? parseFloat(paceMaxParam) : 0;
  const hasPaceRange  = targetPaceMin > 0 && targetPaceMax > 0;
  const isPaceRangeWorkout = workoutType === 'Easy Run' || workoutType === 'Long Run';

  const [time,        setTime]        = useState(0);
  const [movingTime,  setMovingTime]  = useState(0);
  const [totalDist,   setTotalDist]   = useState(0);
  const [status,      setStatus]      = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
  const [isHolding,   setIsHolding]   = useState(false);
  const [finalStats,  setFinalStats]  = useState<{
    dist: number; time: number; pace: string;
  } | null>(null);

  const subscription      = useRef<any>(null);
  const timerRef          = useRef<any>(null);
  const holdTimeout       = useRef<any>(null);
  const lastLocationRef   = useRef<any>(null);
  const isMovingRef       = useRef<boolean>(false);
  const lastAnnouncedKm   = useRef<number>(0);
  const totalDistRef      = useRef<number>(0);
  const timeRef           = useRef<number>(0);
  const movingTimeRef     = useRef<number>(0);

  useEffect(() => { totalDistRef.current  = totalDist;  }, [totalDist]);
  useEffect(() => { timeRef.current       = time;       }, [time]);
  useEffect(() => { movingTimeRef.current = movingTime; }, [movingTime]);

  const { finish } = useFinishWorkout(
    dateKey, uid, [timerRef], subscription,
    { hasOwnDoneScreen: true, onAfterSave: () => setStatus('done') },
  );

  const holdProgress = useSharedValue(0);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
        if (isMovingRef.current) setMovingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // ── Km milestone ──────────────────────────────────────────────────────────
  useEffect(() => {
    const kmReached = Math.floor(totalDist);
    if (kmReached > 0 && kmReached > lastAnnouncedKm.current) {
      lastAnnouncedKm.current = kmReached;
      announceKilometer(kmReached);
    }
  }, [totalDist]);

  const announceKilometer = async (km: number) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 150, 100, 150]);
    try { player.seekTo(0); player.play(); } catch (e) {}
  };

  const toRad       = (value: number) => (value * Math.PI) / 180;
  const getDistance = (loc1: any, loc2: any): number => {
    const R    = 6371;
    const dLat = toRad(loc2.latitude  - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const a    =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 *
      Math.cos(toRad(loc1.latitude)) *
      Math.cos(toRad(loc2.latitude));
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h} Jam ${m} Menit`;
    if (m > 0) return `${m} Menit ${s > 0 ? `${s} Detik` : ''}`.trim();
    return `${s} Detik`;
  };

  const calcPace = (dist: number, mTime: number): string => {
    if (dist === 0 || mTime === 0) return '--:--';
    const sec = mTime / dist;
    return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
  };

  // ── Konversi string pace "M:SS" ke menit desimal ──────────────────────────
  const paceStringToMin = (paceStr: string): number => {
    if (!paceStr || paceStr === '--:--') return 0;
    const parts = paceStr.split(':');
    if (parts.length !== 2) return 0;
    return parseInt(parts[0]) + parseInt(parts[1]) / 60;
  };

  // ── Status pace saat ini relatif terhadap target range ───────────────────
  const getCurrentPaceStatus = (): PaceStatus => {
    if (!hasPaceRange || !isPaceRangeWorkout) return 'no_target';
    const currentPaceStr = calcPace(totalDist, movingTime);
    const currentPace    = paceStringToMin(currentPaceStr);
    if (currentPace === 0) return 'no_target';
    if (currentPace < targetPaceMin) return 'too_fast';   // lebih cepat dari min
    if (currentPace > targetPaceMax) return 'too_slow';   // lebih lambat dari max
    return 'in_range';
  };

  const paceStatus = getCurrentPaceStatus();

  // Warna & label berdasarkan status pace
  // NOTE: `bg` sekarang tidak lagi dipakai untuk background box TARGET (box itu
  // selalu putih solid seperti Duration/Avg Pace). `bg` masih disimpan untuk
  // kemungkinan dipakai di tempat lain, tapi tidak dipakai di indicator ini lagi.
  const getPaceStatusConfig = () => {
    switch (paceStatus) {
      case 'in_range':  return { color: '#4CD964', label: 'DALAM RANGE ✓', bg: '#F0FFF4' };
      case 'too_fast':  return { color: '#007AFF', label: 'TERLALU CEPAT ↑', bg: '#EBF5FF' };
      case 'too_slow':  return { color: '#FF9500', label: 'TERLALU LAMBAT ↓', bg: '#FFF8ED' };
      default:          return { color: '#888',    label: '',                 bg: 'transparent' };
    }
  };
  const paceConfig = getPaceStatusConfig();

  const startLocationWatch = async () => {
    subscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 5 },
      (loc) => {
        const newCoord = loc.coords;
        const speed    = newCoord.speed ?? 0;
        const accuracy = newCoord.accuracy ?? 999;
        isMovingRef.current = speed >= MIN_SPEED_MS;
        if (accuracy > 15) return;
        if (speed < MIN_SPEED_MS) { lastLocationRef.current = newCoord; return; }
        setTotalDist((prev) => {
          const last = lastLocationRef.current;
          if (last) {
            const dist = getDistance(last, newCoord);
            if (dist < 0.005) return prev;
            lastLocationRef.current = newCoord;
            return prev + dist;
          }
          lastLocationRef.current = newCoord;
          return prev;
        });
      }
    );
  };

  const handleMainButton = async () => {
    if (status === 'idle') {
      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (permission !== 'granted') { alert('Izin lokasi ditolak.'); return; }
      await startLocationWatch();
      setStatus('running');
      try { player.seekTo(0); player.play(); } catch (e) {}
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (status === 'running') {
      subscription.current?.remove();
      subscription.current    = null;
      isMovingRef.current     = false;
      lastLocationRef.current = null;
      setStatus('paused');
    } else {
      await startLocationWatch();
      setStatus('running');
    }
  };

  const handleFinish = () => {
    const snapDist = totalDistRef.current;
    const snapTime = timeRef.current;
    const snapPace = calcPace(snapDist, movingTimeRef.current);
    setFinalStats({ dist: snapDist, time: snapTime, pace: snapPace });
    finish({ actualDistance: snapDist, actualDuration: snapTime, actualPace: snapPace, completedAt: Date.now() });
  };

  const handleDiscard = () => {
    Alert.alert('Keluar dari latihan?', 'Progress latihan akan hilang.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => { subscription.current?.remove(); router.back(); } },
    ]);
  };

  const handleHoldStart = () => {
    setIsHolding(true);
    holdProgress.value = withTiming(1, { duration: HOLD_DURATION, easing: Easing.linear });
    holdTimeout.current = setTimeout(() => {
      Vibration.vibrate([0, 100, 80, 100, 80, 300]);
      handleFinish();
    }, HOLD_DURATION);
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
    holdProgress.value = withTiming(0, { duration: 200 });
    clearTimeout(holdTimeout.current);
  };

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(239, 68, 68, ${0.3 + holdProgress.value * 0.7})`,
    transform:   [{ scale: 1 + holdProgress.value * 0.03 }],
  }));
  const animatedFillStyle  = useAnimatedStyle(() => ({ opacity: holdProgress.value * 0.15 }));
  const animatedTextStyle  = useAnimatedStyle(() => ({
    opacity: isHolding ? 0.6 + holdProgress.value * 0.4 : 1,
  }));

  // ─── DONE SCREEN ──────────────────────────────────────────────────────────
  if (status === 'done' && finalStats) {
    return (
      <SafeAreaView style={st.safeArea}>
        <ScrollView contentContainerStyle={st.doneScroll} showsVerticalScrollIndicator={false}>
          <View style={st.finishedIconWrap}>
            <View style={st.finishedIconCircle}>
              <Ionicons name="walk" size={44} color="#fff" />
            </View>
            <View style={st.finishedCheckBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#5BFF7A" />
            </View>
          </View>

          <Text style={st.doneTitle}>Berlari Selesai!</Text>
          <Text style={st.doneSub}>Pelan tidak apa-apa, yang penting konsisten</Text>

          <View style={st.durationCard}>
            <Text style={st.durationLabel}>DURASI TOTAL</Text>
            <Text style={st.durationValue}>{formatDuration(finalStats.time)}</Text>
          </View>

          <View style={st.statsRow}>
            <View style={st.statCard}>
              <Ionicons name="navigate-outline" size={18} color="#5BFF7A" />
              <Text style={st.statLabel}>JARAK</Text>
              <Text style={st.statValue}>{finalStats.dist.toFixed(2)}</Text>
              <Text style={st.statUnit}>km</Text>
            </View>
            <View style={st.statCard}>
              <Ionicons name="speedometer-outline" size={18} color="#4D7CFE" />
              <Text style={st.statLabel}>PACE</Text>
              <Text style={st.statValue}>{finalStats.pace}</Text>
              <Text style={st.statUnit}>min/km</Text>
            </View>
          </View>

          {/* ── Evaluasi pace range di done screen ── */}
          {hasPaceRange && isPaceRangeWorkout && finalStats.pace !== '--:--' && (() => {
            const actualPaceMin = paceStringToMin(finalStats.pace);
            const inRange = actualPaceMin >= targetPaceMin && actualPaceMin <= targetPaceMax;
            const tooFast = actualPaceMin < targetPaceMin;
            return (
              <View style={[st.paceEvalCard, {
                backgroundColor: inRange ? '#F0FFF4' : tooFast ? '#EBF5FF' : '#FFF8ED',
                borderColor:     inRange ? '#C8F5C8' : tooFast ? '#B3D9FF' : '#FFD9A0',
              }]}>
                <Ionicons
                  name={inRange ? 'checkmark-circle' : 'information-circle'}
                  size={18}
                  color={inRange ? '#2E7D32' : tooFast ? '#007AFF' : '#FF9500'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[st.paceEvalTitle, {
                    color: inRange ? '#2E7D32' : tooFast ? '#007AFF' : '#FF9500',
                  }]}>
                    {inRange ? 'Pace dalam target range!' : tooFast ? 'Pace sedikit terlalu cepat' : 'Pace sedikit terlalu lambat'}
                  </Text>
                  <Text style={st.paceEvalSub}>
                    Target: {formatPaceDisplay(targetPaceMin)}–{formatPaceDisplay(targetPaceMax)}/km
                    {'  ·  '}Actual: {finalStats.pace}/km
                  </Text>
                </View>
              </View>
            );
          })()}

          <TouchableOpacity style={st.doneBtn} onPress={() => router.back()} activeOpacity={0.88}>
            <Text style={st.doneBtnText}>Kembali ke Dashboard</Text>
            <Ionicons name="arrow-forward" size={18} color="#111" />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── RUNNING SCREEN ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={st.safeArea}>
      <View style={st.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={st.workoutName}>{workoutName || 'RUNNING'}</Text>
        </View>
      </View>

      <View style={st.container}>
        <View>
          {status !== 'idle' && (
            <View style={[st.badge, { backgroundColor: status === 'running' ? '#4CD964' : '#FF9500' }]}>
              <Text style={st.badgeText}>
                {status === 'running' ? (isMovingRef.current ? 'TRACKING' : 'DIAM') : 'PAUSED'}
              </Text>
            </View>
          )}
        </View>

        <View>
          <Text style={st.label}>DISTANCE</Text>
          <Text style={st.distance}>
            {totalDist.toFixed(2)}
            <Text style={st.unit}> KM</Text>
          </Text>
          <View style={st.runStatsRow}>
            <View style={st.runStatCard}>
              <Text style={st.statLabel}>DURATION</Text>
              <Text style={st.statValue}>{formatTime(time)}</Text>
              <Text style={st.statUnit}>MM:SS</Text>
            </View>
            <View style={[st.runStatCard]}>
              <Text style={st.statLabel}>AVG PACE</Text>
              <Text style={[st.statValue, paceStatus !== 'no_target' && { color: paceConfig.color }]}>
                {calcPace(totalDist, movingTime)}
              </Text>
              <Text style={st.statUnit}>MIN/KM</Text>
            </View>
          </View>

          {/* ── Target pace range indicator ──────────────────────────────────
              Sekarang: (1) box selalu background putih solid, sama seperti
              card Duration/Avg Pace di atas — bukan ikut warna transparan
              dari status pace. (2) tetap tampil selama status bukan 'idle',
              jadi tetap kelihatan pas paused/diam, tidak cuma saat running. */}
          {hasPaceRange && isPaceRangeWorkout && status !== 'idle' && (
            <View style={st.paceRangeIndicator}>
              <View style={st.paceRangeRow}>
                <Text style={st.paceRangeLabel}>TARGET</Text>
                <Text style={[st.paceRangeValue, { color: '#1A1A2E' }]}>
                  {formatPaceDisplay(targetPaceMin)} – {formatPaceDisplay(targetPaceMax)}/km
                </Text>
              </View>
              {paceStatus !== 'no_target' && (
                <View style={[st.paceStatusBadge, { backgroundColor: paceConfig.color }]}>
                  <Text style={st.paceStatusText}>{paceConfig.label}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View>
          {status !== 'idle' && (
            <Text style={st.bottomText}>
              {isHolding ? 'Tahan untuk berhenti...' : 'Tubuh Anda sedang beradaptasi'}
            </Text>
          )}
          <TouchableOpacity
            style={[st.mainBtn, { backgroundColor: status === 'paused' ? '#FFB84D' : '#63EA7B' }]}
            onPress={handleMainButton}
          >
            {(status === 'running' || status === 'idle') && (
              <Ionicons
                name={status === 'idle' ? 'play' : 'pause'}
                size={18} color="#111"
                style={{ marginRight: 6 }}
              />
            )}
            {status === 'paused' && (
              <Ionicons name="play" size={18} color="#111" style={{ marginRight: 6 }} />
            )}
            <Text style={st.mainBtnText}>
              {status === 'idle' ? 'START' : status === 'running' ? 'PAUSE' : 'RESUME'}
            </Text>
          </TouchableOpacity>
          {status !== 'idle' && (
            <Pressable onPressIn={handleHoldStart} onPressOut={handleHoldEnd}>
              <Animated.View style={[st.finishBtn, animatedBorderStyle]}>
                <Animated.View style={[st.finishBtnFill, animatedFillStyle]} />
                <Animated.Text style={[st.finishText, animatedTextStyle]}>
                  {isHolding ? 'BERHENTI...' : 'HOLD TO STOP'}
                </Animated.Text>
              </Animated.View>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },

  // ── Done screen ────────────────────────────────────────────────────────────
  doneScroll:         { padding: 24, gap: 16, paddingBottom: 48, alignItems: 'center' },
  finishedIconWrap:   { position: 'relative', marginBottom: 4 },
  finishedIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  finishedCheckBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#fff', borderRadius: 14, padding: 1 },
  doneTitle: { fontSize: 36, fontWeight: '800', color: '#111', lineHeight: 44, textAlign: 'center', marginTop: 4, fontFamily: 'Lexend-Black' },
  doneSub:   { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 22, marginTop: -4, fontFamily: 'Lexend-Regular' },
  durationCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 22, padding: 22, gap: 6 },
  durationLabel: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 0.6, fontFamily: 'Lexend-Bold' },
  durationValue: { fontSize: 34, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
  statsRow:  { flexDirection: 'row', gap: 12, width: '100%' },
  statCard:  { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 16, gap: 4 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#888', marginTop: 8, letterSpacing: 0.5, fontFamily: 'Lexend-Bold' },
  statValue: { fontSize: 26, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },
  statUnit:  { fontSize: 11, color: '#AAA', fontWeight: '500', fontFamily: 'Lexend-Regular' },

  // Pace eval card (done screen)
  paceEvalCard: {
    width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 14, padding: 14, borderWidth: 1,
  },
  paceEvalTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2, fontFamily: 'Lexend-Bold' },
  paceEvalSub:   { fontSize: 11, color: '#666', lineHeight: 16, fontFamily: 'Lexend-Regular' },

  doneBtn: {
    width: '100%', backgroundColor: '#5BFF7A',
    paddingVertical: 18, borderRadius: 40, marginTop: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: '#111', fontFamily: 'Lexend-Black' },

  // ── Running screen ─────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 0, paddingBottom: 8,
  },
  headerCenter: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingRight: 22 },
  workoutName:  { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, color: '#111', fontFamily: 'Lexend-Black' },
  container:    { flex: 1, paddingHorizontal: 20, paddingBottom: 30, justifyContent: 'space-between' },
  badge:        { alignSelf: 'center', marginTop: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText:    { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1, fontFamily: 'Lexend-Bold' },
  label:        { textAlign: 'center', fontSize: 13, letterSpacing: 1.5, color: '#666', marginBottom: 8, fontFamily: 'Lexend-Regular' },
  distance:     { textAlign: 'center', fontSize: 58, fontWeight: '900', color: '#000', lineHeight: 64, fontFamily: 'Lexend-Black' },
  unit:         { fontSize: 28, fontWeight: '700', color: '#555' },
  runStatsRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 12 },
  runStatCard:  { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 18, alignItems: 'center' },

  // Pace range indicator — sekarang box putih solid (long box), sama seperti
  // runStatCard, supaya konsisten dengan Duration/Avg Pace di atasnya.
  paceRangeIndicator: {
    marginTop: 12, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  paceRangeRow:   { gap: 2 },
  paceRangeLabel: { fontSize: 9, fontWeight: '700', color: '#888', letterSpacing: 0.8, fontFamily: 'Lexend-Bold' },
  paceRangeValue: { fontSize: 13, fontWeight: '700', fontFamily: 'Lexend-Bold' },
  paceStatusBadge:{
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  paceStatusText: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.5, fontFamily: 'Lexend-Black' },

  bottomText:  { textAlign: 'center', color: '#666', marginBottom: 18, fontSize: 13, fontFamily: 'Lexend-Regular' },
  mainBtn: {
    borderRadius: 999, height: 58,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row',
  },
  mainBtnText: { color: '#111', fontSize: 15, fontWeight: '800', letterSpacing: 1, fontFamily: 'Lexend-Black' },
  finishBtn: {
    marginTop: 10, height: 58, borderRadius: 999,
    borderWidth: 0, backgroundColor: '#E8E8E8',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  finishBtnFill: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#EF4444', borderRadius: 999,
  },
  finishText: { color: '#555', fontWeight: '700', letterSpacing: 1.5, fontSize: 14, fontFamily: 'Lexend-Bold' },
});