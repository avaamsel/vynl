import { useState, useEffect, useCallback } from "react";
import { ITunesPlaylist, ITunesSong } from "../types";
import { useAuth } from "../context/auth-context";

export function useUserPlaylists(uid: string | null) {
  const [playlists, setPlaylists] = useState<ITunesPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authToken } = useAuth();

  const fetchPlaylists = useCallback(async () => {
    if (!uid) {
      setPlaylists([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("UID : ", uid);
      const res = await fetch(`/api/playlist?uid=${uid}`, {
        method: 'GET', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authToken,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch playlists");

      const data = await res.json();

      const mapped: ITunesPlaylist[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        created_at: p.created_at,
        user_id: p.user_id,
        songs: p.songs
      }));

      //TODO : change order
      mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPlaylists(mapped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid, authToken]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  return { playlists, loading, error, refetch: fetchPlaylists };
}
