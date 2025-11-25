import { useState, useEffect, useCallback } from "react";
import { ITunesPlaylist } from "../types";
import { useAuth } from "../context/auth-context";

export function usePlaylistWithID(playlistId: string | null) {
  const [playlist, setPlaylist] = useState<ITunesPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authToken } = useAuth();

  const fetchPlaylist = useCallback(async () => {
    if (!playlistId) {
      setPlaylist(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/playlist/${playlistId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authToken,
        },
      });

      if (res.status === 404) {
        throw new Error("Playlist not found");
      }
      if (!res.ok) {
        throw new Error("Failed to fetch playlist data");
      }

      const data = await res.json();

      const mapped: ITunesPlaylist = {
        id: data.id,
        name: data.name,
        created_at: data.created_at,
        user_id: data.user_id,
        songs: data.songs,
      };

      setPlaylist(mapped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [playlistId, authToken]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  return { playlist, loading, error, refetch: fetchPlaylist };
}
