import { useState, useCallback } from 'react';
import { ITunesSong } from '@/src/types';

type UseCreatePlaylistResult = {
  loading: boolean;
  error: string | null;
  createPlaylist: (name : String, uid : String, songs: ITunesSong[]) => Promise<boolean>;
};

export function useCreatePlaylist(): UseCreatePlaylistResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlaylist = useCallback(async (name : String, user_id : String, songs: ITunesSong[]) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 
          'Authorization' : 'Bearer ' + process.env.EXPO_PUBLIC_AUTH_TOKEN_TEST_PURPOSE_ONLY,
        },
        body: JSON.stringify({ name, user_id, songs }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || 'Failed to create playlist');
        setLoading(false);
        return false;
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error creating playlist :', err);
      setError(err.message || 'Unknown error');
      setLoading(false);
      return false;
    }
  }, []);

  return { loading, error, createPlaylist };
}
