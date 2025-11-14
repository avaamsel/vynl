import { useState, useCallback } from 'react';
import { ITunesSong, ITunesPlaylist } from '@/src/types';

type UseCreatePlaylistResult = {
  updateLoading: boolean;
  updateError: string | null;
  updatePlaylist: (playlist_id: number, songs: ITunesSong[]) => Promise<ITunesPlaylist | null>;
};

export function useUpdatePlaylist(): UseCreatePlaylistResult {
  const [updateLoading, setLoading] = useState(false);
  const [updateError, setError] = useState<string | null>(null);

  const updatePlaylist = useCallback(
    async (playlist_id: number, songs: ITunesSong[]): Promise<ITunesPlaylist | null> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/playlist/${encodeURIComponent(playlist_id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.EXPO_PUBLIC_AUTH_TOKEN_TEST_PURPOSE_ONLY,
          },
          body: JSON.stringify({ songs }),
        });

        if (!res.ok) {
          const text = await res.text();
          setError(text || 'Failed to update playlist');
          return null;
        }

        const playlist: ITunesPlaylist = await res.json();
        return playlist;

      } catch (err: any) {
        console.error('Error updating playlist:', err);
        setError(err.message || 'Unknown error');
        return null;
        
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { updateLoading, updateError, updatePlaylist };
}
