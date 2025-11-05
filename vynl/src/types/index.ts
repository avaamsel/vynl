import type { User, Song, Playlist, ITunesSong } from './index.d';
import { LastFmService } from '@/src/services/music-providers/lastfm-provider';

export function isUser(obj: any): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof obj.id === 'string' &&
    'name' in obj &&
    typeof obj.name === 'string' &&
    'email' in obj &&
    typeof obj.email === 'number'
  );
}

export function isSong(obj: any): obj is Song {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'song_id' in obj &&
    typeof obj.song_id === 'number' &&
    'title' in obj &&
    typeof obj.title === 'string' &&
    'artist' in obj &&
    typeof obj.artist === 'string' ||
    obj.artist == null &&
    'duration_sec' in obj &&
    typeof obj.duration_sec === 'number' ||
    obj.duration_sec == null
  );
}

export function isPlaylist(obj: any): obj is Playlist {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    typeof obj.id === 'number' &&
    'name' in obj &&
    typeof obj.name === 'string' &&
    'created_at' in obj &&
    typeof obj.created_at === 'string' &&
    'user_id' in obj &&
    typeof obj.user_id === 'string' &&
    Array.isArray(obj.songs) &&
    obj.songs.every(isSong)
  );
}

export async function iTunesSongToSong(itunesSong: ITunesSong): Promise<Song | Error> {
  if (!itunesSong) return new Error("Invalid iTunes Song");

  const lastfmService = new LastFmService();

  const trackExists = await lastfmService.trackExists(itunesSong.artist, itunesSong.title);
  if (!trackExists) {
    return new Error("Track does not exist in Last.fm database");
  }

  const trackInfo = await lastfmService.getTrackInfo(itunesSong.artist, itunesSong.title);

  if (!trackInfo) {
    return new Error("Failed to retrieve track info from Last.fm");
  }

  return {
    song_id: 10, // Should be trackInfo.mbid,
    title: itunesSong.title,
    artist: itunesSong.artist,
    duration_sec: 10, // Should be parseInt(trackInfo.duration) / 1000
  };
}