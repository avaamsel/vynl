import { useState, useCallback } from 'react';
import { ITunesSong, ITunesPlaylist } from '@/src/types';
import { useAuth } from '../context/auth-context';

type UseCreatePlaylistResult = {
  updateLoading: boolean;
  updateError: string | null;
  updatePlaylist: (playlist_id: number, songs: ITunesSong[], newName: string) => Promise<ITunesPlaylist | null>;
};

export function useUpdatePlaylist(): UseCreatePlaylistResult {
  const [updateLoading, setLoading] = useState(false);
  const [updateError, setError] = useState<string | null>(null);
  const { authToken } = useAuth();

  const updatePlaylist = useCallback(
    async (playlist_id: number, songs: ITunesSong[], name: string): Promise<ITunesPlaylist | null> => {
      console.log("UPDATing...");
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/playlist/${encodeURIComponent(playlist_id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken,
          },
          body: JSON.stringify({ songs, name }),
        });

        if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await res.json();
              if (errorData.error === 'PARTY_ENDED') {
                setError('PARTY_ENDED');
                return null;
              }
              setError(errorData.message || 'Failed to update playlist');
            } catch {
              const text = await res.text();
              setError(text || 'Failed to update playlist');
            }
          } else {
            const text = await res.text();
            setError(text || 'Failed to update playlist');
          }
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
