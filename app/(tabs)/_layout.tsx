import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useWorkoutStore } from '@/store/supabaseWorkoutStore';

const Tabslayout = () => {

  // ✅ pindah ke dalam component
  const fetchWorkouts = useWorkoutStore(
    (s) => s.fetchWorkouts
  );

  // ✅ aman
  useEffect(() => {
    fetchWorkouts();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: '#006E2F',
        tabBarInactiveTintColor: '#191C1E',

        tabBarStyle: {
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >

      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="education"
        options={{
          title: 'education',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="library"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="training"
        options={{
          title: 'training',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="barbell"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person"
              color={color}
              size={size}
            />
          ),
        }}
      />

    </Tabs>
  );
};

export default Tabslayout;