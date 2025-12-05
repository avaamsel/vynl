import { useState, useEffect } from 'react';
import { ITunesSong } from '@/src/types';
import { useRegion } from '@/src/context/region-context';

export function useSongSearch(query: string) {
  const [results, setResults] = useState<ITunesSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { region, setRegion } = useRegion();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/song/search/${encodeURIComponent(query)}?countries=${region.topCountries.join(",")}`)
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
