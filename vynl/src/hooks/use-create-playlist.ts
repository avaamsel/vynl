import { useState, useCallback } from 'react';
import { ITunesSong, ITunesPlaylist } from '@/src/types';
import { useAuth } from '../context/auth-context';


type UseCreatePlaylistResult = {
  loading: boolean;
  error: string | null;
  createPlaylist: (name: string, user_id: string, songs: ITunesSong[]) => Promise<ITunesPlaylist | null>;
};

export function useCreatePlaylist(): UseCreatePlaylistResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authToken, loading: authLoading } = useAuth();

  const createPlaylist = useCallback(
    async (name: string, user_id: string, songs: ITunesSong[]): Promise<ITunesPlaylist | null> => {

      if (authLoading || !authToken) {
        setError('Auth token not ready yet');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/playlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken,
          },
          body: JSON.stringify({ name, user_id, songs }),
        });

        if (!res.ok) {
          const text = await res.text();
          setError(text || 'Failed to create playlist');
          return null;
        }

        const playlist: ITunesPlaylist = await res.json();
        return playlist;

      } catch (err: any) {
        console.error('Error creating playlist:', err);
        setError(err.message || 'Unknown error');
        return null;
        
      } finally {
        setLoading(false);
      }
    },
    [authToken, authLoading]
  );

  return { loading, error, createPlaylist };
}
