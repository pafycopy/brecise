import React, { useState } from 'react';
import { Modal } from 'react-native';
import { useRouter } from 'expo-router';
import AssessmentScreen from '@/components/ui/assessment/assessmentscreen';
import ProgramResultScreen from '@/components/ui/assessment/programresultscreen';
import { useAssessmentStore, AssessmentData } from '@/store/assessmentStore';
import { useWorkoutStore } from '@/store/supabaseWorkoutStore';
import { GeneratedDay } from '@/utils/generateProgram';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type FlowStep = 'assessment' | 'result';

export default function AssessmentFlow({ visible, onClose }: Props) {
  const router = useRouter();
  const { setAssessment } = useAssessmentStore();
  const { addWorkout, clearGeneratedWorkouts } = useWorkoutStore();

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
    onClose();

    // Arahkan ke tab training agar user langsung lihat program
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
        <AssessmentScreen onComplete={handleAssessmentComplete} />
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