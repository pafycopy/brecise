import { useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';

const successSound = require('@/assets/sounds/success.mp3');

export function useStartSound() {
  const player = useAudioPlayer(successSound);

  const playStartSound = async () => {
    try {
      player.seekTo(0);
      player.play();
    } catch (err) {
      console.warn('[useStartSound] gagal putar suara:', err);
    }
  };

  return { playStartSound };
}