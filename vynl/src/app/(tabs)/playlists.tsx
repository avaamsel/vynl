import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@/src/hooks/use-user';
import { useUserPlaylists } from '@/src/hooks/use-playlist-for-user';
import { usePartyPlaylists } from '@/src/hooks/use-party-playlists';
import { useAuth } from '@/src/context/auth-context';

const PARTY_CODE_STORAGE_KEY = '@vynl:partyCode';

export default function PlaylistsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useUser();
  const { authToken } = useAuth();
  const uid = user?.id;
  
  const { playlists, loading: playlistLoading, error, refetch } = useUserPlaylists(uid ?? null);
  const { playlists: partyPlaylists, loading: partyLoading, error: partyError, refetch: refetchParty } = usePartyPlaylists(uid ?? null);
  const [activeView, setActiveView] = useState<'myPlaylists' | 'partyPlaylists'>('myPlaylists');
  const [activePartyPlaylistIds, setActivePartyPlaylistIds] = useState<Set<number>>(new Set());

  // Calculate bottom padding: tab bar height (90) + safe area bottom + extra padding
  // Tab bar is absolutely positioned at bottom, height 90px with paddingBottom 20px
  // We need enough space so content doesn't scroll under the tab bar
  // Using a larger fixed value to ensure content stays above the nav bar
  const bottomPadding = Math.max(90 + insets.bottom + 50, 150);
  
  // Check for active parties when component mounts or playlists change
  useEffect(() => {
    const checkActiveParties = async () => {
      try {
        const storedParties = await AsyncStorage.getItem(PARTY_CODE_STORAGE_KEY);
        if (storedParties) {
          let parties = JSON.parse(storedParties);
          
          // Handle migration from old format (single object) to new format (array)
          if (!Array.isArray(parties)) {
            parties = parties.playlistId ? [parties] : [];
          }
          
          // Extract all playlist IDs that have active parties
          const activeIds = new Set(parties.map((p: any) => parseInt(p.playlistId)));
          setActivePartyPlaylistIds(activeIds);
        } else {
          setActivePartyPlaylistIds(new Set());
        }
      } catch (error) {
        console.error('Error checking active parties:', error);
        setActivePartyPlaylistIds(new Set());
      }
    };
    checkActiveParties();
  }, [playlists]);

  useEffect(() => {
    if (!uid) return;
    
    if (activeView === 'myPlaylists' && refetch) {
      refetch();
    } else if (activeView === 'partyPlaylists' && refetchParty) {
      refetchParty();
    }
  }, [activeView, uid, refetch, refetchParty]);

  useFocusEffect(
    useCallback(() => {
      if (refetch && uid) {
        console.log("Screen focused, refreshing playlists...");
        refetch();
      }
      // Check for active parties when screen comes into focus
      const checkActiveParties = async () => {
        try {
          const storedParties = await AsyncStorage.getItem(PARTY_CODE_STORAGE_KEY);
          if (storedParties) {
            let parties = JSON.parse(storedParties);
            
            // Handle migration from old format (single object) to new format (array)
            if (!Array.isArray(parties)) {
              parties = parties.playlistId ? [parties] : [];
            }
            
            // Extract all playlist IDs that have active parties
            const activeIds = new Set(parties.map((p: any) => parseInt(p.playlistId)));
            setActivePartyPlaylistIds(activeIds);
          } else {
            setActivePartyPlaylistIds(new Set());
          }
        } catch (error) {
          console.error('Error checking active parties:', error);
          setActivePartyPlaylistIds(new Set());
        }
      };
      checkActiveParties();
    }, [refetch, uid])
  );

  const handleDelete = (playlistId: number, playlistName: string) => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlistName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!authToken) {
                console.error('No auth token available');
                Alert.alert('Error', 'Authentication failed. Please try again.');
                return;
              }

              const res = await fetch(`/api/playlist/${playlistId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authToken}`,
                },
              });

              if (!res.ok) {
                const errorText = await res.text();
                console.error('Failed to delete playlist:', errorText);
                Alert.alert('Error', 'Failed to delete playlist. Please try again.');
                return;
              }

              // Refresh the playlists after successful deletion
              if (refetch) {
                refetch();
              }
            } catch (error) {
              console.error('Error deleting playlist:', error);
              Alert.alert('Error', 'An error occurred while deleting the playlist. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const currentPlaylists = activeView === 'myPlaylists' ? playlists : partyPlaylists;
  const currentLoading = activeView === 'myPlaylists' ? playlistLoading : partyLoading;
  const currentError = activeView === 'myPlaylists' ? error : partyError;


  return (
    <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Playlists</Text>
        </View>
        <View style={styles.segmentControl}>
          <TouchableOpacity
            style={[styles.segmentButton, activeView === 'myPlaylists' && styles.segmentButtonActive]}
            onPress={() => setActiveView('myPlaylists')}
          >
            <Text style={[styles.segmentText, activeView === 'myPlaylists' && styles.segmentTextActive]}>My Playlists</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, activeView === 'partyPlaylists' && styles.segmentButtonActive]}
            onPress={() => setActiveView('partyPlaylists')}
          >
            <Text style={[styles.segmentText, activeView === 'partyPlaylists' && styles.segmentTextActive]}>Party Playlists</Text>
          </TouchableOpacity>
        </View>

        {authLoading || currentLoading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : currentPlaylists.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons name="musical-notes-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No playlists yet</Text>
            <Text style={styles.emptySubtext}>Create your first playlist by swiping!</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="automatic"
          >
            {currentPlaylists.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.playlistCard}
                onPress={() => router.push({
                  pathname: '/(tabs)/playlist-detail',
                  params: { id: p.id }
                })}
                activeOpacity={0.7}
              >
                <View style={styles.playlistHeader}>
                  <View style={styles.playlistInfo}>
                    <View style={styles.playlistNameRow}>
                      <Text style={styles.playlistName} numberOfLines={1}>{p.name}</Text>
                      {/* {activePartyPlaylistIds.has(p.id) && (
                        <View style={styles.partyModeBadge}>
                          <Ionicons name="radio" size={12} color="#FF8C42" />
                          <Text style={styles.partyModeText}>Party Mode</Text>
                        </View>
                      )} */}
                    </View>
                    <Text style={styles.playlistMeta}>
                      {(p.songs ?? []).length} song{(p.songs ?? []).length !== 1 ? 's' : ''} · {new Date(p.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {activeView === 'myPlaylists' && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id, p.name);
                      }}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#F28695" />
                    </TouchableOpacity>
                  )}
                </View>

                {(p.songs ?? []).length > 0 && (
                  <View style={styles.songsContainer}>
                    {(p.songs ?? []).slice(0, 3).map((song, idx) => (
                      <View key={`${song.song_id}`} style={styles.songItem}>
                        <ExpoImage
                          source={{ uri: song?.cover_url || 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/960px-Cat_November_2010-1a.jpg'}}
                          style={styles.songArtwork}
                          contentFit="cover"
                        />
                        <View style={styles.songDetails}>
                          <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                          <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                        </View>
                      </View>
                    ))}
                    {(p.songs ?? []).length > 3 && (
                      <Text style={styles.moreSongs}>+{(p.songs ?? []).length - 3} more</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 18 },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#001133',
    fontFamily: 'AppleGaramond-Italic',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#6F7A88',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#001133',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6F7A88',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    marginBottom: 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  playlistCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  playlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  playlistInfo: {
    flex: 1,
    marginRight: 12,
  },
  playlistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
    gap: 8,
  },
  playlistName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#001133',
    flexShrink: 1,
  },
  partyModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF8C42',
    gap: 4,
  },
  partyModeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF8C42',
    letterSpacing: 0.3,
  },
  playlistMeta: {
    fontSize: 14,
    color: '#6F7A88',
  },
  deleteButton: {
    padding: 8,
  },
  songsContainer: {
    gap: 8,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songArtwork: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#001133',
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 12,
    color: '#6F7A88',
  },
  moreSongs: {
    fontSize: 12,
    color: '#6F7A88',
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 52,
  },
  segmentControl: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#EBEBEB',
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6F7A88',
  },
  segmentTextActive: {
    color: '#001133',
  },
});

