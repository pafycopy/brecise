import { useEffect, useRef } from 'react';
import { ScrollView, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useCoachMark } from './CoachMarkProvider';

// Pasang di layar manapun yang isinya di dalam ScrollView dan mau
// dukung auto-scroll pas coach mark aktif. Contoh:
//
//   const { scrollRef, onScroll } = useCoachMarkScrollView('dashboard');
//   <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16}>
//
// lalu waktu startTour, kasih scrollViewId: 'dashboard' yang SAMA.
export function useCoachMarkScrollView(id: string) {
  const { registerScrollView, unregisterScrollView } = useCoachMark();
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    registerScrollView(id, scrollRef, offsetRef);
    return () => unregisterScrollView(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = e.nativeEvent.contentOffset.y;
  };

  return { scrollRef, onScroll };
}