import { create } from 'zustand';

// Store kecil untuk komunikasi antar tab
// Dashboard set topicId → Education screen baca dan buka modal
type UIEducationStore = {
  pendingTopicId: number | null;
  openTopic: (id: number) => void;
  clearPendingTopic: () => void;
};

export const useUIEducationStore = create<UIEducationStore>((set) => ({
  pendingTopicId: null,
  openTopic: (id) => set({ pendingTopicId: id }),
  clearPendingTopic: () => set({ pendingTopicId: null }),
}));