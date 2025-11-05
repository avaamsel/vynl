import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { getPlaylists, deletePlaylist, type Playlist } from '@/src/utils/playlistStorage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

export default function PlaylistsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calculate bottom padding: tab bar height (90) + safe area bottom + extra padding
  // Tab bar is absolutely positioned at bottom, height 90px with paddingBottom 20px
  // We need enough space so content doesn't scroll under the tab bar
  // Using a larger fixed value to ensure content stays above the nav bar
  const bottomPadding = Math.max(90 + insets.bottom + 50, 150);

  const loadPlaylists = useCallback(async () => {
    try {
      const loaded = await getPlaylists();
      // Sort by creation date, newest first
      loaded.sort((a, b) => b.createdAt - a.createdAt);
      setPlaylists(loaded);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlaylists();
    }, [loadPlaylists])
  );


  const handleDelete = async (playlistId: string) => {
    try {
      await deletePlaylist(playlistId);
      loadPlaylists();
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Playlists</Text>
        </View>

        {isLoading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : playlists.length === 0 ? (
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
            {playlists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={styles.playlistCard}
                onPress={() => router.push({
                  pathname: '/(tabs)/playlist-detail',
                  params: { id: playlist.id }
                })}
                activeOpacity={0.7}
              >
                <View style={styles.playlistHeader}>
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName} numberOfLines={1}>{playlist.name}</Text>
                    <Text style={styles.playlistMeta}>
                      {playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''} · {formatDate(playlist.createdAt)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(playlist.id);
                    }}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#F28695" />
                  </TouchableOpacity>
                </View>

                {playlist.songs.length > 0 && (
                  <View style={styles.songsContainer}>
                    {playlist.songs.slice(0, 3).map((song, idx) => (
                      <View key={`${playlist.id}-${song.id}-${idx}`} style={styles.songItem}>
                        <ExpoImage
                          source={{ uri: song.artwork }}
                          style={styles.songArtwork}
                          contentFit="cover"
                        />
                        <View style={styles.songDetails}>
                          <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                          <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                        </View>
                      </View>
                    ))}
                    {playlist.songs.length > 3 && (
                      <Text style={styles.moreSongs}>+{playlist.songs.length - 3} more</Text>
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
  playlistName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#001133',
    marginBottom: 4,
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
});

