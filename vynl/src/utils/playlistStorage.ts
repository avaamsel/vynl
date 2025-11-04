import AsyncStorage from '@react-native-async-storage/async-storage';

export type Song = {
  id: string;
  title: string;
  artist: string;
  artwork: string;
};

export type Playlist = {
  id: string;
  name: string;
  songs: Song[];
  createdAt: number;
};

const PLAYLIST_STORAGE_KEY = '@vynl:playlists';

export async function savePlaylist(playlist: Playlist): Promise<void> {
  try {
    console.log('savePlaylist called with:', playlist.name, 'containing', playlist.songs.length, 'songs');
    console.log('Song IDs:', playlist.songs.map(s => s.id));
    const existing = await getPlaylists();
    const updated = [...existing, playlist];
    await AsyncStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(updated));
    console.log('Playlist saved successfully');
  } catch (error) {
    console.error('Error saving playlist:', error);
    throw error;
  }
}

export async function getPlaylists(): Promise<Playlist[]> {
  try {
    const data = await AsyncStorage.getItem(PLAYLIST_STORAGE_KEY);
    if (!data) return [];
    const playlists = JSON.parse(data);
    playlists.forEach((p: Playlist) => {
      console.log('Loaded playlist:', p.name, 'with', p.songs.length, 'songs');
      console.log('Song IDs in loaded playlist:', p.songs.map((s: Song) => s.id));
    });
    return playlists;
  } catch (error) {
    console.error('Error getting playlists:', error);
    return [];
  }
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  try {
    const existing = await getPlaylists();
    const updated = existing.filter(p => p.id !== playlistId);
    await AsyncStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
}

