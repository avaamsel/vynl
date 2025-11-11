/**
 * Recommendation Service
 * Generates song recommendations based on seed songs and user preferences
 */

export type Song = {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  genre?: string;
  year?: number;
};

// Extended song database with more songs for recommendations
const SONG_DATABASE: Song[] = [
  // Original 10 songs
  { id: '1', title: 'SUPER SHY', artist: 'NEW JEANS', artwork: 'https://i.scdn.co/image/ab67616d00001e023d98a0ae7c78a3a9babaf8af', genre: 'K-Pop', year: 2023 },
  { id: '2', title: 'ESPRESSO', artist: 'SABRINA CARPENTER', artwork: 'https://upload.wikimedia.org/wikipedia/en/7/71/Espresso_-_Sabrina_Carpenter.png', genre: 'Pop', year: 2024 },
  { id: '3', title: 'SNOOZE', artist: 'SZA', artwork: 'https://m.media-amazon.com/images/I/91BazzuLE+L._UF350,350_QL50_.jpg', genre: 'R&B', year: 2022 },
  { id: '4', title: 'THE ADULTS ARE TALKING', artist: 'THE STROKES', artwork: 'https://pics.filmaffinity.com/the_strokes_the_adults_are_talking-770338151-mmed.jpg', genre: 'Rock', year: 2020 },
  { id: '5', title: 'FIRST PERSON SHOOTER', artist: 'DRAKE', artwork: 'https://m.media-amazon.com/images/I/41bNY36ilJL._UXNaN_FMjpg_QL85_.jpg', genre: 'Hip-Hop', year: 2023 },
  { id: '6', title: 'RUSH', artist: 'TROYE SIVAN', artwork: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Troye_Sivan_-_Rush.png', genre: 'Pop', year: 2023 },
  { id: '7', title: 'TQG', artist: 'KAROL G & SHAKIRA', artwork: 'https://i.scdn.co/image/ab67616d0000b27382de1ca074ae63cb18fce335', genre: 'Reggaeton', year: 2023 },
  { id: '8', title: 'CALM DOWN', artist: 'REMA', artwork: 'https://upload.wikimedia.org/wikipedia/en/b/b1/Rema_-_Calm_Down.png', genre: 'Afrobeats', year: 2022 },
  { id: '9', title: 'BAGS', artist: 'CLAIRO', artwork: 'https://i.scdn.co/image/ab67616d0000b27333ccb60f9b2785ef691b2fbc', genre: 'Indie Pop', year: 2019 },
  { id: '10', title: 'HOT GIRL', artist: 'CHARLI XCX', artwork: 'https://i1.sndcdn.com/artworks-19CTU1x0lsAE-0-t500x500.jpg', genre: 'Pop', year: 2022 },
  
  // Additional songs for recommendations
  // K-Pop / Pop
  { id: '11', title: 'DYNAMITE', artist: 'BTS', artwork: 'https://i.scdn.co/image/ab67616d0000b273d5d11b5ac6a3048320a5bad8', genre: 'K-Pop', year: 2020 },
  { id: '12', title: 'FLOWER', artist: 'JISOO', artwork: 'https://i.scdn.co/image/ab67616d0000b27300579961007bd1367935e65e', genre: 'K-Pop', year: 2023 },
  { id: '13', title: 'FEATHER', artist: 'SABRINA CARPENTER', artwork: 'https://i.scdn.co/image/ab67616d0000b273fe7417b8c71f8c0c0f8b1b57', genre: 'Pop', year: 2024 },
  { id: '14', title: 'GOOD 4 U', artist: 'OLIVIA RODRIGO', artwork: 'https://i.scdn.co/image/ab67616d0000b27365d11e2eb203e894a97ed14a', genre: 'Pop', year: 2021 },
  { id: '15', title: 'AS IT WAS', artist: 'HARRY STYLES', artwork: 'https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f0', genre: 'Pop', year: 2022 },
  
  // R&B / Soul
  { id: '16', title: 'KILL BILL', artist: 'SZA', artwork: 'https://i.scdn.co/image/ab67616d0000b27370dbc9f47669d120ad874ec1', genre: 'R&B', year: 2022 },
  { id: '17', title: 'CUFF IT', artist: 'BEYONCÉ', artwork: 'https://i.scdn.co/image/ab67616d0000b2734a8b951ff5979dc187340b1d', genre: 'R&B', year: 2022 },
  { id: '18', title: 'WATER', artist: 'TYLA', artwork: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2e268a8f6f', genre: 'R&B', year: 2023 },
  { id: '19', title: 'LOVE ON TOP', artist: 'BEYONCÉ', artwork: 'https://i.scdn.co/image/ab67616d0000b2734a8b951ff5979dc187340b1d', genre: 'R&B', year: 2011 },
  
  // Rock / Alternative
  { id: '20', title: 'LAST NITE', artist: 'THE STROKES', artwork: 'https://i.scdn.co/image/ab67616d0000b273c5649add07ed3720be9d5526', genre: 'Rock', year: 2001 },
  { id: '21', title: 'REPTILIA', artist: 'THE STROKES', artwork: 'https://i.scdn.co/image/ab67616d0000b273c5649add07ed3720be9d5526', genre: 'Rock', year: 2003 },
  { id: '22', title: 'MR. BRIGHTSIDE', artist: 'THE KILLERS', artwork: 'https://i.scdn.co/image/ab67616d0000b2734ce8b4e4256c733a8e6c0fb9', genre: 'Rock', year: 2003 },
  { id: '23', title: 'ARE YOU GONNA BE MY GIRL', artist: 'JET', artwork: 'https://i.scdn.co/image/ab67616d0000b2734ce8b4e4256c733a8e6c0fb9', genre: 'Rock', year: 2003 },
  
  // Hip-Hop / Rap
  { id: '24', title: 'RICH FLEX', artist: 'DRAKE', artwork: 'https://i.scdn.co/image/ab67616d0000b27341c8b3fd48a2c60e4eb0bf56', genre: 'Hip-Hop', year: 2023 },
  { id: '25', title: 'GOD\'S PLAN', artist: 'DRAKE', artwork: 'https://i.scdn.co/image/ab67616d0000b27341c8b3fd48a2c60e4eb0bf56', genre: 'Hip-Hop', year: 2018 },
  { id: '26', title: 'IN MY FEELINGS', artist: 'DRAKE', artwork: 'https://i.scdn.co/image/ab67616d0000b27341c8b3fd48a2c60e4eb0bf56', genre: 'Hip-Hop', year: 2018 },
  
  // Pop / Electronic
  { id: '27', title: 'BOYS A LIAR PT. 2', artist: 'PINKPANTHERESS', artwork: 'https://i.scdn.co/image/ab67616d0000b273d9194aa18fa4c9362b47464f', genre: 'Pop', year: 2023 },
  { id: '28', title: 'VAMPIRE', artist: 'OLIVIA RODRIGO', artwork: 'https://i.scdn.co/image/ab67616d0000b27365d11e2eb203e894a97ed14a', genre: 'Pop', year: 2023 },
  { id: '29', title: 'CRUEL SUMMER', artist: 'TAYLOR SWIFT', artwork: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2e268a8f6f', genre: 'Pop', year: 2019 },
  
  // Reggaeton / Latin
  { id: '30', title: 'PROVENZA', artist: 'KAROL G', artwork: 'https://i.scdn.co/image/ab67616d0000b27382de1ca074ae63cb18fce335', genre: 'Reggaeton', year: 2022 },
  { id: '31', title: 'SHAKIRA: BZRP MUSIC SESSIONS, VOL. 53', artist: 'Bizarrap & Shakira', artwork: 'https://i.scdn.co/image/ab67616d0000b27382de1ca074ae63cb18fce335', genre: 'Reggaeton', year: 2023 },
  { id: '32', title: 'ME PORTO BONITO', artist: 'BAD BUNNY', artwork: 'https://i.scdn.co/image/ab67616d0000b2734ce8b4e4256c733a8e6c0fb9', genre: 'Reggaeton', year: 2022 },
  
  // Afrobeats
  { id: '33', title: 'ESCAPE', artist: 'KIZZ DANIEL', artwork: 'https://upload.wikimedia.org/wikipedia/en/b/b1/Rema_-_Calm_Down.png', genre: 'Afrobeats', year: 2022 },
  { id: '34', title: 'LOVE NWANTITI', artist: 'CKAY', artwork: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2e268a8f6f', genre: 'Afrobeats', year: 2021 },
  
  // Indie Pop
  { id: '35', title: 'SOFTLY', artist: 'CLAIRO', artwork: 'https://i.scdn.co/image/ab67616d0000b27333ccb60f9b2785ef691b2fbc', genre: 'Indie Pop', year: 2021 },
  { id: '36', title: 'AMERICA\'S SWEETHEART', artist: 'LILHUDDY', artwork: 'https://i.scdn.co/image/ab67616d0000b27333ccb60f9b2785ef691b2fbc', genre: 'Indie Pop', year: 2021 },
  { id: '37', title: 'BOYGENIUS', artist: 'BOYGENIUS', artwork: 'https://i.scdn.co/image/ab67616d0000b27333ccb60f9b2785ef691b2fbc', genre: 'Indie Pop', year: 2023 },
  
  // Electronic / Dance
  { id: '38', title: 'GOOD GIRLS', artist: 'CHARLI XCX', artwork: 'https://i1.sndcdn.com/artworks-19CTU1x0lsAE-0-t500x500.jpg', genre: 'Pop', year: 2022 },
  { id: '39', title: 'SPEED DRIVE', artist: 'CHARLI XCX', artwork: 'https://i1.sndcdn.com/artworks-19CTU1x0lsAE-0-t500x500.jpg', genre: 'Pop', year: 2023 },
  
  // More Pop
  { id: '40', title: 'PADAM PADAM', artist: 'KYLIE MINOGUE', artwork: 'https://i.scdn.co/image/ab67616d0000b273d9194aa18fa4c9362b47464f', genre: 'Pop', year: 2023 },
  { id: '41', title: 'UNHOLY', artist: 'SAM SMITH', artwork: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2e268a8f6f', genre: 'Pop', year: 2022 },
  { id: '42', title: 'ABOUT DAMN TIME', artist: 'LIZZO', artwork: 'https://i.scdn.co/image/ab67616d0000b2734ce8b4e4256c733a8e6c0fb9', genre: 'Pop', year: 2022 },
];

// Genre similarity matrix (for better recommendations)
const GENRE_SIMILARITY: Record<string, string[]> = {
  'K-Pop': ['Pop', 'K-Pop'],
  'Pop': ['K-Pop', 'Pop', 'Indie Pop'],
  'R&B': ['R&B', 'Pop', 'Soul'],
  'Rock': ['Rock', 'Alternative', 'Indie Pop'],
  'Hip-Hop': ['Hip-Hop', 'Rap', 'R&B'],
  'Reggaeton': ['Reggaeton', 'Latin', 'Afrobeats'],
  'Afrobeats': ['Afrobeats', 'Reggaeton', 'R&B'],
  'Indie Pop': ['Indie Pop', 'Pop', 'Rock'],
};

/**
 * Calculate similarity score between two songs
 */
function calculateSimilarity(song1: Song, song2: Song): number {
  let score = 0;
  
  // Same artist gets high score
  if (song1.artist.toLowerCase() === song2.artist.toLowerCase()) {
    score += 50;
  }
  
  // Similar artists (partial match)
  const artist1 = song1.artist.toLowerCase();
  const artist2 = song2.artist.toLowerCase();
  if (artist1.includes(artist2) || artist2.includes(artist1)) {
    score += 20;
  }
  
  // Same genre gets high score
  if (song1.genre && song2.genre && song1.genre === song2.genre) {
    score += 30;
  }
  
  // Similar genres
  if (song1.genre && song2.genre) {
    const similarGenres = GENRE_SIMILARITY[song1.genre] || [];
    if (similarGenres.includes(song2.genre)) {
      score += 15;
    }
  }
  
  // Similar release year (within 3 years)
  if (song1.year && song2.year) {
    const yearDiff = Math.abs(song1.year - song2.year);
    if (yearDiff <= 3) {
      score += 10 - yearDiff * 2;
    }
  }
  
  return score;
}

/**
 * Get recommendations based on seed songs and user preferences
 */
export function getRecommendations(
  seedSongIds: string[],
  likedSongIds: string[] = [],
  passedSongIds: string[] = [],
  count: number = 10,
  excludeIds: string[] = []
): Song[] {
  // Get seed songs from database
  const seedSongs = seedSongIds
    .map(id => SONG_DATABASE.find(s => s.id === id))
    .filter((s): s is Song => s !== undefined);
  
  if (seedSongs.length === 0) {
    // Fallback to first 10 songs if no seeds
    return SONG_DATABASE.slice(0, count).filter(s => !excludeIds.includes(s.id));
  }
  
  // Get all liked songs (seeds + user likes)
  const allLikedSongs = [
    ...seedSongs,
    ...likedSongIds.map(id => SONG_DATABASE.find(s => s.id === id)).filter((s): s is Song => s !== undefined),
  ];
  
  // Calculate similarity scores for all songs
  const candidates = SONG_DATABASE
    .filter(song => 
      !seedSongIds.includes(song.id) &&
      !passedSongIds.includes(song.id) &&
      !excludeIds.includes(song.id)
    )
    .map(song => {
      // Calculate average similarity to all liked songs
      const avgSimilarity = allLikedSongs.length > 0
        ? allLikedSongs.reduce((sum, liked) => sum + calculateSimilarity(liked, song), 0) / allLikedSongs.length
        : 0;
      
      return { song, score: avgSimilarity };
    })
    .sort((a, b) => b.score - a.score); // Sort by score descending
  
  // If we have liked songs, prioritize songs similar to them
  // If we don't have many likes yet, mix high-scoring with some variety
  if (likedSongIds.length > 0) {
    // More likes = more focused recommendations
    return candidates.slice(0, count).map(c => c.song);
  } else {
    // Mix top recommendations with some variety
    const topSongs = candidates.slice(0, Math.floor(count * 0.7)).map(c => c.song);
    const varietySongs = candidates
      .slice(Math.floor(count * 0.7))
      .filter((_, i) => i % 2 === 0) // Take every other for variety
      .slice(0, count - topSongs.length)
      .map(c => c.song);
    return [...topSongs, ...varietySongs];
  }
}

/**
 * Get initial recommendations based on seed songs
 */
export function getInitialRecommendations(seedSongIds: string[], count: number = 10): Song[] {
  return getRecommendations(seedSongIds, [], [], count);
}

/**
 * Get more recommendations based on current preferences
 */
export function getMoreRecommendations(
  seedSongIds: string[],
  likedSongIds: string[],
  passedSongIds: string[],
  alreadyShownIds: string[],
  count: number = 10
): Song[] {
  return getRecommendations(seedSongIds, likedSongIds, passedSongIds, count, alreadyShownIds);
}

/**
 * Get a song by ID
 */
export function getSongById(id: string): Song | undefined {
  return SONG_DATABASE.find(s => s.id === id);
}

/**
 * Get all seed songs by IDs
 */
export function getSongsByIds(ids: string[]): Song[] {
  return ids
    .map(id => SONG_DATABASE.find(s => s.id === id))
    .filter((s): s is Song => s !== undefined);
}

