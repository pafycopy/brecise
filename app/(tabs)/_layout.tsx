import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';

import { useWorkoutStore } from '@/store/supabaseWorkoutStore';
import { useProStore } from '@/store/proStore';
import BannerAdComponent from '@/components/ui/ads/bannerads';

const Tabslayout = () => {
  const fetchWorkouts = useWorkoutStore((s) => s.fetchWorkouts);
  const isPro = useProStore((s) => s.isPro);

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
      tabBar={(props: BottomTabBarProps) => (
        <View>
          {!isPro && <BannerAdComponent />}
          <BottomTabBar {...props} />
        </View>
      )}
    >
      {/* ✅ FIX: "name" di Tabs.Screen harus sama persis dengan nama file
          route di folder (tabs), bukan judul bebas. File aslinya bernama
          dashboard.tsx, education.tsx, training.tsx, profile.tsx — sebelumnya
          ditulis "HOME"/"EDU"/"PLAN" yang tidak match nama file manapun,
          makanya Expo Router warning "No route named ... exists". */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="education"
        options={{
          title: 'Edu',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="training"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
};

export default Tabslayout;