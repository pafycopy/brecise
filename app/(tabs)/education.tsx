import { StyleSheet, View, ScrollView, Modal } from 'react-native'
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useFocusEffect } from '@react-navigation/native'

import Header from '@/components/header'
import { Colors } from '@/constants/theme'

import EducationCard from '@/components/ui/education/educationcard'
import EducationHero from '@/components/ui/education/educationhero'

import RunningTechniqueScreen from '@/components/ui/education/runningtechniquescreen'
import InjuryPreventionScreen from '@/components/ui/education/injurypreventionscreen'
import WarmupScreen from '@/components/ui/education/warmupscreen'
import StrengthScreen from '@/components/ui/education/strengthscreen'

import { educationData, EducationTopic } from '@/constants/educationdata'
import { useUIEducationStore } from '@/store/uieducationstore'

// ✅ coach mark / spotlight tutorial
import { useCoachMark, CoachMarkStep } from '@/components/ui/coachmark/CoachMarkProvider'
import CoachMarkTarget from '@/components/ui/coachmark/CoachMarkTarget'
import { useCoachMarkScrollView } from '@/components/ui/coachmark/useCoachMarkScrollView'
import { useCoachMarkStore } from '@/store/coachMarkStore'

// Prefix id buat tiap card, biar gampang dibedain dari id topic aslinya.
// Format: `education-card-${topic.id}`
const cardStepId = (topicId: string | number) => `education-card-${topicId}`

const Education = () => {
  const [selectedTopic, setSelectedTopic] = useState<EducationTopic | null>(null)
  // ✅ lesson yang perlu di-auto-scroll begitu selectedTopic ini kebuka
  // (diisi dari tips card di dashboard, mis. buka topic 3 lalu scroll ke
  // lesson "Butt Kicks"). Disimpan di local state (bukan langsung baca dari
  // store) supaya nilainya gak keburu ke-reset pas clearPendingLesson()
  // dipanggil di effect yang sama.
  const [scrollToLessonId, setScrollToLessonId] = useState<number | null>(null)
  const { pendingTopicId, pendingLessonId, clearPendingTopic, clearPendingLesson } = useUIEducationStore()

  // Setiap kali tab ini aktif, cek apakah ada topic yang perlu dibuka
  useFocusEffect(
    useCallback(() => {
      if (pendingTopicId === null) return
      const topic = educationData.find((t) => t.id === pendingTopicId)
      const lessonId = pendingLessonId
      clearPendingTopic() // reset setelah dibaca
      clearPendingLesson()
      if (topic) {
        setSelectedTopic(topic)
        setScrollToLessonId(lessonId)
      }
    }, [pendingTopicId])
  )

  // Dipakai tiap kali layar topic ditutup, entah lewat tombol back di
  // screen-nya atau lewat hardware back Android — biar scrollToLessonId
  // gak "nyangkut" ke sesi buka-topic berikutnya yang manual (tanpa lessonId).
  const closeTopic = () => {
    setSelectedTopic(null)
    setScrollToLessonId(null)
  }

  const renderScreen = () => {
    if (!selectedTopic) return null
    switch (selectedTopic.type) {
      case 'running':
        return <RunningTechniqueScreen topic={selectedTopic} onBack={closeTopic} scrollToLessonId={scrollToLessonId} />
      case 'injury':
        return <InjuryPreventionScreen topic={selectedTopic} onBack={closeTopic} scrollToLessonId={scrollToLessonId} />
      case 'warmup':
        return <WarmupScreen topic={selectedTopic} onBack={closeTopic} scrollToLessonId={scrollToLessonId} />
      case 'strength':
        return <StrengthScreen topic={selectedTopic} onBack={closeTopic} scrollToLessonId={scrollToLessonId} />
      default:
        return null
    }
  }

  // ✅ coach mark setup
  const { startTour } = useCoachMark()
  const hasSeenTour  = useCoachMarkStore((s) => s.hasSeenTour)
  const markTourSeen = useCoachMarkStore((s) => s.markTourSeen)
  const { scrollRef, onScroll } = useCoachMarkScrollView('education')

  // Step tour dibangun dinamis: 1 step buat hero, lalu 1 step per card
  // sesuai isi educationData. Kalau educationData berubah (nambah/kurang
  // topic), tour otomatis ngikutin tanpa perlu ubah kode di sini.
  const educationTourSteps = useMemo<CoachMarkStep[]>(() => {
    const steps: CoachMarkStep[] = [
      {
        id: 'education-hero',
        title: 'Materi Edukasi',
        description: 'Di sini kamu bisa belajar berbagai hal seputar lari — mulai dari teknik, pencegahan cedera, sampai pemanasan.',
        // ✅ hero nempel di paling atas scroll (langsung di bawah Header),
        // paddingTop default (8) bikin kotak nyerempet ke judul "Edukasi"
        // di header — dikecilin biar pas ke badan EducationHero aja.
        paddingTop: 2,
        paddingBottom: 6,
        offsetY: 30,
      },
    ]

    educationData.forEach((topic, index) => {
      steps.push({
        id: cardStepId(topic.id),
        title: topic.title,
        description: `Tap kartu ini untuk baca materi lengkap soal "${topic.title}".`,
        // ✅ card edukasi bentuknya rounded card polos (gak ada shadow
        // segede StatsRow), jadi padding kecil aja udah pas — default
        // sebelumnya (8/20/8) kegedean, keliatan dari kotak yang
        // "nyerempet" ke card/tombol di atasnya.
        paddingTop: 4,
        paddingBottom: 4,
        paddingSide: 4,
        offsetY: 30,
        forceTooltipPosition: 'above',
        tooltipOffsetY: -80,
        // Card pertama nempel persis di bawah tombol "Featured Video"
        // hero, kasih dikit lagi jarak biar gak nyerempet ke situ.
        ...(index === 0 ? { paddingTop: 8 } : {}),
      })
    })

    return steps
  }, [])

  useEffect(() => {
    if (hasSeenTour('education')) return
    const timer = setTimeout(() => {
      startTour('education', educationTourSteps, {
        scrollViewId: 'education',
        onFinish: () => markTourSeen('education'),
      })
    }, 700)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={styles.container}>
      <Header title="Edukasi" />

      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CoachMarkTarget id="education-hero">
          <EducationHero />
        </CoachMarkTarget>

        {educationData.map((topic) => (
          <CoachMarkTarget key={topic.id} id={cardStepId(topic.id)}>
            <EducationCard
              title={topic.title}
              description={topic.description}
              icon={topic.icon}
              color={topic.color}
              onPress={() => { setSelectedTopic(topic); setScrollToLessonId(null) }}
            />
          </CoachMarkTarget>
        ))}
      </ScrollView>

      <Modal
        visible={!!selectedTopic}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeTopic}
      >
        {renderScreen()}
      </Modal>
    </View>
  )
}

export default Education

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor:'#F8F9FA', },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
})