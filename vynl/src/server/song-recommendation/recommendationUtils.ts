import { LastFmService } from "../../services/music-providers/lastfm-provider";
import { ITunesSong, LastFmSong } from "../../types/";

// Helper to shuffle an array in-place
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export async function getRecommendationsForSongTable(
  songTable: ITunesSong[],
  n: number
): Promise<LastFmSong[]> {
  const lastFm = new LastFmService();

  if (n > 10 * songTable.length) {
    throw new Error(
      `n cannot be greater than 10 * number of seed songs. Got n=${n}, seeds=${songTable.length}`
    );
  }

  // Check the songs all exist in the database 
  const titleArtistPair: {title: string, artist: string}[] = [];

  for (const song of songTable) {
    let exists = await lastFm.trackExists(song.artist, song.title);
    if (exists) {
      titleArtistPair.push({title: exists.title, artist: exists.artist});
    }
    else {
      console.log("Track doesn't exactly match, searching for similar...");
      
      const tracks = await lastFm.searchTracks(song.title + song.artist)
      if (tracks.length > 0) {
        const first = tracks[0];
        titleArtistPair.push({title: first.title, artist: first.artist});
      } else {
        console.log("No tracks found.");
      }
    }
  }

  if (titleArtistPair.length === 0) {
    throw new Error("None of the provided songs exist in Last.fm database.");
  }

  const allRecommendations: LastFmSong[] = [];
  for (const song of titleArtistPair) {
    const similar = await lastFm.getSimilarTracks(song.artist, song.title, 10);
    // Map Last.fm result to our Song type
    const mapped = similar.map((t: any) => ({
      artist: t.artist?.name ?? t.artist,
      title: t.name,
      song_id: t.mbid,
      duration_sec: t.duration ? t.duration : null,
    }));
    allRecommendations.push(...mapped);
  }

  const uniqueRecommendations = allRecommendations.filter(
    (s) =>
      !titleArtistPair.some(
        (p) => p.artist === s.artist && p.title === s.title
      )
  );

  if (uniqueRecommendations.length == 0) {
    throw new Error("No recommendation could be found for your seed songs.");
  }

  const countMap: Map<string, { song: LastFmSong; count: number }> = new Map();
  for (const rec of uniqueRecommendations) {
    const key = `${rec.artist}||${rec.title}`;
    if (countMap.has(key)) {
      countMap.get(key)!.count += 1;
    } else {
      countMap.set(key, { song: rec, count: 1 });
    }
  }

  // Group by count
  const groupedByCount: Map<number, { song: LastFmSong; count: number }[]> = new Map();
  for (const entry of countMap.values()) {
    const group = groupedByCount.get(entry.count) ?? [];
    group.push(entry);
    groupedByCount.set(entry.count, group);
  }

  // Sort counts descending, shuffle within each group, flatten, slice top n
  const topRecommendations: LastFmSong[] = Array.from(groupedByCount.keys())
    .sort((a, b) => b - a) // descending by count
    .flatMap(count => shuffleArray(groupedByCount.get(count)!)) // shuffle within same count
    .slice(0, n)
    .map(entry => entry.song);

  return topRecommendations;
}
