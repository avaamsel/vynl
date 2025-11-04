import { Tabs } from 'expo-router';
import React from 'react';

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
          paddingHorizontal: 0,
          minWidth: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Poppins',
          fontWeight: '400',
          marginTop: 4,
          width: '100%',
          textAlign: 'center',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 90,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingHorizontal: 0,
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
        name="playlists"
        options={{
          title: 'Playlists',
          tabBarIcon: ({ focused }) => (
            <Ionicons name="musical-notes" size={22} color="#3b4f7d" />
          ),
        }}
      />
      <Tabs.Screen
        name="swipe"
        options={{
          title: 'Swipe',
          tabBarIcon: ({ focused }) => (
            <Ionicons name="swap-horizontal" size={22} color="#3b4f7d" />
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
