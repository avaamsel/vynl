import { useState, useEffect } from 'react';
import { ITunesSong } from '@/src/types';

export function useSongSearch(query: string) {
  const [results, setResults] = useState<ITunesSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/song/search/${encodeURIComponent(query)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => setResults(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [query]);

  return { results, loading, error };
}
