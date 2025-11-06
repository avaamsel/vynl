
import { LastFmService } from '@/src/services/music-providers/lastfm-provider';

export interface User {
  id: string;
  name: string;
  email: string; //Do we store that ?
}

export interface LastFmSong {
  mbid: number;
  title: string;
  artist: string;
  duration_sec: number | null;
}

export interface ITunesPlaylist {
  id: number;
  name: string;
  created_at: string;
  user_id: string;
  songs: ITunesSong[];
}

export interface ITunesSong {
  song_id: number;
  title: string;
  artist: string;
  duration_sec: number | null;
  cover_url: string;
  preview_url: string;
}

export function isUser(obj: any): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string'
  );
}


export function isLastFmSong(obj: any): obj is LastFmSong {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.mbid === 'number' &&
    typeof obj.title === 'string' &&
    typeof obj.artist === 'string' &&
    ('duration_sec' in obj &&
      (typeof obj.duration_sec === 'number' || obj.duration_sec === null))
  );
}


export function isITunesSong(obj: any): obj is ITunesSong {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.song_id === 'number' &&
    typeof obj.title === 'string' &&
    typeof obj.artist === 'string' &&
    ('duration_sec' in obj &&
      (typeof obj.duration_sec === 'number' || obj.duration_sec === null)) &&
    typeof obj.cover_url === 'string' &&
    typeof obj.preview_url === 'string'
  );
}


export function isITunesPlaylist(obj: any): obj is ITunesPlaylist {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.user_id === 'string' &&
    Array.isArray(obj.songs) &&
    obj.songs.every(isITunesSong)
  );
}


export async function iTunesSongToLastFMSong(itunesSong: ITunesSong): Promise<LastFmSong | Error> {
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
    mbid: trackInfo.mbid,
    title: itunesSong.title,
    artist: itunesSong.artist,
    duration_sec: parseInt(trackInfo.duration) / 1000,
  };
}