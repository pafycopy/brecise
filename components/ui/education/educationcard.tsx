import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

type Props = {
  title: string
  description: string
  icon: any
  color: string
  onPress?: () => void
}

const EducationCard = ({ title, description, icon, color, onPress }: Props) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardInner}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={18} color="#111" />
        </View>

        <View style={styles.textArea}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        {/* Chevron */}
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={16} color="#BBB" />
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default EducationCard

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardInner: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  textArea: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700', fontFamily: 'Lexend-Bold',
    color: '#111',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 20, fontFamily: 'Lexend-Regular',
    color: '#777',
  },
  chevron: {
    marginTop: 4,
    flexShrink: 0,
  },
})