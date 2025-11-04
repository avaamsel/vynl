
export interface User {
  id: string;
  name: string;
  email: string; //Do we store that ?
}

export interface Song {
  song_id: number;
  title: string;
  artist: string;
  duration_sec: number;
}

export interface Playlist {
  id: number;
  name: string;
  created_at: string;
  user_id: string;
  songs: Song[];
}