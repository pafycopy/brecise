import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => { 
    // Kalau landing di route kosong (dari OAuth callback), 
    // biarkan _layout.tsx yang handle routing
    router.replace('/');
  }, []);

  return null;
}