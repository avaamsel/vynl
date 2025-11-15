import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView, View, Text, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savePlaylist, updatePlaylist, getPlaylist } from '@/src/utils/playlistStorage';
import AppButton from '@/src/components/AppButton';
import { usePutSong } from '@/src/hooks/use-put-song';
import { ITunesPlaylist, ITunesSong } from '@/src/types';
import { useCreatePlaylist } from '@/src/hooks/use-create-playlist';
import { useUpdatePlaylist } from '@/src/hooks/use-update-playlist';
import { useAuth } from '@/src/context/auth-context';

const { width, height } = Dimensions.get('window');
const DISC_SIZE = Math.min(width * 0.78, 320);
const LABEL_SIZE = DISC_SIZE * 0.38;   // center label with artwork
const HOLE_SIZE  = DISC_SIZE * 0.04;
const SWIPE_THRESHOLD = width * 0.28;
const ROTATION = 12;

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
  songId: number;
  direction: 'left' | 'right';
  index: number;
};

export default function Swiping() {
  const { songs, playlist, mode } = useLocalSearchParams();
  const newPlaylist: ITunesPlaylist = JSON.parse(playlist as string);
  const seedSongs: ITunesSong[] = JSON.parse(songs as string);
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [addedSongs, setAddedSongs] = useState<ITunesSong[]>([]);
  const [liked, setLiked] = useState<ITunesSong[]>([]);
  const [passed, setPassed] = useState<ITunesSong[]>([]);
  const [playing, setPlaying] = useState(true);
  const [swipeHistory, setSwipeHistory] = useState<SwipeHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playlistName, setPlaylistName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [playlistSaved, setPlaylistSaved] = useState(false);
  const { updateLoading, updateError, updatePlaylist } = useUpdatePlaylist();
  const [gettingSimilar, setGettingSimilar] = useState(false);
  const [recommendedSongs, setRecommendations] = useState<ITunesSong[]>([]);
  const { authToken } = useAuth();

  
  //First we add the selected songs to the database
/*   const { loading, error, putSong } = usePutSong();

  const saveSongs = async (songs: ITunesSong[]) => {
    for (let i = 0; i < songs.length; i++) {
      const success = await putSong(songs[i]);
      if (!success) {
        console.error('Failed to save song:', songs[i].title, error);
      } else {
        console.log('Saved song:', songs[i].title);
      }
    }
  };

  useEffect(() => {
    const saveAllSongs = async () => {
      setIsSaving(true);
      try {
        await saveSongs(selectedSongs);
        console.log("savedSongs in database");
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    };

    saveAllSongs();
  }, []); */
  //TODO : create a playlist

  const numberOfRecommendedSongs = 10;

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setGettingSimilar(true);

        const res = await fetch(`/api/playlist/recommendation/${encodeURIComponent(newPlaylist.id)}?amount=${numberOfRecommendedSongs}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          console.error(text || 'Failed to fetch similar songs');
          return;
        }

        const result = await res.json();

        //TODO : check if bad result ?

        setRecommendations(result);

      } catch (err: any) {
        console.error('Error updating playlist:', err.message || err);
      } finally {
        setGettingSimilar(false);
      }
    };

    fetchRecommendations();
  }, []);

  //OLD VERSION HARDCODED


  //const params = { playlistId: "2", mode: "add", playlistName: "test", s1: null, s2: null};

  //const playlistId = params.playlistId as string | undefined;
  const isAddingMode = mode === 'add' && newPlaylist.id;
  
  const position = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  
  // Load playlist name if in add mode
  //TODO : always in add mode, playlist.name exists
/*   useEffect(() => {
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
  }, [isAddingMode, playlistId, params.playlistName]); */


  //TODO : on peut garder pour le moment
  // Reset state function
  const resetState = useCallback((preservePlaylistName = false) => {
    setIndex(0);
    setAddedSongs(seedSongs);
    setLiked([]);
    setPassed([]);
    setSwipeHistory([]);
    if (!preservePlaylistName) {
      setPlaylistName('');
    }
    setPlaylistSaved(false);
    setIsSaving(false);
    setPlaying(true);
    position.setValue({ x: 0, y: 0 });
    cardOpacity.setValue(1);
  }, [position, cardOpacity]);

  // TODO : voir si on garde async storage
  // Clear session from storage
  const clearSession = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SWIPE_SESSION_KEY);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }, []);

  // Load session state on mount or when params change
  //TODO : maybe delete
  useEffect(() => {
    const loadSession = async () => {
      try {
        // If no seed songs provided, reset everything

        //TODO : diffrent check si les songs sont pas vides
        if (seedSongs.length == 0) {
          await clearSession();
          resetState();
          setIsLoading(false);
          return;
        }

        const savedSession = await AsyncStorage.getItem(SWIPE_SESSION_KEY);
        if (savedSession) {
          const session = JSON.parse(savedSession);
          // Only restore if we have the same seed songs
          if (session.seedSongs === seedSongs) {
            setIndex(session.index || 0);
            setLiked(session.liked || []);
            setPassed(session.passed || []);
            setSwipeHistory(session.swipeHistory || []);
          } else {
            // Different session, clear old data
            await clearSession();
            resetState();
          }
        } else {
          // No saved session, start fresh
          resetState();
        }
      } catch (error) {
        console.error('Error loading session:', error);
        resetState();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSession();
  }, [resetState, clearSession]);

  // Clear session when component comes into focus without params (user navigated back)
  //TODO : ??
  useFocusEffect(
    useCallback(() => {
      if (seedSongs.length == 0) {
        // No seed songs, clear session and reset state
        clearSession();
        resetState();
      }
    }, [clearSession, resetState])
  );

  // Save session state whenever it changes (only if we have seed songs)
  useEffect(() => {
    if (!isLoading && seedSongs.length > 0) {
      const saveSession = async () => {
        try {
          const session = {
            seedSongs,
            index,
            addedSongs,
            liked,
            passed,
            swipeHistory,
          };
          await AsyncStorage.setItem(SWIPE_SESSION_KEY, JSON.stringify(session));
        } catch (error) {
          console.error('Error saving session:', error);
        }
      };
      saveSession();
    }
  }, [index, liked, passed, swipeHistory, isLoading, seedSongs, addedSongs]);

  const top = recommendedSongs[index];
  const next = recommendedSongs[index + 1];
  const finished = index >= recommendedSongs.length;

  useEffect(() => {
    if (top?.cover_url) {
      Image.prefetch(top.cover_url).catch(() => {});
    }
    if (next?.cover_url) {
      Image.prefetch(next.cover_url).catch(() => {});
    }
  }, [index, top, next]);


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

  // Use ref to store current index to avoid closure issues
  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const swipe = useCallback((dir: 'left' | 'right', vy: number) => {
    // Get current index from ref to ensure we have the latest value
    const currentIndex = indexRef.current;
    const currentSong = recommendedSongs[currentIndex];
    
    if (!currentSong) {
      console.log("recommendedSongs : ", recommendedSongs);
      console.log("currentIndex : ", currentIndex);
      console.log("!currentSong");
      return;
    }
    
    console.log('Swiping', dir, 'song:', currentSong.song_id, currentSong.title, 'at index:', currentIndex);
    
    const toX = dir === 'right' ? width * 1.3 : -width * 1.3;
    Haptics.selectionAsync();
    Animated.timing(position, { toValue: { x: toX, y: vy * 16 }, duration: 220, useNativeDriver: true }).start(() => {
      // Add to history for undo functionality
      setSwipeHistory(prev => [...prev, { songId: currentSong.song_id, direction: dir, index: currentIndex }]);
      
      if (dir === 'right') {
        setLiked(arr => [...arr, currentSong]);
        setAddedSongs(arr => [...arr, currentSong]);
      } else {
        setPassed(arr => [...arr, currentSong]);
      }
      
      // reset transform then advance next frame to avoid one-frame ghost
      position.setValue({ x: 0, y: 0 });
      requestAnimationFrame(() => setIndex(i => i + 1));
      setPlaying(true);
    });
  }, [recommendedSongs]);

  useEffect(() => {
    if (addedSongs.length > 0) {
      console.log("Update");
      updatePlaylist(newPlaylist.id, addedSongs, newPlaylist.name);
    }
  }, [addedSongs]);

  useEffect(() => {
    if (addedSongs.length > 0) {
      console.log("Update name");
      updatePlaylist(newPlaylist.id, addedSongs, playlistName);
    }
  }, [playlistName]);

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
      setLiked(arr => arr.filter(id => id.song_id !== lastSwipe.songId));
      setAddedSongs(arr => arr.filter(id => id.song_id !== lastSwipe.songId));
    } else {
      setPassed(arr => arr.filter(id => id.song_id !== lastSwipe.songId));
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
    if (isSaving || !newPlaylist.id) return;
    
    
    setIsSaving(true);
    try {
      if (newPlaylist.id) {
        // Add songs to existing playlist
        const existingPlaylist = await getPlaylist(newPlaylist.id);
        if (existingPlaylist) {
          // Merge songs, avoiding duplicates
          const existingSongIds = new Set(existingPlaylist.songs.map(s => s.song_id));
          //const newSongs = likedSongs.filter(s => !existingSongIds.has(s.id));
          //const updatedSongs = [...existingPlaylist.songs, ...newSongs];
          //await updatePlaylist(playlistId, { songs: updatedSongs });
          // Ensure playlist name is set from the loaded playlist
          if (!playlistName || playlistName !== existingPlaylist.name) {
            setPlaylistName(existingPlaylist.name);
          }
        }
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

  // Don't render until session is loaded
  if (isLoading || gettingSimilar) {
    return (
      <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={{ flex: 1 }}>
        <SafeAreaView style={styles.wrap}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#001133' }}>Loading...</Text>
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
          {Math.min(index + 1, recommendedSongs.length)}/{recommendedSongs.length}
        </Text>

        {/* Home Button */}
        <TouchableOpacity style={styles.topBtn} onPress={() => router.push('/')}>
          <Feather name="home" size={22} color="#F28695" />
        </TouchableOpacity>
      </View>


        {/* centered deck */}
        <View style={styles.deck}>
          {/* next card behind for depth */}
          {next && (
            <View key={next.song_id} style={[styles.card, styles.cardUnder]}>
              <View style={styles.media}>
                <VinylDisc spinning={false} artwork={next?.cover_url || 'https://via.placeholder.com/150'} />
                <Text numberOfLines={1} style={styles.song}>{next.title}</Text>
                <Text numberOfLines={1} style={styles.artist}>{next.artist}</Text>
              </View>
            </View>
          )}

          {!finished && top && (
            <Animated.View
              key={top.song_id}
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
                <VinylDisc spinning={playing} artwork={top?.cover_url || 'https://via.placeholder.com/150'} />
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
                <TouchableOpacity style={[styles.pill, styles.pillGhost]} onPress={() => programmatic('left')}>
                  <Text style={[styles.pillIcon, { color: '#F28695' }]}>✕</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.pill, styles.pillPrimary]} onPress={() => setPlaying(p => !p)} activeOpacity={0.9}>
                  {playing ? <PauseIcon /> : <Text style={[styles.pillIcon, { color: 'white' }]}>▶︎</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.pill, styles.pillGhost]} onPress={() => programmatic('right')}>
                  <Text style={[styles.pillIcon, { color: '#F28695' }]}>♥</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {finished && !playlistSaved && (
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
                    {liked.map((song, idx) => {
                      return song ? (
                        <View key={`${song.song_id}-${idx}`} style={styles.songPreviewItem}>
                          <Image
                            source={{ uri: song?.cover_url || 'https://via.placeholder.com/150' }}
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
                        params: { id: newPlaylist.id }
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
                      title="Continue Swiping"
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
  pillIcon: { fontSize: 24, fontWeight: '900' },

  done: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  doneTitle: { fontSize: 22, fontWeight: '800', color: '#001133', marginBottom: 8 },
  doneSub: { fontSize: 16, color: '#6F7A88', marginBottom: 24 },
  doneButtons: { width: '100%', alignItems: 'center', gap: 12 },
  
  confirmationContainer: { 
    flex: 1, 
    paddingHorizontal: 12, 
    paddingTop: 40, 
    paddingBottom: 0,
    alignItems: 'center',
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
