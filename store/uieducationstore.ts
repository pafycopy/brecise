import { create } from 'zustand';

// Store kecil untuk komunikasi antar tab
// Dashboard set topicId (+ lessonId opsional) → Education screen baca,
// buka modal topic yang sesuai, dan auto-scroll ke lesson yang dimaksud
// (kalau lessonId dikasih — misalnya dari tips card "Butt Kicks" di dashboard).
type UIEducationStore = {
  pendingTopicId: number | null;
  pendingLessonId: number | null;
  openTopic: (id: number, lessonId?: number) => void;
  clearPendingTopic: () => void;
  clearPendingLesson: () => void;
};

export const useUIEducationStore = create<UIEducationStore>((set) => ({
  pendingTopicId: null,
  pendingLessonId: null,
  openTopic: (id, lessonId) =>
    set({ pendingTopicId: id, pendingLessonId: lessonId ?? null }),
  clearPendingTopic: () => set({ pendingTopicId: null }),
  clearPendingLesson: () => set({ pendingLessonId: null }),
}));