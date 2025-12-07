import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppButton from '@/src/components/AppButton';
import SpotifyExportModal from '@/src/components/SpotifyExportModal';
import YouTubeExportModal from '@/src/components/YouTubeExportModal';
import { ITunesPlaylist } from '@/src/types';
import { usePlaylistWithID } from '@/src/hooks/use-playlist-with-id';
import { supabase } from '@/src/utils/supabase';
import { useAuth } from '@/src/context/auth-context';

const PARTY_CODE_STORAGE_KEY = '@vynl:partyCode';

export default function PlaylistDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const playlistId = params.id as string;
  const partyCodeFromParams = params.partyCode as string | undefined;
  const { authToken, loading: authLoading } = useAuth();
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [partyCode, setPartyCode] = useState<string | undefined>(partyCodeFromParams);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const { playlist, loading, error, refetch } = usePlaylistWithID(playlistId);

  // Load party code from storage when component mounts or playlist changes
  useEffect(() => {
    const loadPartyCode = async () => {
      try {
        const storedParties = await AsyncStorage.getItem(PARTY_CODE_STORAGE_KEY);
        if (storedParties) {
          const parties = JSON.parse(storedParties);
          // Check if there's an active party for this playlist
          const activeParty = Array.isArray(parties) 
            ? parties.find((p: any) => p.playlistId === playlistId)
            : (parties.playlistId === playlistId ? parties : null);
          
          if (activeParty && activeParty.partyCode) {
            setPartyCode(activeParty.partyCode);
          }
        }
      } catch (error) {
        console.error('Error loading party code:', error);
      }
    };

    // If party code comes from params, save it to storage
    if (partyCodeFromParams) {
      const savePartyCode = async () => {
        try {
          const existingParties = await AsyncStorage.getItem(PARTY_CODE_STORAGE_KEY);
          let parties = existingParties ? JSON.parse(existingParties) : [];
          
          // Handle migration from old format (single object) to new format (array)
          if (!Array.isArray(parties)) {
            parties = parties.playlistId ? [parties] : [];
          }
          
          // Check if this playlist already has an active party
          const existingIndex = parties.findIndex((p: any) => p.playlistId === playlistId);
          
          if (existingIndex >= 0) {
            // Update existing party code
            parties[existingIndex].partyCode = partyCodeFromParams;
          } else {
            // Add new party
            parties.push({
              playlistId: playlistId,
              partyCode: partyCodeFromParams
            });
          }
          
          await AsyncStorage.setItem(PARTY_CODE_STORAGE_KEY, JSON.stringify(parties));
          setPartyCode(partyCodeFromParams);
        } catch (error) {
          console.error('Error saving party code:', error);
        }
      };
      savePartyCode();
    } else {
      // Otherwise, try to load from storage
      loadPartyCode();
    }
  }, [playlistId, partyCodeFromParams]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      // Reload party code when screen comes into focus
      const loadPartyCode = async () => {
        try {
          const storedParties = await AsyncStorage.getItem(PARTY_CODE_STORAGE_KEY);
          if (storedParties) {
            const parties = JSON.parse(storedParties);
            // Check if there's an active party for this playlist
            const activeParty = Array.isArray(parties)
              ? parties.find((p: any) => p.playlistId === playlistId)
              : (parties.playlistId === playlistId ? parties : null);
            
            if (activeParty && activeParty.partyCode) {
              setPartyCode(activeParty.partyCode);
            } else {
              setPartyCode(undefined);
            }
          } else {
            setPartyCode(undefined);
          }
        } catch (error) {
          console.error('Error loading party code:', error);
        }
      };
      loadPartyCode();
    }, [refetch, playlistId])
  );

  const handleDeleteSong = async (songId: number) => {
    if (!playlist) return;
    
    Alert.alert(
      'Delete Song',
      'Are you sure you want to remove this song from the playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log("Feature not implemented yet");
            } catch (error) {
              console.error('Error deleting song:', error);
              Alert.alert('Error', 'Failed to delete song');
            }
          },
        },
      ]
    );
  };

  const handleAddSongs = () => {
    if (!playlist) return;
    console.log("add : ", playlist.songs);
    router.push({
      pathname: '/(tabs)/swipe',
      params: { 
        songs: JSON.stringify(playlist.songs), 
        playlist: JSON.stringify(playlist),
        mode: 'add' 
      }
    });
  };

  const handleDeletePlaylist = () => {
    if (!playlist) return;
    
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log("Plyalist not implemented yet");
            } catch (error) {
              console.error('Error deleting playlist:', error);
              Alert.alert('Error', 'Failed to delete playlist');
            }
          },
        },
      ]
    );
  };

  const disableParty = async () => {
    if (!partyCode) {
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("Unable to get user");
      return
    }

    const url = `/api/playlist/party/toggle/${playlistId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        uid: user.id,
        enable: false,
      }),
    });

    setPartyCode(undefined);
    return;
  }

  if (loading) {
    return (
      <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!playlist) {
    return (
      <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Playlist not found</Text>
            <AppButton
              title="Go Back"
              onPress={() => router.push('/(tabs)/playlists')}
              backgroundColor="#F28695"
              textColor="#FFFFFF"
              width="60%"
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (playlist) {
    console.log(error);
  }

  return (
    <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/playlists')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#001133" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{playlist.name}</Text>
            <Text style={styles.subtitle}>
              {playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {!partyCode ? (
              <TouchableOpacity 
                onPress={() => router.push({
                  pathname: '../HostParty',
                  params: { playlistId: playlist.id.toString() }
                })} 
                style={styles.hostPartyButton}
              >
                <Text style={styles.hostPartyButtonText}>HOST PARTY</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={disableParty} 
                style={styles.hostPartyButton}
              >
                <Text style={styles.hostPartyButtonText}>STOP PARTY</Text>
              </TouchableOpacity>      
            )}
            <TouchableOpacity onPress={handleDeletePlaylist} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={24} color="#F28695" />
            </TouchableOpacity>
          </View>
        </View>

        {partyCode && (
          <View style={styles.partyCodeContent}>
            {partyCode.split('').map((char, index) => (
                <View key={index} style={styles.partyCodeCharBox}>
                  <Text style={styles.partyCodeCharText}>{char}</Text>
                </View>
            ))}
          </View>
/* 
          <View style={styles.partyCodeSection}>
            <View style={styles.partyCodeHeader}>
              <Text style={styles.partyCodeLabel}>Party Code</Text>
              <TouchableOpacity 
                onPress={async () => {
                  // Remove this playlist's party from storage and state
                  try {
                    const storedParties = await AsyncStorage.getItem(PARTY_CODE_STORAGE_KEY);
                    if (storedParties) {
                      let parties = JSON.parse(storedParties);
                      
                      // Handle migration from old format
                      if (!Array.isArray(parties)) {
                        parties = parties.playlistId ? [parties] : [];
                      }
                      
                      // Remove this playlist's party
                      parties = parties.filter((p: any) => p.playlistId !== playlist.id.toString());
                      
                      if (parties.length > 0) {
                        await AsyncStorage.setItem(PARTY_CODE_STORAGE_KEY, JSON.stringify(parties));
                      } else {
                        await AsyncStorage.removeItem(PARTY_CODE_STORAGE_KEY);
                      }
                    }
                    setPartyCode(undefined);
                    // Navigate back to playlist detail without party code
                    router.push({
                      pathname: '/(tabs)/playlist-detail',
                      params: { id: playlist.id.toString() }
                    });
                  } catch (error) {
                    console.error('Error ending party:', error);
                  }
                }}
                style={styles.endPartyButton}
              >
                <Ionicons name="close-circle" size={24} color="#F28695" />
              </TouchableOpacity>
            </View>
            <View style={styles.partyCodeContainer}>
              {partyCode.split('').map((char, index) => (
                <View key={index} style={styles.partyCodeCharBox}>
                  <Text style={styles.partyCodeCharText}>{char}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.partyCodeInstruction}>
              Share this code with friends to join your party
            </Text>
            <TouchableOpacity 
              onPress={async () => {
                // Remove this playlist's party from storage and state
                try {
                  const storedParties = await AsyncStorage.getItem(PARTY_CODE_STORAGE_KEY);
                  if (storedParties) {
                    let parties = JSON.parse(storedParties);
                    
                    // Handle migration from old format
                    if (!Array.isArray(parties)) {
                      parties = parties.playlistId ? [parties] : [];
                    }
                    
                    // Remove this playlist's party
                    parties = parties.filter((p: any) => p.playlistId !== playlist.id.toString());
                    
                    if (parties.length > 0) {
                      await AsyncStorage.setItem(PARTY_CODE_STORAGE_KEY, JSON.stringify(parties));
                    } else {
                      await AsyncStorage.removeItem(PARTY_CODE_STORAGE_KEY);
                    }
                  }
                  setPartyCode(undefined);
                  // Navigate back to playlist detail without party code
                  router.push({
                    pathname: '/(tabs)/playlist-detail',
                    params: { id: playlist.id.toString() }
                  });
                } catch (error) {
                  console.error('Error ending party:', error);
                }
              }}
              style={styles.endPartyTextButton}
            >
              <Text style={styles.endPartyTextButtonText}>End Party</Text>
            </TouchableOpacity>
          </View> */
        )}

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {playlist.songs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>No songs in this playlist</Text>
              <Text style={styles.emptySubtext}>Add songs by swiping!</Text>
            </View>
          ) : (
            playlist.songs.map((song, idx) => (
              <View key={`${song.song_id}-${idx}`} style={styles.songItem}>
                <ExpoImage
                  source={{ uri: song?.cover_url || 'https://via.placeholder.com/150' }}
                  style={styles.songArtwork}
                  contentFit="cover"
                />
                <View style={styles.songDetails}>
                  <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteSong(song.song_id)}
                  style={styles.deleteSongButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#F28695" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            title="Add Songs"
            onPress={handleAddSongs}
            backgroundColor="#F28695"
            textColor="#FFFFFF"
            width="100%"
          />
          {playlist.songs.length > 0 && (
            <>
              <AppButton
                title="Export to Spotify"
                onPress={() => {
                  try {
                    setShowExportModal(true);
                  } catch (error) {
                    console.error('Error setting Spotify modal state:', error);
                    Alert.alert('Error', 'Failed to open Spotify export modal.');
                  }
                }}
                backgroundColor="#1DB954"
                textColor="#FFFFFF"
                width="100%"
              />
              <AppButton
                title="Export to YouTube Music"
                onPress={() => {
                  try {
                    setShowYouTubeModal(true);
                  } catch (error) {
                    console.error('Error setting YouTube modal state:', error);
                    Alert.alert('Error', 'Failed to open YouTube export modal.');
                  }
                }}
                backgroundColor="#FF0000"
                textColor="#FFFFFF"
                width="100%"
              />
            </>
          )}
        </View>

        <SpotifyExportModal
          visible={showExportModal}
          onClose={() => setShowExportModal(false)}
          playlistName={playlist.name}
          songs={playlist.songs.map(song => ({ title: song.title, artist: song.artist }))}
          onSuccess={(playlistUrl) => {
            setShowExportModal(false);
            // Optionally show success message or navigate
          }}
        />
        <YouTubeExportModal
          visible={showYouTubeModal}
          onClose={() => setShowYouTubeModal(false)}
          playlistName={playlist.name}
          songs={playlist.songs.map(song => ({ title: song.title, artist: song.artist }))}
          onSuccess={() => setShowYouTubeModal(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#001133',
    fontFamily: 'AppleGaramond-Italic',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6F7A88',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostPartyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF8F5',
    borderWidth: 2,
    borderColor: '#FF8C42',
  },
  hostPartyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF8C42',
    letterSpacing: 0.5,
  },
  deleteButton: {
    padding: 8,
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
  errorText: {
    fontSize: 18,
    color: '#F28695',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
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
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  songArtwork: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  songDetails: {
    flex: 1,
    minWidth: 0,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001133',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#6F7A88',
  },
  deleteSongButton: {
    padding: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 12,
  },
  partyCodeSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FFF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE5D9',
  },
  partyCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partyCodeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001133',
    flex: 1,
    textAlign: 'center',
  },
  endPartyButton: {
    padding: 4,
  },
  partyCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  partyCodeCharBox: {
    width: 40,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF8C42',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  partyCodeCharText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF8C42',
  },
  partyCodeInstruction: {
    fontSize: 12,
    color: '#6F7A88',
    textAlign: 'center',
    marginBottom: 12,
  },
  endPartyTextButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  endPartyTextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F28695',
    textAlign: 'center',
  },
  partyCodeContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
});

