import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView, View, Text, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savePlaylist, updatePlaylist, getPlaylist, type Song as PlaylistSong } from '@/src/utils/playlistStorage';
import AppButton from '@/src/components/AppButton';
import { 
  getInitialRecommendations, 
  getMoreRecommendations, 
  getSongById,
  type Song 
} from '@/src/utils/recommendationService';

const { width, height } = Dimensions.get('window');
const DISC_SIZE = Math.min(width * 0.78, 320);
const LABEL_SIZE = DISC_SIZE * 0.38;   // center label with artwork
const HOLE_SIZE  = DISC_SIZE * 0.04;
const SWIPE_THRESHOLD = width * 0.28;
const ROTATION = 12;
const INITIAL_BATCH_SIZE = 10;
const LOAD_MORE_THRESHOLD = 7; // Load more when user reaches this index
const LOAD_MORE_BATCH_SIZE = 10;
const MAX_SWIPES = 10; // Stop swiping after this many swipes and prompt for playlist

const BLUR = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';

function PauseIcon() {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      <View style={{ width: 8, height: 28, borderRadius: 2, backgroundColor: 'white' }} />
      <View style={{ width: 8, height: 28, borderRadius: 2, backgroundColor: 'white' }} />
    </View>
  );
}

/** Spinning vinyl disc with artwork label. Resets cleanly per track and never distorts. */
function VinylDisc({ spinning, artwork }: { spinning: boolean; artwork: string }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // reset animation whenever artwork or spinning changes to avoid carry-over frames
    spin.stopAnimation(() => {
      spin.setValue(0);
      if (spinning) {
        Animated.loop(
          Animated.timing(spin, { toValue: 1, duration: 6000, useNativeDriver: true })
        ).start();
      }
    });
    return () => spin.stopAnimation();
  }, [spinning, artwork]);

  const rotateDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      key={artwork}
      style={[styles.vinylCenter, { transform: [{ rotate: rotateDeg }] }]}
    >
      {/* outer black disc */}
      <View style={[styles.disc, { width: DISC_SIZE, height: DISC_SIZE, borderRadius: DISC_SIZE / 2 }]} />
      {/* subtle rings for depth */}
      <View style={[styles.ring, { width: DISC_SIZE * 0.92, height: DISC_SIZE * 0.92, borderRadius: (DISC_SIZE * 0.92) / 2 }]} />
      <View style={[styles.ring, { width: DISC_SIZE * 0.76, height: DISC_SIZE * 0.76, borderRadius: (DISC_SIZE * 0.76) / 2 }]} />
      <View style={[styles.ring, { width: DISC_SIZE * 0.60, height: DISC_SIZE * 0.60, borderRadius: (DISC_SIZE * 0.60) / 2 }]} />
      {/* glossy highlight to prevent “wonky” look */}
      <View style={[styles.gloss, { width: DISC_SIZE * 0.9, height: DISC_SIZE * 0.9, borderRadius: (DISC_SIZE * 0.9) / 2 }]} />
      {/* artwork label */}
      <Image
        source={{ uri: artwork }}
        style={{ width: LABEL_SIZE, height: LABEL_SIZE, borderRadius: LABEL_SIZE / 2, position: 'absolute' }}
        contentFit="cover"
        placeholder={BLUR}
        transition={200}
        recyclingKey={artwork}
        cachePolicy="memory-disk"
      />
      {/* center hole */}
      <View
        style={{
          position: 'absolute',
          width: HOLE_SIZE,
          height: HOLE_SIZE,
          borderRadius: HOLE_SIZE / 2,
          backgroundColor: '#ececec',
        }}
      />
    </Animated.View>
  );
}

const SWIPE_SESSION_KEY = '@vynl:swipe_session';

type SwipeHistory = {
  songId: string;
  direction: 'left' | 'right';
  index: number;
};

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Swiping() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [playing, setPlaying] = useState(true);
  const [swipeHistory, setSwipeHistory] = useState<SwipeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playlistName, setPlaylistName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [playlistSaved, setPlaylistSaved] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [shownSongIds, setShownSongIds] = useState<string[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [shouldContinueAfterLoad, setShouldContinueAfterLoad] = useState(false);
  
  const playlistId = params.playlistId as string | undefined;
  const isAddingMode = params.mode === 'add' && !!playlistId;
  
  const position = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const previousSongsLengthRef = useRef(0);
  
  // Get seed songs from params
  const seedSongIds = useMemo(() => {
    if (params.s1 && params.s2) {
      return [params.s1 as string, params.s2 as string];
    }
    return [];
  }, [params.s1, params.s2]);
  
  // Load playlist name if in add mode
  useEffect(() => {
    const loadPlaylistName = async () => {
      if (isAddingMode && playlistId) {
        try {
          // Try to get from params first (faster)
          if (params.playlistName) {
            setPlaylistName(params.playlistName as string);
          } else {
            // Fallback: load from storage
            const playlist = await getPlaylist(playlistId);
            if (playlist) {
              setPlaylistName(playlist.name);
            }
          }
        } catch (error) {
          console.error('Error loading playlist name:', error);
        }
      }
    };
    
    loadPlaylistName();
  }, [isAddingMode, playlistId, params.playlistName]);

  // Load initial songs based on seed songs or playlist songs
  const loadInitialSongs = useCallback(async () => {
    let songsToUseForRecommendations: string[] = [];
    
    // If we have seed songs, use them
    if (seedSongIds.length > 0) {
      songsToUseForRecommendations = seedSongIds;
    } else if (isAddingMode && playlistId) {
      // In add mode, try to get songs from the existing playlist to use as seeds
      try {
        console.log('Loading playlist for seed songs, playlistId:', playlistId);
        const playlist = await getPlaylist(playlistId);
        console.log('Loaded playlist:', playlist ? `has ${playlist.songs.length} songs` : 'null');
        if (playlist && playlist.songs.length > 0) {
          // Use up to 2 songs from the playlist as seed songs
          // Prefer songs that haven't been shown yet
          const playlistSongIds = playlist.songs.map(s => s.id);
          songsToUseForRecommendations = playlistSongIds.slice(0, 2);
          console.log('Using playlist songs as seeds:', songsToUseForRecommendations);
        } else {
          console.warn('Playlist is empty or not found, will use fallback');
        }
      } catch (error) {
        console.error('Error loading playlist for seed songs:', error);
      }
    }
    
    // If we still don't have seed songs, we can't generate recommendations
    if (songsToUseForRecommendations.length === 0) {
      if (isAddingMode) {
        // In add mode, if playlist is empty, try to use some default songs from the database
        // Or we could redirect to song selection, but for now let's use a fallback
        console.warn('No seed songs available in add mode - playlist may be empty, using fallback');
        // Use first two songs from the database as fallback seeds
        const fallbackSongs = ['1', '2']; // Use first two songs as fallback
        songsToUseForRecommendations = fallbackSongs;
      } else {
        // In create mode, seed songs are required
        setSongs([]);
        return;
      }
    }
    
    // Final check - if we still don't have seed songs, we can't proceed
    if (songsToUseForRecommendations.length === 0) {
      console.error('Unable to get seed songs for recommendations');
      setSongs([]);
      return;
    }
    
    try {
      // Get initial recommendations and randomize order
      const recommendations = getInitialRecommendations(songsToUseForRecommendations, INITIAL_BATCH_SIZE);
      console.log('Got', recommendations.length, 'recommendations for seed songs:', songsToUseForRecommendations);
      const shuffled = shuffleArray(recommendations);
      console.log('Setting', shuffled.length, 'songs to state');
      setSongs(shuffled);
      // Track seed songs as shown (they're not in recommendations but user selected them)
      setShownSongIds(songsToUseForRecommendations);
    } catch (error) {
      console.error('Error loading initial songs:', error);
      setSongs([]);
    }
  }, [seedSongIds, isAddingMode, playlistId]);

  // Get seed songs for recommendations (either from params or playlist)
  const getSeedSongsForRecommendations = useCallback(async (): Promise<string[]> => {
    // If we have seed songs from params, use them
    if (seedSongIds.length > 0) {
      return seedSongIds;
    }
    
    // In add mode, try to get songs from the existing playlist
    if (isAddingMode && playlistId) {
      try {
        const playlist = await getPlaylist(playlistId);
        if (playlist && playlist.songs.length > 0) {
          // Use up to 2 songs from the playlist as seed songs
          return playlist.songs.map(s => s.id).slice(0, 2);
        } else {
          // Playlist is empty, use fallback songs
          console.warn('Playlist is empty, using fallback seed songs');
          return ['1', '2']; // Use first two songs as fallback
        }
      } catch (error) {
        console.error('Error loading playlist for seed songs:', error);
        // On error, use fallback songs in add mode
        if (isAddingMode) {
          return ['1', '2'];
        }
      }
    }
    
    return [];
  }, [seedSongIds, isAddingMode, playlistId]);

  // Load more songs when user is getting close to the end
  const loadMoreSongs = useCallback(async (): Promise<void> => {
    if (isLoadingMore) return;
    
    const currentSeedSongs = await getSeedSongsForRecommendations();
    if (currentSeedSongs.length === 0) {
      console.warn('No seed songs available for loading more songs');
      return;
    }
    
    setIsLoadingMore(true);
    try {
      // Get all songs that have been shown (including seed songs, liked, passed, and all shown)
      const allShownIds = [
        ...currentSeedSongs,
        ...shownSongIds,
        ...liked,
        ...passed,
      ];
      
      // Remove duplicates
      const uniqueShownIds = Array.from(new Set(allShownIds));
      
      // Get more recommendations excluding all shown songs
      const moreRecommendations = getMoreRecommendations(
        currentSeedSongs,
        liked,
        passed,
        uniqueShownIds,
        LOAD_MORE_BATCH_SIZE
      );
      
      if (moreRecommendations.length > 0) {
        // Randomize the new batch
        const shuffled = shuffleArray(moreRecommendations);
        // Append to existing songs
        setSongs(prev => [...prev, ...shuffled]);
      }
    } catch (error) {
      console.error('Error loading more songs:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [shownSongIds, liked, passed, isLoadingMore, getSeedSongsForRecommendations]);

  // Reset state function
  const resetState = useCallback(async (preservePlaylistName = false) => {
    setIndex(0);
    setLiked([]);
    setPassed([]);
    setSwipeHistory([]);
    setShownSongIds([]);
    if (!preservePlaylistName) {
      setPlaylistName('');
    }
    setPlaylistSaved(false);
    setIsSaving(false);
    setPlaying(true);
    position.setValue({ x: 0, y: 0 });
    cardOpacity.setValue(1);
    // Reload initial songs
    await loadInitialSongs();
  }, [position, cardOpacity, loadInitialSongs]);

  // Clear session from storage
  const clearSession = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SWIPE_SESSION_KEY);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }, []);

  // Load session state on mount or when params change
  useEffect(() => {
    const loadSession = async () => {
      try {
        // In add mode, we don't require seed songs from params - we'll use playlist songs
        // In create mode, seed songs are required
        if (!isAddingMode && (!params.s1 || !params.s2)) {
          await clearSession();
          await resetState();
          setIsLoading(false);
          return;
        }

        // For add mode, always start fresh (don't restore session)
        // For create mode, check for saved session
        if (isAddingMode) {
          // In add mode, load songs based on playlist
          console.log('Loading songs in add mode for playlist:', playlistId);
          await loadInitialSongs();
          // Note: songs state will update asynchronously, so we set loading to false
          // The component will re-render when songs are set
          setIsLoading(false);
          return;
        }

        // Create mode: check for saved session
        const savedSession = await AsyncStorage.getItem(SWIPE_SESSION_KEY);
        if (savedSession) {
          const session = JSON.parse(savedSession);
          // Only restore if we have the same seed songs
          if (session.s1 === params.s1 && session.s2 === params.s2) {
            setIndex(session.index || 0);
            setLiked(session.liked || []);
            setPassed(session.passed || []);
            setSwipeHistory(session.swipeHistory || []);
            setShownSongIds(session.shownSongIds || seedSongIds);
            // Restore songs if available, otherwise load fresh
            if (session.songs && Array.isArray(session.songs) && session.songs.length > 0) {
              setSongs(session.songs);
            } else {
              await loadInitialSongs();
            }
          } else {
            // Different session, clear old data
            await clearSession();
            await resetState();
            await loadInitialSongs();
          }
        } else {
          // No saved session, start fresh
          await loadInitialSongs();
        }
      } catch (error) {
        console.error('Error loading session:', error);
        await loadInitialSongs();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSession();
  }, [params.s1, params.s2, resetState, clearSession, seedSongIds, loadInitialSongs, isAddingMode]);

  // Load more songs when user is close to the end
  useEffect(() => {
    if (songs.length > 0 && index >= LOAD_MORE_THRESHOLD && index < songs.length - 2) {
      // Check if we need to load more
      const remaining = songs.length - index;
      if (remaining <= 3 && !isLoadingMore) {
        loadMoreSongs().catch(err => console.error('Error auto-loading more songs:', err));
      }
    }
    // In add mode, automatically load more songs when we run out (unless we're already loading)
    // Check if we've run out of songs (index >= songs.length) but not due to max swipes
    const hasRunOutOfSongs = songs.length > 0 && index >= songs.length;
    const totalSwipes = swipeHistory.length;
    const isMaxSwipesReached = !isAddingMode && totalSwipes >= MAX_SWIPES;
    if (isAddingMode && hasRunOutOfSongs && !isLoadingMore && !isMaxSwipesReached) {
      loadMoreSongs().catch(err => console.error('Error auto-loading more songs in add mode:', err));
    }
  }, [index, songs.length, loadMoreSongs, isLoadingMore, isAddingMode, swipeHistory.length]);

  // Track shown songs when index changes
  useEffect(() => {
    if (songs.length > 0 && index < songs.length) {
      const currentSong = songs[index];
      if (currentSong && !shownSongIds.includes(currentSong.id)) {
        setShownSongIds(prev => [...prev, currentSong.id]);
      }
    }
  }, [index, songs, shownSongIds]);

  // Handle continuing after loading more songs
  useEffect(() => {
    if (shouldContinueAfterLoad && !isLoadingMore && songs.length > previousSongsLengthRef.current) {
      // Songs have been loaded, continue from where we were
      const continueIndex = previousSongsLengthRef.current;
      setIndex(continueIndex);
      setPlaylistSaved(false);
      setPlaying(true);
      position.setValue({ x: 0, y: 0 });
      cardOpacity.setValue(1);
      setShouldContinueAfterLoad(false);
      Haptics.selectionAsync();
    }
    // Update ref when songs length changes
    if (songs.length !== previousSongsLengthRef.current) {
      previousSongsLengthRef.current = songs.length;
    }
  }, [songs.length, shouldContinueAfterLoad, isLoadingMore, position, cardOpacity]);

  // Clear session when component comes into focus without params (user navigated back)
  useFocusEffect(
    useCallback(() => {
      // In add mode, we don't require seed songs, so don't clear
      if (isAddingMode) {
        return;
      }
      // In create mode, require seed songs
      if (!params.s1 || !params.s2) {
        // No seed songs, clear session and reset state
        clearSession();
        resetState().catch(err => console.error('Error resetting state:', err));
      }
    }, [params.s1, params.s2, clearSession, resetState, isAddingMode])
  );

  // Save session state whenever it changes (only if we have seed songs)
  useEffect(() => {
    if (!isLoading && params.s1 && params.s2) {
      const saveSession = async () => {
        try {
          const session = {
            s1: params.s1,
            s2: params.s2,
            index,
            liked,
            passed,
            swipeHistory,
            shownSongIds,
            songs, // Save current songs array
          };
          await AsyncStorage.setItem(SWIPE_SESSION_KEY, JSON.stringify(session));
        } catch (error) {
          console.error('Error saving session:', error);
        }
      };
      saveSession();
    }
  }, [index, liked, passed, swipeHistory, shownSongIds, songs, isLoading, params.s1, params.s2]);

  const top = songs[index];
  const next = songs[index + 1];
  // Finished when: we've made ~10 swipes (only in create mode, not add mode) OR we've run out of songs
  const totalSwipes = swipeHistory.length;
  // In add mode, don't stop after MAX_SWIPES - allow continuous swiping
  // In create mode, stop after MAX_SWIPES to prompt for playlist creation
  const finished = songs.length === 0 || index >= songs.length || (!isAddingMode && totalSwipes >= MAX_SWIPES);

  useEffect(() => {
    if (top) Image.prefetch(top.artwork).catch(() => {});
    if (next) Image.prefetch(next.artwork).catch(() => {});
  }, [index]);

  // fade in the new top card on index change
  useEffect(() => {
    cardOpacity.setValue(0);
    requestAnimationFrame(() => {
      Animated.timing(cardOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  }, [index]);

  // swipe gestures
  const rotateCard = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [`-${ROTATION}deg`, '0deg', `${ROTATION}deg`],
  });
  const likeOpacity = position.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  // Use ref to store current index and swipe history to avoid closure issues
  const indexRef = useRef(index);
  const swipeHistoryRef = useRef(swipeHistory);
  useEffect(() => {
    indexRef.current = index;
    swipeHistoryRef.current = swipeHistory;
  }, [index, swipeHistory]);

  const swipe = useCallback((dir: 'left' | 'right', vy: number) => {
    // Get current values from refs to ensure we have the latest values
    const currentIndex = indexRef.current;
    const currentSwipes = swipeHistoryRef.current.length;
    const currentSong = songs[currentIndex];
    
    if (!currentSong) return;
    
    // Check if we've reached the max swipe limit (only in create mode, not add mode)
    // In add mode, allow unlimited swipes
    if (!isAddingMode && currentSwipes >= MAX_SWIPES) {
      // Don't allow more swipes, user should create playlist
      console.log('Max swipes reached, cannot swipe more');
      return;
    }
    
    console.log('Swiping', dir, 'song:', currentSong.id, currentSong.title, 'at index:', currentIndex, 'swipes:', currentSwipes + 1);
    
    const toX = dir === 'right' ? width * 1.3 : -width * 1.3;
    Haptics.selectionAsync();
    Animated.timing(position, { toValue: { x: toX, y: vy * 16 }, duration: 220, useNativeDriver: true }).start(() => {
      // Add to history for undo functionality using functional update
      setSwipeHistory(prev => {
        const newHistory = [...prev, { songId: currentSong.id, direction: dir, index: currentIndex }];
        // Check if we've reached max swipes after this swipe
        const willReachMax = newHistory.length >= MAX_SWIPES;
        
        // Track as shown (use functional update to avoid closure issues)
        setShownSongIds(prevShown => {
          if (!prevShown.includes(currentSong.id)) {
            return [...prevShown, currentSong.id];
          }
          return prevShown;
        });
        
        if (dir === 'right') {
          setLiked(arr => {
            const newArr = [...arr, currentSong.id];
            console.log('Liked songs after swipe:', newArr);
            return newArr;
          });
        } else {
          setPassed(arr => [...arr, currentSong.id]);
        }
        
        // reset transform then advance next frame to avoid one-frame ghost
        position.setValue({ x: 0, y: 0 });
        requestAnimationFrame(() => {
          // In add mode, always advance (no max swipe limit)
          // In create mode, stop advancing if we've reached max swipes
          if (isAddingMode || !willReachMax) {
            setIndex(i => i + 1);
          } else {
            // We've reached max swipes in create mode, advance index but finished state will trigger
            setIndex(i => Math.min(i + 1, songs.length));
          }
          setPlaying(true);
        });
        
        return newHistory;
      });
    });
  }, [songs, position, isAddingMode]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
        onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_, { dx, vy }) => {
          if (dx > SWIPE_THRESHOLD) swipe('right', vy);
          else if (dx < -SWIPE_THRESHOLD) swipe('left', vy);
          else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 6 }).start();
        },
      }),
    [swipe]
  );

  const undo = () => {
    if (swipeHistory.length === 0) return;
    
    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    
    // Remove from liked or passed
    if (lastSwipe.direction === 'right') {
      setLiked(arr => arr.filter(id => id !== lastSwipe.songId));
    } else {
      setPassed(arr => arr.filter(id => id !== lastSwipe.songId));
    }
    
    // Reset card position and opacity
    position.setValue({ x: 0, y: 0 });
    cardOpacity.setValue(0);
    
    // Go back to previous index
    setIndex(lastSwipe.index);
    
    // Fade in the card
    requestAnimationFrame(() => {
      Animated.timing(cardOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
    
    // Remove from history
    setSwipeHistory(prev => prev.slice(0, -1));
    
    setPlaying(true);
    Haptics.selectionAsync();
  };

  const programmatic = (dir: 'left' | 'right') => swipe(dir, 0);

  const handleSavePlaylist = async () => {
    if (isAddingMode) {
      // Adding to existing playlist - no name needed
      if (isSaving || !playlistId) return;
    } else {
      // Creating new playlist - name required
      if (!playlistName.trim() || isSaving) return;
    }
    
    setIsSaving(true);
    try {
      // Convert liked song IDs to Song objects using recommendation service
      const likedSongs: PlaylistSong[] = liked
        .map(songId => {
          const song = getSongById(songId);
          return song ? {
            id: song.id,
            title: song.title,
            artist: song.artist,
            artwork: song.artwork,
          } : null;
        })
        .filter((song): song is PlaylistSong => song !== null);

      if (isAddingMode && playlistId) {
        // Add songs to existing playlist
        const existingPlaylist = await getPlaylist(playlistId);
        if (existingPlaylist) {
          // Merge songs, avoiding duplicates
          const existingSongIds = new Set(existingPlaylist.songs.map(s => s.id));
          const newSongs = likedSongs.filter(s => !existingSongIds.has(s.id));
          const updatedSongs = [...existingPlaylist.songs, ...newSongs];
          await updatePlaylist(playlistId, { songs: updatedSongs });
          // Ensure playlist name is set from the loaded playlist
          if (!playlistName || playlistName !== existingPlaylist.name) {
            setPlaylistName(existingPlaylist.name);
          }
        }
      } else {
        // Create new playlist
        const playlist = {
          id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: playlistName.trim(),
          songs: likedSongs,
          createdAt: Date.now(),
        };
        await savePlaylist(playlist);
      }

      setPlaylistSaved(true);
      // Clear session after saving playlist
      await clearSession();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving playlist:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  // Don't render until session is loaded and songs are ready
  // In add mode, we don't require seedSongIds, so check differently
  const shouldShowLoading = isLoading || 
    (!isAddingMode && seedSongIds.length > 0 && songs.length === 0 && !finished) ||
    (isAddingMode && songs.length === 0 && !finished && !playlistSaved);
  
  if (shouldShowLoading) {
    console.log('Showing loading screen. isLoading:', isLoading, 'isAddingMode:', isAddingMode, 'songs.length:', songs.length, 'finished:', finished, 'playlistSaved:', playlistSaved);
    return (
      <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={{ flex: 1 }}>
        <SafeAreaView style={styles.wrap}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#F28695" />
            <Text style={{ color: '#001133', marginTop: 16 }}>Loading songs...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.wrap}>
        {/* top bar with undo and home button */}
      <View style={styles.topbar}>
        {/* Undo Button */}
        <TouchableOpacity 
          style={[styles.topBtn, swipeHistory.length === 0 && styles.topBtnDisabled]} 
          onPress={undo}
          disabled={swipeHistory.length === 0}
        >
          <FontAwesome name="undo" size={24} color={swipeHistory.length === 0 ? "#CCCCCC" : "#F28695"} />
        </TouchableOpacity>


        <Text style={styles.counter}>
          {isAddingMode 
            ? `${swipeHistory.length} swipes` 
            : `${swipeHistory.length}/${MAX_SWIPES} swipes`
          }
        </Text>

        {/* Home Button */}
        <TouchableOpacity style={styles.topBtn} onPress={() => router.push('/')}>
          <Feather name="home" size={22} color="#F28695" />
        </TouchableOpacity>
      </View>


        {/* centered deck */}
        <View style={styles.deck}>
          {/* next card behind for depth - hide when playlist is saved or confirmation screen is showing */}
          {next && !playlistSaved && !finished && (
            <View key={next.id} style={[styles.card, styles.cardUnder]}>
              <View style={styles.media}>
                <VinylDisc spinning={false} artwork={next.artwork} />
                <Text numberOfLines={1} style={styles.song}>{next.title}</Text>
                <Text numberOfLines={1} style={styles.artist}>{next.artist}</Text>
              </View>
            </View>
          )}

          {!finished && top && !playlistSaved && (
            <Animated.View
              key={top.id}
              style={[
                styles.card,
                {
                  opacity: cardOpacity,
                  transform: [{ translateX: position.x }, { translateY: position.y }, { rotate: rotateCard }],
                },
              ]}
              {...pan.panHandlers}
              renderToHardwareTextureAndroid
              removeClippedSubviews
            >
              <View style={styles.media}>
                <VinylDisc spinning={playing} artwork={top.artwork} />
                <Text numberOfLines={1} style={styles.song}>{top.title}</Text>
                <Text numberOfLines={1} style={styles.artist}>{top.artist}</Text>
              </View>

              {/* swipe banners */}
              <Animated.View style={[styles.banner, styles.bannerLike, { opacity: likeOpacity }]}>
                <Text style={styles.bannerText}>LIKE</Text>
              </Animated.View>
              <Animated.View style={[styles.banner, styles.bannerNope, { opacity: nopeOpacity }]}>
                <Text style={styles.bannerText}>NOPE</Text>
              </Animated.View>

              {/* bottom buttons */}
              <View style={styles.controls}>
                <TouchableOpacity 
                  style={[styles.pill, styles.pillGhost, finished && styles.pillDisabled]} 
                  onPress={() => !finished && programmatic('left')}
                  disabled={finished}
                >
                  <Text style={[styles.pillIcon, { color: finished ? '#CCCCCC' : '#F28695' }]}>✕</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.pill, styles.pillPrimary]} onPress={() => setPlaying(p => !p)} activeOpacity={0.9}>
                  {playing ? <PauseIcon /> : <Text style={[styles.pillIcon, { color: 'white' }]}>▶︎</Text>}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.pill, styles.pillGhost, finished && styles.pillDisabled]} 
                  onPress={() => !finished && programmatic('right')}
                  disabled={finished}
                >
                  <Text style={[styles.pillIcon, { color: finished ? '#CCCCCC' : '#F28695' }]}>♥</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {finished && !playlistSaved && !isLoadingMore && (isAddingMode ? liked.length > 0 : true) && (
            <View style={styles.confirmationContainer}>
              <ScrollView 
                style={styles.confirmationScrollView}
                contentContainerStyle={styles.confirmationScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.confirmationTitle}>
                  {isAddingMode ? 'Add Songs to Playlist' : 'Create Your Playlist'}
                </Text>
                <Text style={styles.confirmationSubtitle}>
                  {isAddingMode 
                    ? playlistName 
                      ? `You liked ${liked.length} song${liked.length !== 1 ? 's' : ''} to add to "${playlistName}"`
                      : `You liked ${liked.length} song${liked.length !== 1 ? 's' : ''} to add to this playlist`
                    : totalSwipes >= MAX_SWIPES
                      ? `You've swiped through ${MAX_SWIPES} songs and liked ${liked.length} song${liked.length !== 1 ? 's' : ''}. Ready to create your playlist?`
                    : `You liked ${liked.length} song${liked.length !== 1 ? 's' : ''}`
                  }
                </Text>
                
                {!isAddingMode && (
                  <View style={styles.nameInputContainer}>
                    <Text style={styles.inputLabel}>Playlist Name</Text>
                    <TextInput
                      style={styles.nameInput}
                      placeholder="Enter playlist name..."
                      placeholderTextColor="#999"
                      value={playlistName}
                      onChangeText={setPlaylistName}
                      autoFocus
                    />
                  </View>
                )}

                <View style={styles.songsPreview}>
                  <Text style={styles.previewTitle}>Songs in playlist:</Text>
                  <ScrollView 
                    style={styles.songsList} 
                    contentContainerStyle={styles.songsListContent}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    {liked.map((songId, idx) => {
                      const song = getSongById(songId);
                      return song ? (
                        <View key={`${songId}-${idx}`} style={styles.songPreviewItem}>
                          <Image
                            source={{ uri: song.artwork }}
                            style={styles.previewArtwork}
                            contentFit="cover"
                          />
                          <View style={styles.previewSongInfo}>
                            <Text style={styles.previewSongTitle}>{song.title}</Text>
                            <Text style={styles.previewSongArtist}>{song.artist}</Text>
                          </View>
                        </View>
                      ) : null;
                    })}
                  </ScrollView>
                </View>
              </ScrollView>

              <View style={styles.confirmationButtons}>
                <AppButton
                  title={isAddingMode ? "Add Songs" : "Save Playlist"}
                  onPress={handleSavePlaylist}
                  disabled={(!isAddingMode && !playlistName.trim()) || isSaving}
                  backgroundColor="#F28695"
                  textColor="#FFFFFF"
                />
                {!isAddingMode && (
                  <AppButton
                    title={isLoadingMore ? "Loading..." : "Continue Swiping"}
                    onPress={async () => {
                      // Reset swipe count to allow more swipes
                      setSwipeHistory([]);
                      // Mark that we want to continue after loading
                      previousSongsLengthRef.current = songs.length;
                      setShouldContinueAfterLoad(true);
                      await loadMoreSongs();
                    }}
                    disabled={isLoadingMore}
                    backgroundColor="#FFFFFF"
                    textColor="#F28695"
                  />
                )}
                {isAddingMode && (
                  <AppButton
                    title={isLoadingMore ? "Loading..." : "Continue Adding Songs"}
                    onPress={async () => {
                      // In add mode, just continue swiping - load more songs if needed
                      previousSongsLengthRef.current = songs.length;
                      setShouldContinueAfterLoad(true);
                      await loadMoreSongs();
                    }}
                    disabled={isLoadingMore}
                    backgroundColor="#FFFFFF"
                    textColor="#F28695"
                  />
                )}
              </View>
            </View>
          )}

          {finished && playlistSaved && (
            <View style={styles.done}>
              <Text style={styles.doneTitle}>
                {isAddingMode ? 'Songs Added! 🎉' : 'Playlist Saved! 🎉'}
              </Text>
              <Text style={styles.doneSub}>{playlistName}</Text>
              <View style={styles.doneButtons}>
                {isAddingMode ? (
                  <AppButton
                    title="Back to Playlist"
                    onPress={async () => {
                      await clearSession();
                      // Don't reset playlist name when going back in add mode
                      resetState(true);
                      router.push({
                        pathname: '/(tabs)/playlist-detail',
                        params: { id: playlistId }
                      });
                    }}
                    backgroundColor="#F28695"
                    textColor="#FFFFFF"
                    width="80%"
                  />
                ) : (
                  <>
                    <AppButton
                      title="View Playlists"
                      onPress={async () => {
                        await clearSession();
                        router.push('/(tabs)/playlists');
                      }}
                      backgroundColor="#F28695"
                      textColor="#FFFFFF"
                      width="80%"
                    />
                    <AppButton
                      title={isLoadingMore ? "Loading..." : "Continue Swiping"}
                      onPress={async () => {
                        // Reset swipe count to allow more swipes
                        setSwipeHistory([]);
                        // Mark that we want to continue after loading
                        previousSongsLengthRef.current = songs.length;
                        setShouldContinueAfterLoad(true);
                        await loadMoreSongs();
                      }}
                      disabled={isLoadingMore}
                      backgroundColor="#FFFFFF"
                      textColor="#F28695"
                      width="80%"
                    />
                    <AppButton
                      title="Start New Session"
                      onPress={async () => {
                        await clearSession();
                        resetState();
                        router.push('/(tabs)/UploadSongs');
                      }}
                      backgroundColor="#FFFFFF"
                      textColor="#000000"
                      width="80%"
                    />
                  </>
                )}
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 18 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginHorizontal: 18},
  topBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
  },
  topBtnDisabled: {
    opacity: 0.5,
  },
  topIcon: { fontSize: 20, color: '#F28695', fontWeight: '700' },
  counter: { fontSize: 18, color: '#001133', fontWeight: '700' },

  deck: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  card: {
    position: 'absolute',
    width: Math.min(width * 0.9, 380),
    height: Math.min(height * 0.7, 560),
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.98)',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardUnder: { transform: [{ scale: 0.97 }, { translateY: 10 }] },

  // perfectly centered vinyl
  vinylCenter: { alignItems: 'center', justifyContent: 'center' },

  // group vinyl + labels so we can nudge them up together
  media: { alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -40 }] },

  disc: { backgroundColor: '#131415' },
  ring: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(255,255,255,0.06)' },
  gloss: {
    position: 'absolute',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },

  song: { fontSize: 18, fontWeight: '800', color: '#1d1d1d', marginTop: 8, textAlign: 'center' },
  artist: { fontSize: 14, color: '#666', marginTop: 4, textAlign: 'center' },

  banner: { position: 'absolute', top: 18, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  bannerLike: { left: 18, backgroundColor: 'rgba(20,200,120,0.9)' },
  bannerNope: { right: 18, backgroundColor: 'rgba(230,60,80,0.9)' },
  bannerText: { color: 'white', fontWeight: '900', letterSpacing: 1 },

  controls: {
    position: 'absolute', bottom: 20, left: 14, right: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pill: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
  },
  pillGhost: { backgroundColor: 'white' },
  pillPrimary: { backgroundColor: '#F28695' },
  pillDisabled: { opacity: 0.5 },
  pillIcon: { fontSize: 24, fontWeight: '900' },

  done: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(248, 249, 253, 0.98)', // Match the gradient background
  },
  doneTitle: { fontSize: 22, fontWeight: '800', color: '#001133', marginBottom: 8 },
  doneSub: { fontSize: 16, color: '#6F7A88', marginBottom: 24 },
  doneButtons: { width: '100%', alignItems: 'center', gap: 12 },
  
  confirmationContainer: { 
    flex: 1, 
    paddingHorizontal: 12, 
    paddingTop: 40, 
    paddingBottom: 0,
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(248, 249, 253, 0.98)', // Match the gradient background
  },
  confirmationScrollView: {
    flex: 1,
    width: '100%',
  },
  confirmationScrollContent: {
    paddingBottom: 20,
  },
  confirmationTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#001133', 
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationSubtitle: { 
    fontSize: 16, 
    color: '#6F7A88', 
    marginBottom: 24,
    textAlign: 'center',
  },
  nameInputContainer: { 
    width: '100%', 
    marginBottom: 20,
  },
  inputLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#001133', 
    marginBottom: 8,
  },
  nameInput: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16,
    color: '#001133',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  songsPreview: {
    width: '100%',
    marginBottom: 20,
    minHeight: 200,
    maxHeight: height * 0.35,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#001133',
    marginBottom: 12,
  },
  songsList: {
    maxHeight: height * 0.35,
  },
  songsListContent: {
    paddingBottom: 20,
  },
  songPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    width: '100%',
    marginHorizontal: -4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    minHeight: 70,
  },
  previewArtwork: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 14,
    flexShrink: 0,
  },
  previewSongInfo: {
    flex: 1,
    minWidth: 0,
  },
  previewSongTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#001133',
    marginBottom: 3,
  },
  previewSongArtist: {
    fontSize: 13,
    color: '#6F7A88',
  },
  confirmationButtons: {
    width: '100%',
    paddingTop: 12,
    paddingBottom: 100,
    backgroundColor: 'transparent',
  },
});
