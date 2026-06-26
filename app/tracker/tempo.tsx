import { useState, useRef, useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import {
  Alert, View, Text, StyleSheet, TouchableOpacity,
  Pressable, Vibration, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFinishWorkout } from '@/hooks/useFinishWorkout';

const MIN_SPEED_MS       = 1.0;
const MIN_ACCURACY_M     = 15;
const MIN_DIST_THRESHOLD = 0.003;
const HOLD_DURATION      = 2000;

type TempoPhase = 'warmup' | 'tempo' | 'cooldown';
type Status     = 'idle' | 'running' | 'paused' | 'done';

type PhaseData = {
  key: TempoPhase;
  label: string;
  color: string;
  emoji: string;
  targetDistKm: number;
  targetPaceRaw: string;
};

type PhaseResult = {
  actualDistance: number;
  actualDuration: number;
  actualPace: string;
  targetDistance: number;
  targetPace: string;
  hit: boolean;
};

// ─── Full Circular Progress (pakai Circle SVG, bukan arc Path) ────────────
const RING_SIZE = 220;
const STROKE    = 14;
const RADIUS    = (RING_SIZE - STROKE) / 2;
const CENTER    = RING_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CircularProgress({
  progress,
  color,
  currentDist,
  targetDist,
}: {
  progress: number;
  color: string;
  currentDist: number;
  targetDist: number;
}) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  // strokeDashoffset: 0 = penuh, CIRCUMFERENCE = kosong
  const strokeDashoffset = CIRCUMFERENCE * (1 - clampedProgress);

  return (
    <View style={ringStyles.wrapper}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        {/* Track (full circle abu-abu) */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke="#EBEBEB"
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Progress fill - mulai dari atas (rotate -90deg via transform) */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
      </Svg>

      {/* Center content */}
      <View style={ringStyles.centerContent}>
        <Text style={ringStyles.progressLabel}>
          {currentDist.toFixed(2)} km / {targetDist} km
        </Text>
        <Text style={ringStyles.label}>DISTANCE</Text>
        <Text style={[ringStyles.distanceValue, { color }]}>
          {currentDist.toFixed(2)}
        </Text>
        <Text style={ringStyles.distanceUnit}>KM</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: 1.5,
  },
  distanceValue: {
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 52,
    letterSpacing: -1,
  },
  distanceUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#888',
  },
});

// ─── Main Component ───────────────────────────────────────────────────────
export default function TempoTracker() {
  const router = useRouter();
  const {
    uid, dateKey, workoutName,
    warmupDistance, warmupPace,
    tempoDistance, targetPace,
    cooldownDistance, cooldownPace,
  } = useLocalSearchParams<{
    uid: string; dateKey: string; workoutName: string;
    warmupDistance: string; warmupPace: string;
    tempoDistance: string;  targetPace: string;
    cooldownDistance: string; cooldownPace: string;
  }>();

  const phases: PhaseData[] = [
    {
      key: 'warmup', label: 'Warm Up', color: '#FF9500', emoji: '🔥',
      targetDistKm:  parseFloat(warmupDistance  ?? '0'),
      targetPaceRaw: warmupPace  ?? '0',
    },
    {
      key: 'tempo', label: 'Tempo Session', color: '#2E7D32', emoji: '⚡',
      targetDistKm:  parseFloat(tempoDistance   ?? '0'),
      targetPaceRaw: targetPace  ?? '0',
    },
    {
      key: 'cooldown', label: 'Cool Down', color: '#007AFF', emoji: '❄️',
      targetDistKm:  parseFloat(cooldownDistance ?? '0'),
      targetPaceRaw: cooldownPace ?? '0',
    },
  ];

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [status,            setStatus]            = useState<Status>('idle');
  const [isHolding,         setIsHolding]         = useState(false);
  const [phaseDist,         setPhaseDist]         = useState(0);
  const [phaseTime,         setPhaseTime]         = useState(0);
  const [phaseMovingTime,   setPhaseMovingTime]   = useState(0);
  const [phaseResults,      setPhaseResults]      = useState<Record<TempoPhase, PhaseResult>>({
    warmup:   { actualDistance: 0, actualDuration: 0, actualPace: '--:--', targetDistance: phases[0].targetDistKm, targetPace: phases[0].targetPaceRaw, hit: false },
    tempo:    { actualDistance: 0, actualDuration: 0, actualPace: '--:--', targetDistance: phases[1].targetDistKm, targetPace: phases[1].targetPaceRaw, hit: false },
    cooldown: { actualDistance: 0, actualDuration: 0, actualPace: '--:--', targetDistance: phases[2].targetDistKm, targetPace: phases[2].targetPaceRaw, hit: false },
  });
  const [finalResults, setFinalResults] = useState<Record<TempoPhase, PhaseResult> | null>(null);

  const subscription     = useRef<any>(null);
  const timerRef         = useRef<any>(null);
  const holdTimeout      = useRef<any>(null);
  const lastLocationRef  = useRef<any>(null);
  const isMovingRef      = useRef<boolean>(false);
  const phaseDistRef     = useRef<number>(0);
  const phaseTimeRef     = useRef<number>(0);
  const phaseMovingRef   = useRef<number>(0);
  const phaseIndexRef    = useRef<number>(0);
  const statusRef        = useRef<Status>('idle');
  const autoTriggered    = useRef<boolean>(false);

  const kalmanRef = useRef({
    lat: { estimate: 0, errorEstimate: 1, errorMeasure: 0.01, gain: 0, initialized: false },
    lon: { estimate: 0, errorEstimate: 1, errorMeasure: 0.01, gain: 0, initialized: false },
  });

  const holdProgress = useSharedValue(0);

  useEffect(() => { phaseDistRef.current   = phaseDist;         }, [phaseDist]);
  useEffect(() => { phaseTimeRef.current   = phaseTime;         }, [phaseTime]);
  useEffect(() => { phaseMovingRef.current = phaseMovingTime;   }, [phaseMovingTime]);
  useEffect(() => { phaseIndexRef.current  = currentPhaseIndex; }, [currentPhaseIndex]);
  useEffect(() => { statusRef.current      = status;            }, [status]);

  const { finish } = useFinishWorkout(
    dateKey, uid, [timerRef], subscription,
    {
      hasOwnDoneScreen: true,
      onAfterSave: () => setStatus('done'),
    },
  );

  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        setPhaseTime((p) => p + 1);
        if (isMovingRef.current) setPhaseMovingTime((p) => p + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  const kalmanUpdate = (axis: 'lat' | 'lon', measurement: number): number => {
    const k = kalmanRef.current[axis];
    if (!k.initialized) { k.estimate = measurement; k.initialized = true; return measurement; }
    k.errorEstimate += 0.0001;
    k.gain       = k.errorEstimate / (k.errorEstimate + k.errorMeasure);
    k.estimate   = k.estimate + k.gain * (measurement - k.estimate);
    k.errorEstimate = (1 - k.gain) * k.errorEstimate;
    return k.estimate;
  };

  const resetKalman = () => {
    kalmanRef.current = {
      lat: { estimate: 0, errorEstimate: 1, errorMeasure: 0.01, gain: 0, initialized: false },
      lon: { estimate: 0, errorEstimate: 1, errorMeasure: 0.01, gain: 0, initialized: false },
    };
  };

  const toRad = (v: number) => (v * Math.PI) / 180;

  const getDistance = (loc1: any, loc2: any): number => {
    const R = 6371;
    const dLat = toRad(loc2.latitude  - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const a =
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

  const calcPace = (dist: number, mTime: number): string => {
    if (dist === 0 || mTime === 0) return '--:--';
    const s = mTime / dist;
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const formatPace = (raw: string): string => {
    const val = parseFloat(raw);
    if (isNaN(val)) return raw;
    const m = Math.floor(val);
    const s = Math.round((val - m) * 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const isPaceHit = (actualPace: string, targetPaceRaw: string): boolean => {
    const target = parseFloat(targetPaceRaw);
    const parts  = actualPace.split(':');
    if (parts.length !== 2) return false;
    const actualSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    return actualSec <= target * 60;
  };

  const startLocationWatch = async () => {
    subscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 2 },
      (loc) => {
        const coord    = loc.coords;
        const accuracy = coord.accuracy ?? 999;
        const speed    = coord.speed ?? 0;
        if (accuracy > MIN_ACCURACY_M) return;
        isMovingRef.current = speed >= MIN_SPEED_MS;
        const filteredLat = kalmanUpdate('lat', coord.latitude);
        const filteredLon = kalmanUpdate('lon', coord.longitude);
        const filtered    = { latitude: filteredLat, longitude: filteredLon };
        setPhaseDist((prev) => {
          const last = lastLocationRef.current;
          if (!last) { lastLocationRef.current = filtered; return prev; }
          const dist = getDistance(last, filtered);
          if (dist < MIN_DIST_THRESHOLD) return prev;
          if (dist > 0.1)               return prev;
          if (!isMovingRef.current)     return prev;
          lastLocationRef.current = filtered;
          const newDist = prev + dist;
          const currentTarget = phases[phaseIndexRef.current].targetDistKm;
          if (currentTarget > 0 && newDist >= currentTarget && statusRef.current === 'running' && !autoTriggered.current) {
            autoTriggered.current = true;
            setTimeout(() => completePhase(newDist), 0);
          }
          return newDist;
        });
      }
    );
  };

  const completePhase = async (overrideDist?: number) => {
    if (statusRef.current === 'idle' || statusRef.current === 'done') return;
    subscription.current?.remove();
    subscription.current    = null;
    clearInterval(timerRef.current);
    isMovingRef.current     = false;
    lastLocationRef.current = null;
    const finalDist  = overrideDist ?? phaseDistRef.current;
    const finalTime  = phaseTimeRef.current;
    const finalPace  = calcPace(finalDist, phaseMovingRef.current);
    const phaseKey   = phases[phaseIndexRef.current].key;
    const phaseData  = phases[phaseIndexRef.current];
    const hit        = isPaceHit(finalPace, phaseData.targetPaceRaw) && finalDist >= phaseData.targetDistKm;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Vibration.vibrate([0, 100, 80, 200]);
    const result: PhaseResult = {
      actualDistance: finalDist, actualDuration: finalTime,
      actualPace: finalPace, targetDistance: phaseData.targetDistKm,
      targetPace: phaseData.targetPaceRaw, hit,
    };
    setPhaseResults((prev) => {
      const updated = { ...prev, [phaseKey]: result };
      const isLast  = phaseIndexRef.current >= phases.length - 1;
      if (isLast) {
        setFinalResults(updated);
        const totalDist     = Object.values(updated).reduce((a, r) => a + r.actualDistance, 0);
        const totalDuration = Object.values(updated).reduce((a, r) => a + r.actualDuration, 0);
        finish({
          actualDistance: totalDist, actualDuration: totalDuration,
          actualPace: updated.tempo.actualPace, completedAt: Date.now(),
          phaseResults: { warmup: updated.warmup, tempo: updated.tempo, cooldown: updated.cooldown },
        });
      } else {
        const nextIndex = phaseIndexRef.current + 1;
        setCurrentPhaseIndex(nextIndex);
        setPhaseDist(0); setPhaseTime(0); setPhaseMovingTime(0);
        setStatus('idle');
        autoTriggered.current = false;
        resetKalman();
      }
      return updated;
    });
  };

  const handleStart = async () => {
    if (status === 'idle') {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') { alert('Izin lokasi ditolak.'); return; }
      resetKalman();
      autoTriggered.current = false;
      await startLocationWatch();
      setStatus('running');
    } else if (status === 'running') {
      subscription.current?.remove();
      subscription.current    = null;
      isMovingRef.current     = false;
      lastLocationRef.current = null;
      setStatus('paused');
    } else {
      resetKalman();
      await startLocationWatch();
      setStatus('running');
    }
  };

  const handleNextSession = () => completePhase();

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
      completePhase();
      setIsHolding(false);
      holdProgress.value = withTiming(0, { duration: 200 });
    }, HOLD_DURATION);
  };

  const handleHoldEnd = () => {
    setIsHolding(false);
    holdProgress.value = withTiming(0, { duration: 200 });
    clearTimeout(holdTimeout.current);
  };

  const currentPhase = phases[currentPhaseIndex];
  const isLastPhase  = currentPhaseIndex === phases.length - 1;
  const phaseColor   = currentPhase?.color ?? '#888';

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: `${phaseColor}${Math.round((0.3 + holdProgress.value * 0.7) * 255).toString(16).padStart(2, '0')}`,
    transform:   [{ scale: 1 + holdProgress.value * 0.03 }],
  }));
  const animatedFillStyle = useAnimatedStyle(() => ({ opacity: holdProgress.value * 0.15 }));
  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: isHolding ? 0.6 + holdProgress.value * 0.4 : 1,
  }));

  const distProgress = currentPhase
    ? Math.min(phaseDist / (currentPhase.targetDistKm || 1), 1)
    : 0;

  // ─── Done screen ──────────────────────────────────────────────────────────
  if (status === 'done' && finalResults) {
    const totalDist     = Object.values(finalResults).reduce((a, r) => a + r.actualDistance, 0);
    const totalDuration = Object.values(finalResults).reduce((a, r) => a + r.actualDuration, 0);
    const hitCount      = Object.values(finalResults).filter((r) => r.hit).length;
    const allHit        = hitCount === phases.length;

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: '#FFFFFF' }]}>
        <ScrollView contentContainerStyle={styles.doneContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.trophyWrapper}>
            <Ionicons name="trophy" size={36} color="#5BFF7A" />
          </View>
          <Text style={styles.doneTitle}>Workout Selesai!</Text>
          <Text style={styles.doneSub}>
            {allHit ? 'Semua target tercapai, kerja bagus!' : `${hitCount}/${phases.length} fase tercapai, terus tingkatkan!`}
          </Text>
          <View style={styles.durationBox}>
            <Text style={styles.durationLabel}>DURASI TOTAL</Text>
            <Text style={styles.durationValue}>{formatTime(totalDuration)}</Text>
            <Text style={styles.durationUnit}>Menit</Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxEmoji}>📍</Text>
              <Text style={styles.statBoxLabel}>JARAK</Text>
              <Text style={styles.statBoxValue}>{totalDist.toFixed(2)}</Text>
              <Text style={styles.statBoxUnit}>km</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxEmoji}>⚡</Text>
              <Text style={styles.statBoxLabel}>FASE TERCAPAI</Text>
              <Text style={styles.statBoxValue}>{hitCount}/{phases.length}</Text>
              <Text style={styles.statBoxUnit}>fase</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>HASIL PER FASE</Text>
          {phases.map((phase) => {
            const result = finalResults[phase.key];
            return (
              <View key={phase.key} style={[styles.phaseResultCard, { borderLeftColor: result.hit ? '#4CD964' : '#FF3B30' }]}>
                <View style={styles.phaseResultHeader}>
                  <Text style={styles.phaseResultTitle}>{phase.emoji} {phase.label.toUpperCase()}</Text>
                  <View style={[styles.hitBadge, { backgroundColor: result.hit ? '#F0FFF4' : '#FFF5F5' }]}>
                    <Ionicons name={result.hit ? 'checkmark-circle' : 'close-circle'} size={12} color={result.hit ? '#2E7D32' : '#FF3B30'} />
                    <Text style={[styles.hitBadgeText, { color: result.hit ? '#2E7D32' : '#FF3B30' }]}>{result.hit ? 'Tercapai' : 'Belum'}</Text>
                  </View>
                </View>
                <View style={styles.phaseResultStats}>
                  <View style={styles.phaseResultStat}>
                    <Text style={styles.phaseStatLabel}>JARAK</Text>
                    <Text style={styles.phaseStatValue}>{result.actualDistance.toFixed(2)} km</Text>
                    <Text style={styles.phaseStatTarget}>target {result.targetDistance} km</Text>
                  </View>
                  <View style={styles.phaseResultStat}>
                    <Text style={styles.phaseStatLabel}>PACE</Text>
                    <Text style={[styles.phaseStatValue, { color: result.hit ? '#2E7D32' : '#FF3B30' }]}>{result.actualPace}/km</Text>
                    <Text style={styles.phaseStatTarget}>target {formatPace(result.targetPace)}/km</Text>
                  </View>
                  <View style={styles.phaseResultStat}>
                    <Text style={styles.phaseStatLabel}>WAKTU</Text>
                    <Text style={styles.phaseStatValue}>{formatTime(result.actualDuration)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Kembali ke Dashboard →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Running screen ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.workoutName}>{workoutName || 'TEMPO RUN'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Phase Stepper */}
      <View style={styles.stepper}>
        {phases.map((phase, index) => {
          const isDone   = index < currentPhaseIndex;
          const isActive = index === currentPhaseIndex;
          return (
            <View key={phase.key} style={styles.stepperItem}>
              {index < phases.length - 1 && (
                <View style={[styles.stepperLine, isDone && { backgroundColor: phase.color }]} />
              )}
              <View style={[
                styles.stepperDot,
                isDone   && { backgroundColor: phase.color, borderColor: phase.color },
                isActive && { borderColor: phase.color, borderWidth: 2 },
              ]}>
                {isDone
                  ? <Ionicons name="checkmark" size={12} color="#fff" />
                  : <Text style={[styles.stepperNum, isActive && { color: phase.color }]}>{index + 1}</Text>
                }
              </View>
              <Text style={[
                styles.stepperLabel,
                isActive && { color: phase.color, fontWeight: '700' },
                isDone   && { color: '#AAA' },
              ]}>
                {phase.emoji} {phase.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Main content — pakai View biasa bukan ScrollView agar tidak ada gap aneh */}
      <View style={styles.mainContent}>
        {/* Phase Title + Badge */}
        <View style={styles.phaseTitleRow}>
          <Text style={[styles.phaseTitle, { color: phaseColor }]}>
            {currentPhase?.label}
          </Text>
          {status !== 'idle' && (
            <View style={[styles.badge, { backgroundColor: status === 'running' ? phaseColor : '#FF9500' }]}>
              <Text style={styles.badgeText}>
                {status === 'running' ? (isMovingRef.current ? 'TRACKING' : 'DIAM') : 'PAUSED'}
              </Text>
            </View>
          )}
        </View>

        {/* Ring */}
        <CircularProgress
          progress={distProgress}
          color={phaseColor}
          currentDist={phaseDist}
          targetDist={currentPhase?.targetDistKm ?? 0}
        />

        {/* Target Info */}
        <Text style={styles.targetText}>
          Target: {currentPhase?.targetDistKm} km @ {formatPace(currentPhase?.targetPaceRaw ?? '0')}/km
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statValue}>{formatTime(phaseTime)}</Text>
            <Text style={styles.statSub}>MM:SS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>AVG PACE</Text>
            <Text style={styles.statValue}>{calcPace(phaseDist, phaseMovingTime)}</Text>
            <Text style={styles.statSub}>MIN/KM</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: status === 'paused' ? '#FFB84D' : phaseColor }]}
            onPress={handleStart}
          >
            <Text style={styles.mainBtnText}>
              {status === 'idle'
                ? `MULAI ${currentPhase?.label.toUpperCase()}`
                : status === 'running' ? '⏸ PAUSE' : '▶ RESUME'}
            </Text>
          </TouchableOpacity>

          {status !== 'idle' && !isLastPhase && (
            <TouchableOpacity
              style={[styles.nextBtn, { borderColor: phaseColor }]}
              onPress={handleNextSession}
            >
              <Text style={[styles.nextBtnText, { color: phaseColor }]}>NEXT SESSION →</Text>
            </TouchableOpacity>
          )}

          {status !== 'idle' && isLastPhase && (
            <>
              <Text style={styles.bottomHint}>
                {isHolding ? 'Tahan untuk selesaikan sesi...' : 'Tahan untuk selesaikan sesi'}
              </Text>
              <Pressable onPressIn={handleHoldStart} onPressOut={handleHoldEnd}>
                <Animated.View style={[styles.finishBtn, animatedBorderStyle]}>
                  <Animated.View style={[styles.finishBtnFill, { backgroundColor: phaseColor }, animatedFillStyle]} />
                  <Animated.Text style={[styles.finishText, { color: phaseColor }, animatedTextStyle]}>
                    {isHolding ? '✓ SELESAI...' : 'HOLD TO FINISH'}
                  </Animated.Text>
                </Animated.View>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  workoutName: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, color: '#111' },

  stepper: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  stepperItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepperDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#DDD',
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  stepperNum:  { fontSize: 11, fontWeight: '700', color: '#AAA' },
  stepperLabel: { fontSize: 10, fontWeight: '600', color: '#AAA', textAlign: 'center', lineHeight: 14 },
  stepperLine: {
    position: 'absolute', top: 13, right: -20,
    width: 40, height: 1, backgroundColor: '#E0E0E0',
  },

  // Ganti ScrollView jadi View flex biasa → tidak ada gap berlebih
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  phaseTitleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  phaseTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  targetText: {
    textAlign: 'center', fontSize: 12, color: '#999', fontWeight: '500',
  },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#F7F7F7', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', gap: 3,
  },
  statLabel: { fontSize: 11, color: '#999', fontWeight: '700', letterSpacing: 0.8 },
  statValue: { fontSize: 22, fontWeight: '900', color: '#111' },
  statSub:   { fontSize: 10, color: '#BBB', fontWeight: '600' },

  buttonGroup: { gap: 10 },
  bottomHint: { textAlign: 'center', color: '#AAA', fontSize: 12 },
  mainBtn: { borderRadius: 999, height: 56, justifyContent: 'center', alignItems: 'center' },
  mainBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  nextBtn: {
    borderRadius: 999, height: 52,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, backgroundColor: '#FFFFFF',
  },
  nextBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  finishBtn: {
    height: 56, borderRadius: 999, borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)', backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  finishBtnFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999 },
  finishText: { fontWeight: '700', letterSpacing: 1, fontSize: 14 },

  // Done screen
  doneContainer: { padding: 24, gap: 20, paddingBottom: 48, alignItems: 'center' },
  trophyWrapper: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  doneTitle: { fontSize: 36, fontWeight: '900', color: '#1A1A2E', textAlign: 'center', lineHeight: 42 },
  doneSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  durationBox: { width: '100%', backgroundColor: '#F4F4F4', borderRadius: 16, padding: 20, gap: 2 },
  durationLabel: { fontSize: 11, fontWeight: '700', color: '#AAA', letterSpacing: 0.8 },
  durationValue: { fontSize: 36, fontWeight: '900', color: '#1A1A2E' },
  durationUnit:  { fontSize: 14, color: '#888', fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: 12, width: '100%' },
  statBox: { flex: 1, backgroundColor: '#F4F4F4', borderRadius: 16, padding: 16, gap: 2 },
  statBoxEmoji: { fontSize: 22, marginBottom: 4 },
  statBoxLabel: { fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 },
  statBoxValue: { fontSize: 24, fontWeight: '900', color: '#1A1A2E' },
  statBoxUnit:  { fontSize: 12, color: '#888', fontWeight: '500' },
  sectionTitle: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8 },
  phaseResultCard: { width: '100%', backgroundColor: '#F9F9F9', borderRadius: 14, padding: 14, borderLeftWidth: 4, gap: 10 },
  phaseResultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phaseResultTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A2E' },
  hitBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  hitBadgeText: { fontSize: 11, fontWeight: '700' },
  phaseResultStats: { flexDirection: 'row', justifyContent: 'space-between' },
  phaseResultStat: { alignItems: 'center', gap: 2 },
  phaseStatLabel: { fontSize: 10, fontWeight: '600', color: '#AAA', letterSpacing: 0.5 },
  phaseStatValue: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  phaseStatTarget: { fontSize: 10, color: '#BBB' },
  doneBtn: { width: '100%', backgroundColor: '#63EA7B', borderRadius: 40, paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { color: '#111', fontWeight: '800', fontSize: 16 },
});