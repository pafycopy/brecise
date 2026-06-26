import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, TouchableWithoutFeedback,
} from 'react-native';
import type { View as RNView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPaceDisplay } from '@/constants/workoutformconfig';

type WorkoutStat = {
  label: string;
  value: string;
};

// ── Tipe hasil pace lama (Tempo / Interval — single target) ─────────────────
type PaceResult = {
  targetPace: string;
  actualPace: string;
  targetDistance: string;
  actualDistance: number;
};

// ── Tipe hasil pace range BARU (Easy Run / Long Run) ────────────────────────
type PaceRangeResult = {
  paceMin: number;          // batas bawah target (lebih cepat) dalam menit desimal
  paceMax: number;          // batas atas target (lebih lambat) dalam menit desimal
  actualPace: string;       // "M:SS" format
  targetDistance: string;
  actualDistance: number;
};

type TempoPhaseResult = {
  label: string;
  targetDistance: string;
  actualDistance: number;
  targetPace: string;
  actualPace: string;
};

type TempoResult = {
  phases: TempoPhaseResult[];
};

type RepResult = {
  rep: number;
  distance: number;
  duration: number;
  pace: string;
  hit: boolean;
};

type IntervalResult = {
  targetDistance: number;
  targetPace: string;
  reps: RepResult[];
};

type TodayWorkoutCardProps = {
  workoutType?: string;
  workoutName?: string;
  stats?: WorkoutStat[];
  status?: 'planned' | 'completed' | 'missed';
  paceResult?: PaceResult;           // Tempo / Interval (single target)
  paceRangeResult?: PaceRangeResult; // ← NEW: Easy Run / Long Run (range target)
  tempoResult?: TempoResult;
  intervalResult?: IntervalResult;
  onStartPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  startDisabled?: boolean;
  isEmpty?: boolean;
};

// ── Helper: parse "M:SS" → menit desimal ────────────────────────────────────
const parsePace = (paceStr: string): number => {
  if (!paceStr || paceStr === '--:--') return 0;
  const parts = paceStr.split(':');
  if (parts.length !== 2) return parseFloat(paceStr) || 0;
  return parseInt(parts[0]) + parseInt(parts[1]) / 60;
};

// ── Evaluasi hasil pace range (Easy Run / Long Run) ─────────────────────────
const compareRangeResult = (result: PaceRangeResult) => {
  const actualMin = parsePace(result.actualPace);
  const paceValid = actualMin > 0 && result.actualPace !== '--:--';

  // Tercapai kalau actual pace MASUK DALAM range (≥ paceMin dan ≤ paceMax)
  // Ingat: pace lebih besar = lebih lambat, jadi paceMin < paceMax
  const paceHit = paceValid
    ? actualMin >= result.paceMin && actualMin <= result.paceMax
    : false;

  // Status pace: terlalu cepat, dalam range, atau terlalu lambat
  // NOTE: kalau paceValid false (actualPace === '--:--' / data invalid), tetap
  // dianggap "tidak tercapai" lewat paceHit=false, dan ditandai sebagai
  // "terlalu lambat" (merah) secara default — supaya box tidak salah tampil
  // hijau/netral seperti sebelumnya.
  const paceTooFast = paceValid && actualMin < result.paceMin;
  const paceTooSlow = !paceValid || (paceValid && actualMin > result.paceMax);
  // (paceHit selalu false kalau !paceValid, jadi kombinasi ini konsisten:
  //  paceHit=false + paceTooSlow=true → box tampil merah, label "Terlalu lambat")

  const targetDist    = parseFloat(result.targetDistance);
  const distanceHit   = !isNaN(targetDist) && targetDist > 0
    ? result.actualDistance >= targetDist
    : false;
  const distanceDiff  = !isNaN(targetDist)
    ? Math.abs(result.actualDistance - targetDist).toFixed(2)
    : '-';

  return {
    hit: paceHit && distanceHit,
    paceHit,
    paceTooFast,
    paceTooSlow,
    distanceHit,
    distanceDiff,
  };
};

// ── Evaluasi hasil pace tunggal (Tempo / Interval) ──────────────────────────
const compareResult = (result: PaceResult) => {
  const targetMin = parseFloat(result.targetPace);
  const parts     = result.actualPace.split(':');
  const paceValid = !isNaN(targetMin) && parts.length === 2 && result.actualPace !== '--:--';

  let paceHit = false;
  let paceDiff = '-';

  if (paceValid) {
    const targetSec = targetMin * 60;
    const actualSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    const diffSec   = Math.abs(actualSec - targetSec);
    const diffMin   = Math.floor(diffSec / 60);
    const diffSecRem = Math.round(diffSec % 60);
    paceDiff = `${diffMin}:${diffSecRem < 10 ? '0' : ''}${diffSecRem}`;
    paceHit  = actualSec <= targetSec;
  }

  const targetDist   = parseFloat(result.targetDistance);
  let distanceHit    = false;
  let distanceDiff   = '-';

  if (!isNaN(targetDist) && targetDist > 0) {
    distanceDiff = Math.abs(result.actualDistance - targetDist).toFixed(2);
    distanceHit  = result.actualDistance >= targetDist;
  }

  return { hit: paceHit && distanceHit, paceHit, distanceHit, paceDiff, distanceDiff };
};

const formatTargetPace = (pace: string): string => {
  const p = parseFloat(pace);
  if (isNaN(p)) return `${pace}/km`;
  const m = Math.floor(p);
  const s = Math.round((p - m) * 60);
  return `${m}:${s < 10 ? '0' : ''}${s}/km`;
};

const formatDuration = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

type ComparisonBoxProps = {
  comparison: ReturnType<typeof compareResult>;
  targetPace: string;
  actualPace: string;
  targetDistance: string;
  actualDistance: number;
};

// ── Comparison box untuk single pace (Tempo/Interval) ───────────────────────
const ComparisonBox = ({ comparison, targetPace, actualPace, targetDistance, actualDistance }: ComparisonBoxProps) => (
  <View style={[styles.paceCompareBox, { backgroundColor: comparison.hit ? '#F0FFF4' : '#FFF5F5' }]}>
    <View style={styles.paceCompareRow}>
      <Ionicons
        name={comparison.hit ? 'checkmark-circle' : 'close-circle'}
        size={20} color={comparison.hit ? '#2E7D32' : '#FF3B30'}
      />
      <Text style={[styles.paceCompareTitle, { color: comparison.hit ? '#2E7D32' : '#FF3B30' }]}>
        {comparison.hit ? 'Semua Target Tercapai!' : 'Target Belum Tercapai'}
      </Text>
    </View>

    <View style={styles.paceCheckRow}>
      <Ionicons name={comparison.paceHit ? 'checkmark-circle' : 'close-circle'}
        size={13} color={comparison.paceHit ? '#2E7D32' : '#FF3B30'} />
      <Text style={styles.paceCheckLabel}>PACE</Text>
      <Text style={styles.paceCheckTarget}>{formatTargetPace(targetPace)}</Text>
      <Ionicons name="arrow-forward" size={11} color="#AAA" />
      <Text style={[styles.paceCheckActual, { color: comparison.paceHit ? '#2E7D32' : '#FF3B30' }]}>
        {actualPace}/km
      </Text>
      {!comparison.paceHit && comparison.paceDiff !== '-' && (
        <View style={styles.diffBadge}>
          <Text style={styles.diffBadgeText}>+{comparison.paceDiff}</Text>
        </View>
      )}
    </View>

    <View style={styles.paceCheckRow}>
      <Ionicons name={comparison.distanceHit ? 'checkmark-circle' : 'close-circle'}
        size={13} color={comparison.distanceHit ? '#2E7D32' : '#FF3B30'} />
      <Text style={styles.paceCheckLabel}>JARAK</Text>
      <Text style={styles.paceCheckTarget}>{targetDistance} km</Text>
      <Ionicons name="arrow-forward" size={11} color="#AAA" />
      <Text style={[styles.paceCheckActual, { color: comparison.distanceHit ? '#2E7D32' : '#FF3B30' }]}>
        {actualDistance.toFixed(2)} km
      </Text>
      <View style={[styles.diffBadge, { backgroundColor: comparison.distanceHit ? '#E8F5E9' : '#FFE8E8' }]}>
        <Text style={[styles.diffBadgeText, { color: comparison.distanceHit ? '#2E7D32' : '#FF3B30' }]}>
          {comparison.distanceHit ? '+' : '-'}{comparison.distanceDiff} km
        </Text>
      </View>
    </View>
  </View>
);

// ── Comparison box untuk range pace (Easy Run / Long Run) ───────────────────
const PaceRangeComparisonBox = ({
  result,
  comparison,
}: {
  result: PaceRangeResult;
  comparison: ReturnType<typeof compareRangeResult>;
}) => {
  const paceMinStr = formatPaceDisplay(result.paceMin);
  const paceMaxStr = formatPaceDisplay(result.paceMax);

  // Warna & label status pace
  let paceColor  = '#2E7D32';
  let paceStatus = 'Dalam range ✓';
  if (comparison.paceTooFast) { paceColor = '#007AFF'; paceStatus = 'Terlalu cepat'; }
  if (comparison.paceTooSlow) { paceColor = '#FF3B30'; paceStatus = 'Terlalu lambat'; }

  return (
    <View style={[styles.paceCompareBox, { backgroundColor: comparison.hit ? '#F0FFF4' : '#FFF5F5' }]}>
      {/* Header */}
      <View style={styles.paceCompareRow}>
        <Ionicons
          name={comparison.hit ? 'checkmark-circle' : 'close-circle'}
          size={20} color={comparison.hit ? '#2E7D32' : '#FF3B30'}
        />
        <Text style={[styles.paceCompareTitle, { color: comparison.hit ? '#2E7D32' : '#FF3B30' }]}>
          {comparison.hit ? 'Semua Target Tercapai!' : 'Target Belum Tercapai'}
        </Text>
      </View>

      {/* Pace row — tampilkan range vs actual */}
      <View style={styles.paceCheckRow}>
        <Ionicons
          name={comparison.paceHit ? 'checkmark-circle' : 'close-circle'}
          size={13} color={comparison.paceHit ? '#2E7D32' : paceColor}
        />
        <Text style={styles.paceCheckLabel}>PACE</Text>
        {/* Range target */}
        <Text style={styles.paceCheckTarget}>{paceMinStr}–{paceMaxStr}/km</Text>
        <Ionicons name="arrow-forward" size={11} color="#AAA" />
        {/* Actual */}
        <Text style={[styles.paceCheckActual, { color: comparison.paceHit ? '#2E7D32' : paceColor }]}>
          {result.actualPace}/km
        </Text>
        {!comparison.paceHit && (
          <View style={[styles.diffBadge, {
            backgroundColor: comparison.paceTooFast ? '#EBF5FF' : '#FFE8E8',
          }]}>
            <Text style={[styles.diffBadgeText, { color: paceColor }]}>
              {paceStatus}
            </Text>
          </View>
        )}
      </View>

      {/* Distance row */}
      <View style={styles.paceCheckRow}>
        <Ionicons name={comparison.distanceHit ? 'checkmark-circle' : 'close-circle'}
          size={13} color={comparison.distanceHit ? '#2E7D32' : '#FF3B30'} />
        <Text style={styles.paceCheckLabel}>JARAK</Text>
        <Text style={styles.paceCheckTarget}>{result.targetDistance} km</Text>
        <Ionicons name="arrow-forward" size={11} color="#AAA" />
        <Text style={[styles.paceCheckActual, { color: comparison.distanceHit ? '#2E7D32' : '#FF3B30' }]}>
          {result.actualDistance.toFixed(2)} km
        </Text>
        <View style={[styles.diffBadge, { backgroundColor: comparison.distanceHit ? '#E8F5E9' : '#FFE8E8' }]}>
          <Text style={[styles.diffBadgeText, { color: comparison.distanceHit ? '#2E7D32' : '#FF3B30' }]}>
            {comparison.distanceHit ? '+' : '-'}{comparison.distanceDiff} km
          </Text>
        </View>
      </View>

      {/* Panduan range */}
      <View style={styles.rangeGuide}>
        <View style={styles.rangeBar}>
          <View style={[styles.rangeBarFill, { backgroundColor: comparison.paceHit ? '#4CD964' : '#FF3B30' }]} />
        </View>
        <Text style={styles.rangeGuideText}>
          Target pace: {paceMinStr} – {paceMaxStr}/km
        </Text>
      </View>
    </View>
  );
};

export default function TodayWorkoutCard({
  workoutType = 'EASY RUN',
  workoutName = 'Workout Session',
  stats = [],
  status = 'planned',
  paceResult,
  paceRangeResult,
  tempoResult,
  intervalResult,
  onStartPress,
  onEdit,
  onDelete,
  startDisabled = false,
  isEmpty = false,
}: TodayWorkoutCardProps) {
  const [menuVisible,  setMenuVisible]  = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuBtnRef = useRef<RNView>(null);

  const handleMenuPress = () => {
    menuBtnRef.current?.measure((_fx, _fy, _w, _h, px, py) => {
      setMenuPosition({ top: py + _h + 4, right: 16 });
      setMenuVisible(true);
    });
  };

  const isCompleted    = status === 'completed';
  const isMissed       = status === 'missed';
  const paceComparison      = paceResult      ? compareResult(paceResult)           : null;
  const paceRangeComparison = paceRangeResult ? compareRangeResult(paceRangeResult) : null;
  const PHASE_COLORS   = ['#FF9500', '#2E7D32', '#007AFF'];

  // ── Status keseluruhan kartu: apakah target (pace + jarak) tercapai? ──────
  // Sebelumnya border kartu cuma cek `isCompleted`, jadi tetap hijau walau
  // target pace di luar range. Sekarang border ikut status pencapaian.
  const overallTargetHit: boolean | null = !isCompleted
    ? null
    : paceRangeComparison
      ? paceRangeComparison.hit
      : paceComparison
        ? paceComparison.hit
        : tempoResult
          ? tempoResult.phases.every((phase) => compareResult({
              targetPace: phase.targetPace,
              actualPace: phase.actualPace,
              targetDistance: phase.targetDistance,
              actualDistance: phase.actualDistance,
            }).hit)
          : intervalResult
            ? intervalResult.reps.every((r) => r.hit)
            : true; // tidak ada data pace/jarak untuk dibandingkan → netral (hijau)

  if (isEmpty) {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>?</Text>
        </View>
        <Text style={styles.emptyText}>Belum tersedia{'\n'}jadwal latihan</Text>
      </View>
    );
  }

  return (
    <>
      <View style={[
        styles.card,
        isCompleted && (overallTargetHit ? styles.cardCompleted : styles.cardMissedTarget),
      ]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.workoutTypeBadge}>
            <Text style={styles.workoutTypeText}>{workoutType}</Text>
          </View>
          <View style={styles.headerRight}>
            {isCompleted && (
              <View style={[styles.completedBadge, !overallTargetHit && styles.completedBadgeMissed]}>
                <Ionicons
                  name={overallTargetHit ? 'checkmark-circle' : 'close-circle'}
                  size={12}
                  color={overallTargetHit ? '#2E7D32' : '#FF3B30'}
                />
                <Text style={[
                  styles.completedBadgeText,
                  !overallTargetHit && styles.completedBadgeTextMissed,
                ]}>
                  {overallTargetHit ? 'Selesai' : 'Target Belum Tercapai'}
                </Text>
              </View>
            )}
            <View ref={menuBtnRef}>
              <TouchableOpacity onPress={handleMenuPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.menuDots}>•••</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.workoutName}>{workoutName}</Text>

        <View style={styles.statsRow}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Easy Run / Long Run — range comparison ── */}
        {isCompleted && paceRangeComparison && paceRangeResult && (
          <PaceRangeComparisonBox
            result={paceRangeResult}
            comparison={paceRangeComparison}
          />
        )}

        {/* ── Tempo / Interval — single pace comparison ── */}
        {isCompleted && paceComparison && paceResult && (
          <ComparisonBox
            comparison={paceComparison}
            targetPace={paceResult.targetPace}
            actualPace={paceResult.actualPace}
            targetDistance={paceResult.targetDistance}
            actualDistance={paceResult.actualDistance}
          />
        )}

        {/* Tempo Run — 3 fase */}
        {isCompleted && tempoResult && (
          <View style={styles.tempoBox}>
            {tempoResult.phases.map((phase, index) => {
              const phaseComparison = compareResult({
                targetPace: phase.targetPace,
                actualPace: phase.actualPace,
                targetDistance: phase.targetDistance,
                actualDistance: phase.actualDistance,
              });
              const phaseColor = PHASE_COLORS[index];
              return (
                <View key={index} style={[styles.tempoPhase, { borderLeftColor: phaseColor }]}>
                  <View style={styles.tempoPhaseHeader}>
                    <Text style={[styles.tempoPhaseLabel, { color: phaseColor }]}>{phase.label}</Text>
                    <View style={[styles.phaseStatusBadge, { backgroundColor: phaseComparison.hit ? '#F0FFF4' : '#FFF5F5' }]}>
                      <Ionicons
                        name={phaseComparison.hit ? 'checkmark-circle' : 'close-circle'}
                        size={12} color={phaseComparison.hit ? '#2E7D32' : '#FF3B30'}
                      />
                      <Text style={[styles.phaseStatusText, { color: phaseComparison.hit ? '#2E7D32' : '#FF3B30' }]}>
                        {phaseComparison.hit ? 'Tercapai' : 'Belum'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.paceCheckRow}>
                    <Ionicons name={phaseComparison.paceHit ? 'checkmark-circle' : 'close-circle'}
                      size={13} color={phaseComparison.paceHit ? '#2E7D32' : '#FF3B30'} />
                    <Text style={styles.paceCheckLabel}>PACE</Text>
                    <Text style={styles.paceCheckTarget}>{formatTargetPace(phase.targetPace)}</Text>
                    <Ionicons name="arrow-forward" size={11} color="#AAA" />
                    <Text style={[styles.paceCheckActual, { color: phaseComparison.paceHit ? '#2E7D32' : '#FF3B30' }]}>
                      {phase.actualPace}/km
                    </Text>
                    {!phaseComparison.paceHit && phaseComparison.paceDiff !== '-' && (
                      <View style={styles.diffBadge}>
                        <Text style={styles.diffBadgeText}>+{phaseComparison.paceDiff}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.paceCheckRow}>
                    <Ionicons name={phaseComparison.distanceHit ? 'checkmark-circle' : 'close-circle'}
                      size={13} color={phaseComparison.distanceHit ? '#2E7D32' : '#FF3B30'} />
                    <Text style={styles.paceCheckLabel}>JARAK</Text>
                    <Text style={styles.paceCheckTarget}>{phase.targetDistance} km</Text>
                    <Ionicons name="arrow-forward" size={11} color="#AAA" />
                    <Text style={[styles.paceCheckActual, { color: phaseComparison.distanceHit ? '#2E7D32' : '#FF3B30' }]}>
                      {phase.actualDistance.toFixed(2)} km
                    </Text>
                    <View style={[styles.diffBadge, { backgroundColor: phaseComparison.distanceHit ? '#E8F5E9' : '#FFE8E8' }]}>
                      <Text style={[styles.diffBadgeText, { color: phaseComparison.distanceHit ? '#2E7D32' : '#FF3B30' }]}>
                        {phaseComparison.distanceHit ? '+' : '-'}{phaseComparison.distanceDiff} km
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Interval Run — per rep */}
        {isCompleted && intervalResult && (
          <View style={styles.intervalBox}>
            <View style={styles.intervalSummary}>
              <Text style={styles.intervalSummaryTitle}>
                {intervalResult.reps.filter((r) => r.hit).length}/{intervalResult.reps.length} target tercapai
              </Text>
              <View style={styles.consistencyBar}>
                {intervalResult.reps.map((r, i) => (
                  <View key={i} style={[
                    styles.consistencyBlock,
                    { backgroundColor: r.hit ? '#4CD964' : '#FF3B30' },
                  ]} />
                ))}
              </View>
            </View>

            {intervalResult.reps.map((r) => (
              <View key={r.rep} style={[styles.repCard, { borderLeftColor: r.hit ? '#4CD964' : '#FF3B30' }]}>
                <View style={styles.repCardHeader}>
                  <Text style={styles.repCardNum}>REP {r.rep}</Text>
                  <View style={[styles.repCardBadge, { backgroundColor: r.hit ? '#F0FFF4' : '#FFF5F5' }]}>
                    <Ionicons
                      name={r.hit ? 'checkmark-circle' : 'close-circle'}
                      size={11} color={r.hit ? '#2E7D32' : '#FF3B30'}
                    />
                    <Text style={[styles.repCardBadgeText, { color: r.hit ? '#2E7D32' : '#FF3B30' }]}>
                      {r.hit ? 'Tercapai' : 'Belum'}
                    </Text>
                  </View>
                </View>
                <View style={styles.repCardStats}>
                  <View style={styles.repCardStat}>
                    <Text style={styles.repCardStatLabel}>JARAK</Text>
                    <Text style={styles.repCardStatValue}>{r.distance.toFixed(2)}km</Text>
                    <Text style={styles.repCardStatTarget}>target {intervalResult.targetDistance}km</Text>
                  </View>
                  <View style={styles.repCardStat}>
                    <Text style={styles.repCardStatLabel}>PACE</Text>
                    <Text style={[styles.repCardStatValue, { color: r.hit ? '#2E7D32' : '#FF3B30' }]}>
                      {r.pace}/km
                    </Text>
                    <Text style={styles.repCardStatTarget}>target {formatTargetPace(intervalResult.targetPace)}</Text>
                  </View>
                  <View style={styles.repCardStat}>
                    <Text style={styles.repCardStatLabel}>WAKTU</Text>
                    <Text style={styles.repCardStatValue}>{formatDuration(r.duration)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Button */}
        {isCompleted ? (
          overallTargetHit ? (
            <View style={styles.completedBtn}>
              <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
              <Text style={styles.completedBtnText}>Latihan Selesai</Text>
            </View>
          ) : (
            <View style={styles.completedBtnMissed}>
              <Ionicons name="close-circle" size={18} color="#FF3B30" />
              <Text style={styles.completedBtnMissedText}>Selesai, Target Belum Tercapai</Text>
            </View>
          )
        ) : isMissed ? (
          <View style={styles.missedBtn}>
            <Ionicons name="alert-circle" size={18} color="#E65100" />
            <Text style={styles.missedBtnText}>Jadwal Terlewat</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.startButton, startDisabled && styles.startBtnDisabled]}
            onPress={onStartPress}
            disabled={startDisabled}
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonIcon}>▶</Text>
            <Text style={styles.startButtonText}>Start Training</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <View style={[styles.menuBox, { top: menuPosition.top, right: menuPosition.right }]}>
              {!isCompleted && (
                <>
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onEdit?.(); }}>
                    <Ionicons name="pencil-outline" size={16} color="#1A1A2E" />
                    <Text style={styles.menuItemText}>Edit</Text>
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                </>
              )}
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onDelete?.(); }}>
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  emptyIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
  },
  emptyIconText:  { fontSize: 18, fontWeight: '700', color: '#AAAAAA' },
  emptyText:      { fontSize: 15, fontWeight: '600', color: '#1A1A2E', lineHeight: 22 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  cardCompleted:    { borderWidth: 1.5, borderColor: '#C8F5C8' },
  cardMissedTarget: { borderWidth: 1.5, borderColor: '#FFCDD2' },
  cardHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  workoutTypeBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  workoutTypeText: { fontSize: 12, fontWeight: '600', color: '#888', letterSpacing: 0.5 },
  headerRight:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FFF4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  completedBadgeMissed: { backgroundColor: '#FFF5F5' },
  completedBadgeText: { fontSize: 11, fontWeight: '600', color: '#2E7D32' },
  completedBadgeTextMissed: { color: '#FF3B30' },
  menuDots:   { fontSize: 14, color: '#888', letterSpacing: 1 },
  workoutName:{ fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 20, letterSpacing: -0.3 },
  statsRow:   { flexDirection: 'row', gap: 28, marginBottom: 20, flexWrap: 'wrap' },
  statItem:   { gap: 4 },
  statLabel:  { fontSize: 11, fontWeight: '600', color: '#999', letterSpacing: 0.5 },
  statValue:  { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },

  // Pace Compare (single)
  paceCompareBox:   { borderRadius: 12, padding: 14, marginBottom: 16, gap: 10 },
  paceCompareRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  paceCompareTitle: { fontSize: 13, fontWeight: '700' },
  paceCheckRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  paceCheckLabel:   { fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.5, width: 36 },
  paceCheckTarget:  { fontSize: 13, fontWeight: '600', color: '#888' },
  paceCheckActual:  { fontSize: 13, fontWeight: '800' },
  diffBadge:        { backgroundColor: '#FFE8E8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  diffBadgeText:    { fontSize: 11, fontWeight: '600', color: '#FF3B30' },

  // Range guide
  rangeGuide: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0F0F0', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, marginTop: 4,
  },
  rangeBar:     { width: 24, height: 6, borderRadius: 3, backgroundColor: '#DDD', overflow: 'hidden' },
  rangeBarFill: { width: '100%', height: '100%' },
  rangeGuideText: { fontSize: 11, color: '#888', fontWeight: '500' },

  // Tempo
  tempoBox:        { gap: 10, marginBottom: 16 },
  tempoPhase:      { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12, gap: 8, borderLeftWidth: 3 },
  tempoPhaseHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  tempoPhaseLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  phaseStatusBadge:{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  phaseStatusText: { fontSize: 10, fontWeight: '700' },

  // Interval
  intervalBox:       { gap: 8, marginBottom: 16 },
  intervalSummary:   { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 12, gap: 8 },
  intervalSummaryTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  consistencyBar:    { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  consistencyBlock:  { flex: 1, minWidth: 16, height: 8, borderRadius: 4 },
  repCard:           { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12, borderLeftWidth: 3, gap: 8 },
  repCardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  repCardNum:        { fontSize: 13, fontWeight: '800', color: '#1A1A2E' },
  repCardBadge:      { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  repCardBadgeText:  { fontSize: 10, fontWeight: '700' },
  repCardStats:      { flexDirection: 'row', justifyContent: 'space-between' },
  repCardStat:       { alignItems: 'center', gap: 2 },
  repCardStatLabel:  { fontSize: 9, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 },
  repCardStatValue:  { fontSize: 14, fontWeight: '800', color: '#1A1A2E' },
  repCardStatTarget: { fontSize: 9, color: '#BBB' },

  // Buttons
  startButton: {
    backgroundColor: '#4CD964', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  startBtnDisabled:  { backgroundColor: '#E0E0E0' },
  startButtonIcon:   { fontSize: 14, color: '#1A1A2E' },
  startButtonText:   { fontSize: 16, fontWeight: '700', color: '#1A1A2E', letterSpacing: 0.2 },
  completedBtn: {
    backgroundColor: '#F0FFF4', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#C8F5C8',
  },
  completedBtnText: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
  completedBtnMissed: {
    backgroundColor: '#FFF5F5', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#FFCDD2',
  },
  completedBtnMissedText: { fontSize: 16, fontWeight: '700', color: '#FF3B30' },
  missedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFF3E0', borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: '#FFB74D',
  },
  missedBtnText: { fontSize: 16, fontWeight: '700', color: '#E65100' },
  menuOverlay:   { flex: 1 },
  menuBox: {
    position: 'absolute', backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingVertical: 4, minWidth: 140,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  menuItemText: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  menuDivider:  { height: 0.5, backgroundColor: '#EEEEEE', marginHorizontal: 12 },
});