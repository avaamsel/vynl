export interface profile {
  id: string
  name: string
}

export interface playlist_data {
  created_at: string,
  name: string,
  playlist_id: number,
  uid: string,
}

export interface playlist_song {
  playlist_id: number
  position: number | null
  song_id: number
}

export interface songs_data {
  artist: string
  duration_sec: number | null
  song_id: number
  title: string
}

export function isProfile(obj: any): obj is profile {
  return (
    typeof obj === 'object' && 
    obj !== null &&
    'id' in obj &&
    typeof obj.id === 'string' &&
    'name' in obj &&
    typeof obj.name === 'string'
  );
}

export function isPlaylistData(obj: any): obj is playlist_data {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'created_at' in obj &&
    typeof obj.created_at === 'string' &&
    'name' in obj &&
    typeof obj.name === 'string' &&
    'playlist_id' in obj &&
    typeof obj.playlist_id === 'number' &&
    'uuid' in obj &&
    typeof obj.uuid === 'string'
  );
}

export function isPlaylistSong(obj: any): obj is playlist_song {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'playlist_id' in obj &&
    typeof obj.playlist_id === 'number' &&
    'position' in obj &&
    (obj.position === null || typeof obj.position === 'number') &&
    'song_id' in obj &&
    typeof obj.song_id === 'number'
  );
}

export function isSongData(obj: any): obj is songs_data {
  return (
    typeof obj === 'object' && 
    obj !== null &&
    'artist' in obj &&
    (typeof obj.artist === 'string') &&
    'duration_sec' in obj &&
    (obj.duration_sec === null || typeof obj.duration_sec === 'number') &&
    'song_id' in obj &&
    typeof obj.song_id === 'number' &&
    'title' in obj &&
    typeof obj.title === 'string'
  );
}