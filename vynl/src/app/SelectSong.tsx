import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/src/constants/theme';
import AppButton from '@/src/components/AppButton';

// Mock song data - replace with actual data from your backend
const mockSongs = [
  { id: 1, title: 'Bohemian Rhapsody', artist: 'Queen', duration: '5:55' },
  { id: 2, title: 'Hotel California', artist: 'Eagles', duration: '6:30' },
  { id: 3, title: 'Stairway to Heaven', artist: 'Led Zeppelin', duration: '8:02' },
  { id: 4, title: 'Imagine', artist: 'John Lennon', duration: '3:04' },
  { id: 5, title: 'Hey Jude', artist: 'The Beatles', duration: '7:11' },
  { id: 6, title: 'Like a Rolling Stone', artist: 'Bob Dylan', duration: '6:13' },
  { id: 7, title: 'Smells Like Teen Spirit', artist: 'Nirvana', duration: '5:01' },
  { id: 8, title: 'Billie Jean', artist: 'Michael Jackson', duration: '4:54' },
];

export default function SelectSongScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [selectedSongs, setSelectedSongs] = useState<number[]>([]);
  const theme = Colors[colorScheme ?? 'light'];

  const toggleSong = (songId: number) => {
    setSelectedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const handleDone = () => {
    // Navigate back or to playlist creation screen
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Songs</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.instructionText}>
          Select songs to add to your playlist ({selectedSongs.length} selected)
        </Text>

        {mockSongs.map((song) => {
          const isSelected = selectedSongs.includes(song.id);
          return (
            <TouchableOpacity
              key={song.id}
              style={[
                styles.songItem,
                isSelected && { backgroundColor: theme.primary + '30' }
              ]}
              onPress={() => toggleSong(song.id)}
              activeOpacity={0.7}
            >
              <View style={styles.songInfo}>
                <View style={styles.songNumber}>
                  <Text style={styles.songNumberText}>{song.id}</Text>
                </View>
                <View style={styles.songDetails}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.songArtist}>{song.artist}</Text>
                </View>
              </View>
              <View style={styles.songMeta}>
                <Text style={styles.songDuration}>{song.duration}</Text>
                <View style={[
                  styles.checkbox,
                  isSelected && { backgroundColor: theme.primary }
                ]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <AppButton
          title={`Add ${selectedSongs.length} Song${selectedSongs.length !== 1 ? 's' : ''}`}
          onPress={handleDone}
          backgroundColor={selectedSongs.length > 0 ? theme.primary : theme.disabled}
          width="90%"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    minWidth: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  songNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  songNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#666',
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  songDuration: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
});

