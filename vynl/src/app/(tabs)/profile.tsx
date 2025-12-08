import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { supabase } from '@/src/utils/supabase';
import { useState, useCallback } from 'react';
import React from 'react';

const profileAvatar = require('../../../assets/images/logo-bw.png');

export default function ProfileScreen() {
  const [email, setEmail] = useState('Loading...');
  const [joinDate, setJoinDate] = useState('Loading...');
  const [playlistCount, setPlaylistCount] = useState(0);
  const [partyPlaylistCount, setPartyPlaylistCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error fetching user:', error);
      setEmail('Not available');
      setJoinDate('Not available');
      return;
    }

    if (data.user) {
      setEmail(data.user.email || 'No email');

      if (data.user.created_at) {
        const formatted = new Date(data.user.created_at).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric'
        });
        setJoinDate(formatted);
      }

      await fetchPlaylistCounts(data.user.id);
    }
  };

  const fetchPlaylistCounts = async (userId: string) => {
    try {
      const { count: totalCount, error: totalError } = await supabase
        .from('playlists')
        .select('*', { count: 'exact', head: true })
        .eq('uid', userId);

      if (totalError) {
        console.error('Error fetching total playlist count:', totalError);
      } else {
        setPlaylistCount(totalCount || 0);
      }

      const { count: partyCount, error: partyError } = await supabase
        .from('playlists')
        .select('*', { count: 'exact', head: true })
        .eq('uid', userId)
        .eq('in_party_mode', true);

      if (partyError) {
        console.error('Error fetching party playlist count:', partyError);
      } else {
        setPartyPlaylistCount(partyCount || 0);
      }
    } catch (err) {
      console.error('Unexpected error fetching playlist counts:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.topProfileCard}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.avatarWrapper}>
          <Image 
            source={profileAvatar}
            style={styles.avatarCircle}
          />
        </View>
      </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{playlistCount}</Text>
            <Text style={styles.statLabel}>Playlists Created</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{partyPlaylistCount}</Text>
            <Text style={styles.statLabel}>Party Playlists</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text> 
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>{joinDate}</Text> 
            </View>
          </View>
        </View>

        <View style={styles.buttonWrapper}>
          <Link href="/(tabs)/UserChoice" asChild>
            <TouchableOpacity style={styles.logoutButton}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  header: {
    marginHorizontal: 24,
    paddingHorizontal: 24,   
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#001133',
    fontFamily: 'AppleGaramond-Italic',
  },

  topProfileCard: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 16,
  },

  avatarWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },

  avatarSection: {
    marginHorizontal: 24,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 16,
  },

  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },

  username: {
    fontSize: 24,
    fontWeight: '600',
    color: '#001133',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },

  joinDate: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F28695',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },

  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#001133',
    fontFamily: 'Poppins',
    marginBottom: 12,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },

  infoLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },

  infoValue: {
    fontSize: 15,
    color: '#001133',
    fontFamily: 'Poppins',
    fontWeight: '500',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  buttonWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    marginTop: 8,
  },

  logoutButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F28695',
    shadowColor: '#F28695',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

