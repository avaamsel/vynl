import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useUser } from '@/src/hooks/use-user';
import { useUserPlaylists } from '@/src/hooks/use-playlist-for-user';

export default function PlaylistsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useUser();
  const uid = user?.id;
  
  const { playlists, loading: playlistLoading, error, refetch } = useUserPlaylists(uid ?? null);

  // Calculate bottom padding: tab bar height (90) + safe area bottom + extra padding
  // Tab bar is absolutely positioned at bottom, height 90px with paddingBottom 20px
  // We need enough space so content doesn't scroll under the tab bar
  // Using a larger fixed value to ensure content stays above the nav bar
  const bottomPadding = Math.max(90 + insets.bottom + 50, 150);
  
  useFocusEffect(
    useCallback(() => {
      if (refetch && uid) {
        console.log("Screen focused, refreshing playlists...");
        refetch();
      }
    }, [refetch, uid])
  );

  const handleDelete = async (playlistId: number) => {
    try {
      //TODO : implement
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

        {authLoading || playlistLoading ? (
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
            {playlists.map((p) => (
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
                    <Text style={styles.playlistName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.playlistMeta}>
                      {(p.songs ?? []).length} song{(p.songs ?? []).length !== 1 ? 's' : ''} · {new Date(p.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(p.id);
                    }}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#F28695" />
                  </TouchableOpacity>
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

