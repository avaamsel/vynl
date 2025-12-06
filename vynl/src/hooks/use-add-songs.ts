import { useState, useCallback } from 'react';
import { ITunesSong, ITunesPlaylist } from '@/src/types';
import { useAuth } from '../context/auth-context';

type UseAddPlaylistResult = {
  addLoading: boolean;
  addError: string | null;
  addToPlaylist: (playlist_id: number, songs: ITunesSong[]) => Promise<ITunesPlaylist | null>;
};

export function useAddToPlaylist(): UseAddPlaylistResult {
  const [addLoading, setLoading] = useState(false);
  const [addError, setError] = useState<string | null>(null);
  const { authToken } = useAuth();

  const addToPlaylist = useCallback(
    async (playlist_id: number, songs: ITunesSong[]): Promise<ITunesPlaylist | null> => {
      console.log("UPDATing...");
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/playlist/add/${encodeURIComponent(playlist_id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken,
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
        console.error('Error adding to playlist:', err);
        setError(err.message || 'Unknown error');
        return null;
        
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { addLoading, addError, addToPlaylist };
}
