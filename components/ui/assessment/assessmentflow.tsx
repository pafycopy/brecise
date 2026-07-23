import React, { useState } from 'react';
import { Modal } from 'react-native';
import { useRouter } from 'expo-router';
import AssessmentScreen from '@/components/ui/assessment/assessmentscreen';
import ProgramResultScreen from '@/components/ui/assessment/programresultscreen';
import { useAssessmentStore, AssessmentData } from '@/store/assessmentStore';
import { useWorkoutStore } from '@/store/supabaseWorkoutStore';
import { useProStore } from '@/store/proStore';
import { showInterstitialAd } from '@/services/interstitialAdService';
import { GeneratedDay } from '@/utils/generateProgram';

type Props = {
  visible: boolean;
  // Dipanggil saat user MENOLAK / keluar dari assessment sebelum selesai
  // (tombol close di step 1, atau hardware back). Akan diarahkan ke dashboard.
  onClose: () => void;
  // Dipanggil saat assessment SELESAI & program berhasil dibuat.
  // Cuma menyembunyikan modal — TIDAK mengarahkan ke dashboard, karena
  // setelah ini AssessmentFlow sendiri yang push ke halaman Plan (training).
  onDone: () => void;
};

type FlowStep = 'assessment' | 'result';

export default function AssessmentFlow({ visible, onClose, onDone }: Props) {
  const router = useRouter();
  const { setAssessment } = useAssessmentStore();
  const { addWorkout, clearGeneratedWorkouts } = useWorkoutStore();
  const isPro = useProStore((s) => s.isPro);

  const [flowStep,       setFlowStep]       = useState<FlowStep>('assessment');
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);

  const handleAssessmentComplete = (data: AssessmentData) => {
    setAssessmentData(data);
    setFlowStep('result');
  };

  const handleConfirmProgram = async (days: GeneratedDay[]) => {
    if (!assessmentData) return;

    // Simpan assessment ke store lokal + Supabase (otomatis karena setAssessment sudah diupdate)
    await setAssessment(assessmentData);

    // Hapus program lama yang di-generate sebelumnya (manual workout tetap aman)
    await clearGeneratedWorkouts();

    // Masukkan semua workout ke workoutStore
    days.forEach(({ dateKey, workout }) => {
      addWorkout(dateKey, workout);
    });

    // Reset flow
    setFlowStep('assessment');
    // ✅ FIX: dulu di sini manggil onClose() — itu sama dengan handler yang
    // dipakai buat "menolak" assessment, yang juga menjadwalkan
    // router.replace ke dashboard 300ms kemudian. Akibatnya, push ke
    // training di bawah ini sempat kejadian, tapi 300ms kemudian ketimpa
    // balik ke dashboard oleh timer dari onClose. Sekarang pakai onDone()
    // yang cuma menyembunyikan modal tanpa menjadwalkan redirect apa pun.
    onDone();

    if (!isPro) {
      showInterstitialAd();
    }

    // Arahkan ke tab training (Plan) agar user langsung lihat program
    router.push('/(tabs)/training');
  };

  const handleBack = () => {
    if (flowStep === 'result') {
      setFlowStep('assessment');
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleBack}
    >
      {flowStep === 'assessment' && (
        <AssessmentScreen onComplete={handleAssessmentComplete} onClose={onClose} />
      )}

      {flowStep === 'result' && assessmentData && (
        <ProgramResultScreen
          assessment={assessmentData}
          onConfirm={handleConfirmProgram}
        />
      )}
    </Modal>
  );
}