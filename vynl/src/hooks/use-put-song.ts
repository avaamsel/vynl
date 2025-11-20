import { useState, useCallback } from 'react';
import { ITunesSong } from '@/src/types';
import { useAuth } from '../context/auth-context';

type UsePutSongResult = {
  loading: boolean;
  error: string | null;
  putSong: (song: ITunesSong) => Promise<boolean>;
};

export function usePutSong(): UsePutSongResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authToken } = useAuth();
  
  const putSong = useCallback(async (song: ITunesSong) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/song', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 
          'Authorization' : 'Bearer ' + authToken,
        },
        body: JSON.stringify(song),
      });

      if (!res.ok) {
        const text = await res.text();
        console.log("res not ok : ", res);
        setError(text || 'Failed to save song');
        setLoading(false);
        return false;
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error putting song:', err);
      setError(err.message || 'Unknown error');
      setLoading(false);
      return false;
    }
  }, []);

  return { loading, error, putSong };
}
