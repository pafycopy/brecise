import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

const EducationHero = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edukasi Berlari</Text>

      <Text style={styles.description}>
        Kuasai dasar-dasarnya dan berlari dengan lebih kuat.
      </Text>

      <TouchableOpacity style={styles.button}>
        <Ionicons name="play" size={14} color="#fff" />

        <Text style={styles.buttonText}>Featured Video</Text>
      </TouchableOpacity>
    </View>
  )
}

export default EducationHero

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginBottom: 16,
  },

  button: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#0F7B42',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
})