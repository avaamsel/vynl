import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import AppButton from '@/src/components/AppButton';
import SpotifyExportModal from '@/src/components/SpotifyExportModal';
import { ITunesPlaylist } from '@/src/types';
import { usePlaylistWithID } from '@/src/hooks/use-playlist-with-id';

export default function PlaylistDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const playlistId = params.id as string;
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const { playlist, loading, error } = usePlaylistWithID(playlistId);

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
          <TouchableOpacity onPress={handleDeletePlaylist} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color="#F28695" />
          </TouchableOpacity>
        </View>

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
            <AppButton
              title="Export to Spotify"
              onPress={() => {
                console.log('Export button clicked, opening modal');
                console.log('Current showExportModal state:', showExportModal);
                console.log('Playlist:', playlist.name, 'Songs:', playlist.songs.length);
                try {
                  setShowExportModal(true);
                  console.log('Modal state set to true');
                } catch (error) {
                  console.error('Error setting modal state:', error);
                  Alert.alert('Error', 'Failed to open export modal. Check console for details.');
                }
              }}
              backgroundColor="#1DB954"
              textColor="#FFFFFF"
              width="100%"
            />
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
});

