import AsyncStorage from '@react-native-async-storage/async-storage';
import { ITunesPlaylist, ITunesSong } from '../types';

const PLAYLIST_STORAGE_KEY = '@vynl:playlists';

export async function savePlaylist(playlist: ITunesPlaylist): Promise<void> {
  try {
    console.log('savePlaylist called with:', playlist.name, 'containing', playlist.songs.length, 'songs');
    console.log('Song IDs:', playlist.songs.map(s => s.song_id));
    const existing = await getPlaylists();
    const updated = [...existing, playlist];
    await AsyncStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(updated));
    console.log('Playlist saved successfully');
  } catch (error) {
    console.error('Error saving playlist:', error);
    throw error;
  }
}

export async function getPlaylists(): Promise<ITunesPlaylist[]> {
  try {
    const data = await AsyncStorage.getItem(PLAYLIST_STORAGE_KEY);
    if (!data) return [];
    const playlists = JSON.parse(data);
    playlists.forEach((p: ITunesPlaylist) => {
      console.log('Loaded playlist:', p.name, 'with', p.songs.length, 'songs');
      console.log('Song IDs in loaded playlist:', p.songs.map((s: ITunesSong) => s.song_id));
    });
    return playlists;
  } catch (error) {
    console.error('Error getting playlists:', error);
    return [];
  }
}

export async function deletePlaylist(playlistId: number): Promise<void> {
  try {
    const existing = await getPlaylists();
    const updated = existing.filter(p => p.id !== playlistId);
    await AsyncStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
}

export async function updatePlaylist(playlistId: number, updates: Partial<ITunesPlaylist>): Promise<void> {
  try {
    const existing = await getPlaylists();
    const updated = existing.map(p => {
      if (p.id === playlistId) {
        return { ...p, ...updates };
      }
      return p;
    });
    await AsyncStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating playlist:', error);
    throw error;
  }
}

export async function getPlaylist(playlistId: number): Promise<ITunesPlaylist | null> {
  try {
    const playlists = await getPlaylists();
    return playlists.find(p => p.id === playlistId) || null;
  } catch (error) {
    console.error('Error getting playlist:', error);
    return null;
  }
}

