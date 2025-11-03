import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/src/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b4f7d',
        tabBarInactiveTintColor: '#3b4f7d',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => null,
        tabBarItemStyle: {
          paddingTop: 3,
          height: 38,
          paddingHorizontal: 0,
        },
        tabBarLabelStyle: {
          display: 'none', // Hide labels to match Figma design
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          backgroundColor: '#FFF8F5',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingHorizontal: 20,
          paddingBottom: 20,
          paddingTop: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Ionicons name="home" size={22} color="#3b4f7d" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <Ionicons name="search" size={22} color="#3b4f7d" />
          ),
        }}
      />
      <Tabs.Screen
        name="UploadSongs"
        options={{
          title: 'Shuffle',
          tabBarIcon: ({ focused }) => (
            <Ionicons name="shuffle" size={22} color="#3b4f7d" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Ionicons name="person" size={22} color="#3b4f7d" />
          ),
        }}
      />
    </Tabs>
  );
}
