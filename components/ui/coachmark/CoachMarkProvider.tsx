import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, LayoutRectangle, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type CoachMarkStep = {
  id: string;
  title: string;
  description: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingSide?: number;
  offsetY?: number;
  offsetX?: number;
  forceTooltipPosition?: 'above' | 'below';
  tooltipOffsetY?: number;
};

type TargetEntry = { ref: React.RefObject<View | null> };
type ScrollEntry = { ref: React.RefObject<ScrollView | null>; offsetRef: React.MutableRefObject<number> };

type StartTourOptions = {
  scrollViewId?: string;
  onFinish?: () => void;
};

type CoachMarkContextType = {
  registerTarget: (id: string, ref: React.RefObject<View | null>) => void;
  unregisterTarget: (id: string) => void;
  registerScrollView: (id: string, ref: React.RefObject<ScrollView | null>, offsetRef: React.MutableRefObject<number>) => void;
  unregisterScrollView: (id: string) => void;
  startTour: (tourId: string, steps: CoachMarkStep[], opts?: StartTourOptions) => void;
  notifyLayout: (id: string) => void;
};

const CoachMarkContext = createContext<CoachMarkContextType | null>(null);

export const useCoachMark = () => {
  const ctx = useContext(CoachMarkContext);
  if (!ctx) throw new Error('useCoachMark harus dipakai di dalam <CoachMarkProvider>');
  return ctx;
};

const SCREEN = Dimensions.get('window');

const DEFAULT_PADDING_SIDE   = 8;
const DEFAULT_PADDING_TOP    = 8;
const DEFAULT_PADDING_BOTTOM = 20;

const TOP_SAFE_ZONE    = 110;
const BOTTOM_SAFE_ZONE = 260;

const SAFETY_RECHECK_DELAYS_MS = [300, 900];

const measure = (ref: React.RefObject<View | null>): Promise<LayoutRectangle | null> =>
  new Promise((resolve) => {
    if (!ref.current) return resolve(null);
    ref.current.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) resolve(null);
      else resolve({ x, y, width, height });
    });
  });

// ✅ FIX: di New Architecture (Fabric — default di Expo SDK 54),
// measureLayout gak nerima node handle angka dari findNodeHandle() lagi
// buat parameter "relative to" — harus ref komponen native-nya langsung.
// Jadi scrollRef.current dikasih apa adanya, bukan lewat findNodeHandle.
const measureRelativeToScrollContent = (
  targetRef: React.RefObject<View | null>,
  scrollRef: React.RefObject<ScrollView | null>,
): Promise<number | null> =>
  new Promise((resolve) => {
    if (!targetRef.current || !scrollRef.current) return resolve(null);
    targetRef.current.measureLayout(
      // @ts-ignore - ScrollView instance valid dipakai langsung sebagai
      // native ref tujuan di measureLayout (Fabric), walau tipe TS-nya
      // gak selalu pas nunjukkin ini.
      scrollRef.current,
      (_x: number, y: number) => resolve(y),
      () => resolve(null),
    );
  });

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const layoutsEqual = (a: LayoutRectangle | null, b: LayoutRectangle | null) => {
  if (!a || !b) return a === b;
  return Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1
    && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1;
};

export function CoachMarkProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  const targetsRef        = useRef<Record<string, TargetEntry>>({});
  const scrollsRef        = useRef<Record<string, ScrollEntry>>({});
  const onFinishRef       = useRef<(() => void) | null>(null);
  const activeScrollIdRef = useRef<string | null>(null);
  const runIdRef          = useRef(0);
  const currentStepIdRef  = useRef<string | null>(null);
  const layoutDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [steps, setSteps]               = useState<CoachMarkStep[]>([]);
  const [stepIndex, setStepIndex]       = useState(0);
  const [activeLayout, setActiveLayout] = useState<LayoutRectangle | null>(null);
  const [isMeasuring, setIsMeasuring]   = useState(false);

  const registerTarget = useCallback((id: string, ref: React.RefObject<View | null>) => {
    targetsRef.current[id] = { ref };
  }, []);
  const unregisterTarget = useCallback((id: string) => {
    delete targetsRef.current[id];
  }, []);

  const registerScrollView = useCallback((
    id: string,
    ref: React.RefObject<ScrollView | null>,
    offsetRef: React.MutableRefObject<number>,
  ) => {
    scrollsRef.current[id] = { ref, offsetRef };
  }, []);
  const unregisterScrollView = useCallback((id: string) => {
    delete scrollsRef.current[id];
  }, []);

  const clearSafetyTimers = useCallback(() => {
    safetyTimersRef.current.forEach(clearTimeout);
    safetyTimersRef.current = [];
  }, []);

  const measureCurrentStep = useCallback(async (runId: number, stepId: string, silent = false) => {
    if (!silent) setIsMeasuring(true);
    const entry = targetsRef.current[stepId];
    if (!entry) { if (runIdRef.current === runId) { setIsMeasuring(false); setActiveLayout(null); } return; }

    let layout = await measure(entry.ref);
    if (!layout) {
      await wait(150);
      if (runIdRef.current !== runId) return;
      layout = await measure(entry.ref);
    }
    if (!layout) { if (runIdRef.current === runId) { setIsMeasuring(false); setActiveLayout(null); } return; }

    const scrollId    = activeScrollIdRef.current;
    const scrollEntry = scrollId ? scrollsRef.current[scrollId] : null;

    if (scrollEntry?.ref.current) {
      const tooHigh = layout.y < TOP_SAFE_ZONE;
      const tooLow  = layout.y + layout.height > SCREEN.height - BOTTOM_SAFE_ZONE;

      if (tooHigh || tooLow) {
        const desiredTop = tooHigh
          ? TOP_SAFE_ZONE + 20
          : SCREEN.height - BOTTOM_SAFE_ZONE - layout.height - 20;

        const [contentY, scrollWindowLayout] = await Promise.all([
          measureRelativeToScrollContent(entry.ref, scrollEntry.ref),
          measure(scrollEntry.ref as unknown as React.RefObject<View | null>),
        ]);

        if (runIdRef.current !== runId) return;

        if (contentY !== null && scrollWindowLayout) {
          const scrollWindowTop = scrollWindowLayout.y;
          const nextOffset = Math.max(0, contentY - (desiredTop - scrollWindowTop));

          scrollEntry.ref.current.scrollTo({ y: nextOffset, animated: false });

          let prevY: number | null = null;
          for (let i = 0; i < 4; i++) {
            await wait(50);
            if (runIdRef.current !== runId) return;

            const m = await measure(entry.ref);
            if (!m) break;

            layout = m;
            if (prevY !== null && Math.abs(m.y - prevY) < 1) break;
            prevY = m.y;
          }
        }
      }
    }

    if (runIdRef.current !== runId) return;

    setActiveLayout((prev) => (silent && layoutsEqual(prev, layout) ? prev : layout));
    setIsMeasuring(false);
  }, []);

  const scheduleSafetyRechecks = useCallback((runId: number, stepId: string) => {
    clearSafetyTimers();
    SAFETY_RECHECK_DELAYS_MS.forEach((delay) => {
      const t = setTimeout(() => {
        if (runIdRef.current !== runId) return;
        if (currentStepIdRef.current !== stepId) return;
        measureCurrentStep(runId, stepId, true);
      }, delay);
      safetyTimersRef.current.push(t);
    });
  }, [clearSafetyTimers, measureCurrentStep]);

  const notifyLayout = useCallback((_id: string) => {
    if (!activeTourId) return;
    const stepId = currentStepIdRef.current;
    if (!stepId) return;

    if (layoutDebounceRef.current) clearTimeout(layoutDebounceRef.current);
    layoutDebounceRef.current = setTimeout(() => {
      measureCurrentStep(runIdRef.current, stepId, true);
    }, 60);
  }, [activeTourId, measureCurrentStep]);

  const startTour = useCallback((tourId: string, tourSteps: CoachMarkStep[], opts?: StartTourOptions) => {
    runIdRef.current += 1;
    activeScrollIdRef.current = opts?.scrollViewId ?? null;
    onFinishRef.current = opts?.onFinish ?? null;
    setActiveLayout(null);
    setActiveTourId(tourId);
    setSteps(tourSteps);
    setStepIndex(0);
  }, []);

  const endTour = useCallback(() => {
    runIdRef.current += 1;
    clearSafetyTimers();
    setActiveTourId(null);
    setSteps([]);
    setStepIndex(0);
    setActiveLayout(null);
    activeScrollIdRef.current = null;
    onFinishRef.current?.();
    onFinishRef.current = null;
  }, [clearSafetyTimers]);

  useEffect(() => {
    currentStepIdRef.current = steps[stepIndex]?.id ?? null;
    if (!activeTourId || !steps[stepIndex]) return;

    const runId  = runIdRef.current;
    const stepId = steps[stepIndex].id;

    measureCurrentStep(runId, stepId).then(() => {
      scheduleSafetyRechecks(runId, stepId);
    });

    return () => clearSafetyTimers();
  }, [activeTourId, stepIndex, steps, measureCurrentStep, scheduleSafetyRechecks, clearSafetyTimers]);

  const currentStep = steps[stepIndex];

  const goNext = () => {
    setActiveLayout(null);
    if (stepIndex >= steps.length - 1) endTour();
    else setStepIndex((i) => i + 1);
  };

  return (
    <CoachMarkContext.Provider
      value={{ registerTarget, unregisterTarget, registerScrollView, unregisterScrollView, startTour, notifyLayout }}
    >
      {children}
      {activeTourId && currentStep && activeLayout && !isMeasuring && (
        <CoachMarkOverlay
          step={currentStep}
          stepIndex={stepIndex}
          totalSteps={steps.length}
          target={activeLayout}
          insetsTop={insets.top}
          onNext={goNext}
          onSkip={endTour}
        />
      )}
    </CoachMarkContext.Provider>
  );
}

function CoachMarkOverlay({
  step, stepIndex, totalSteps, target, insetsTop, onNext, onSkip,
}: {
  step: CoachMarkStep;
  stepIndex: number;
  totalSteps: number;
  target: LayoutRectangle;
  insetsTop: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const paddingSide   = step.paddingSide   ?? DEFAULT_PADDING_SIDE;
  const paddingTop    = step.paddingTop    ?? DEFAULT_PADDING_TOP;
  const paddingBottom = step.paddingBottom ?? DEFAULT_PADDING_BOTTOM;
  const offsetX       = step.offsetX ?? 0;
  const offsetY       = step.offsetY ?? 0;

  const box = {
    x: Math.max(target.x - paddingSide + offsetX, 0),
    y: Math.max(target.y - paddingTop + offsetY, 0),
    width: target.width + paddingSide * 2,
    height: target.height + paddingTop + paddingBottom,
  };

  const spaceBelow = SCREEN.height - (box.y + box.height);

  const tooltipBelow = step.forceTooltipPosition
    ? step.forceTooltipPosition === 'below'
    : spaceBelow > 160;

  const tooltipOffsetY = step.tooltipOffsetY ?? 0;

  const tooltipTop = tooltipOffsetY + (
    tooltipBelow
      ? box.y + box.height + 16
      : Math.max(box.y - 16, insetsTop + 16)
  );

  const isLast = stepIndex === totalSteps - 1;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[styles.mask, { top: 0, left: 0, right: 0, height: box.y }]} />
      <View style={[styles.mask, { top: box.y + box.height, left: 0, right: 0, bottom: 0 }]} />
      <View style={[styles.mask, { top: box.y, left: 0, width: box.x, height: box.height }]} />
      <View style={[styles.mask, { top: box.y, left: box.x + box.width, right: 0, height: box.height }]} />

      <View
        pointerEvents="none"
        style={[styles.highlightBorder, { top: box.y, left: box.x, width: box.width, height: box.height }]}
      />

      <View style={[styles.tooltip, tooltipBelow ? { top: tooltipTop } : { bottom: SCREEN.height - tooltipTop }]}>
        <Text style={styles.tooltipTitle}>{step.title}</Text>
        <Text style={styles.tooltipDesc}>{step.description}</Text>

        <View style={styles.tooltipFooter}>
          <View style={styles.dots}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.tooltipActions}>
            <TouchableOpacity onPress={onSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.skipText}>Lewati</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>{isLast ? 'SELESAI' : 'LANJUT'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mask: { position: 'absolute', backgroundColor: 'rgba(17,17,17,0.75)' },
  highlightBorder: {
    position: 'absolute', borderRadius: 16,
    borderWidth: 2.5, borderColor: '#2E7D32',
  },
  tooltip: {
    position: 'absolute', left: 20, right: 20,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18,
  },
  tooltipTitle: { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 6, fontFamily: 'Lexend-Black' },
  tooltipDesc:  { fontSize: 13, lineHeight: 19, color: '#555', marginBottom: 16, fontFamily: 'Lexend-Regular' },
  tooltipFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots:      { flexDirection: 'row', gap: 5 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DDD' },
  dotActive: { backgroundColor: '#2E7D32', width: 16 },
  tooltipActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  skipText:  { fontSize: 13, color: '#999', fontWeight: '600', fontFamily: 'Lexend-Bold' },
  nextBtn:   { backgroundColor: '#2E7D32', borderRadius: 20, paddingVertical: 9, paddingHorizontal: 18 },
  nextBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5, fontFamily: 'Lexend-Black' },
});