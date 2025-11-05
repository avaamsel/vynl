import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { getPlaylist, updatePlaylist, deletePlaylist, type Playlist } from '@/src/utils/playlistStorage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import AppButton from '@/src/components/AppButton';

export default function PlaylistDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const playlistId = params.id as string;
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlaylist = useCallback(async () => {
    if (!playlistId) return;
    try {
      const loaded = await getPlaylist(playlistId);
      setPlaylist(loaded);
    } catch (error) {
      console.error('Error loading playlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [playlistId]);

  useFocusEffect(
    useCallback(() => {
      loadPlaylist();
    }, [loadPlaylist])
  );

  const handleDeleteSong = async (songId: string) => {
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
              const updatedSongs = playlist.songs.filter(s => s.id !== songId);
              await updatePlaylist(playlistId, { songs: updatedSongs });
              loadPlaylist();
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
    router.push({
      pathname: '/(tabs)/swipe',
      params: { 
        playlistId: playlist.id,
        playlistName: playlist.name,
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
              await deletePlaylist(playlistId);
              router.push('/(tabs)/playlists');
            } catch (error) {
              console.error('Error deleting playlist:', error);
              Alert.alert('Error', 'Failed to delete playlist');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
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
              <View key={`${song.id}-${idx}`} style={styles.songItem}>
                <ExpoImage
                  source={{ uri: song.artwork }}
                  style={styles.songArtwork}
                  contentFit="cover"
                />
                <View style={styles.songDetails}>
                  <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteSong(song.id)}
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
        </View>
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
  },
});

