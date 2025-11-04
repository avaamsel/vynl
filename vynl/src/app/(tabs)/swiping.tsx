import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Dimensions, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

type Song = { id: string; title: string; artist: string; artwork: string };

const { width, height } = Dimensions.get('window');
const DISC_SIZE = Math.min(width * 0.78, 320);
const LABEL_SIZE = DISC_SIZE * 0.38;   // center label with artwork
const HOLE_SIZE  = DISC_SIZE * 0.04;
const SWIPE_THRESHOLD = width * 0.28;
const ROTATION = 12;

const SONGS: Song[] = [
  { id: '1',  title: 'SUPER SHY', artist: 'NEW JEANS', artwork: 'https://i.scdn.co/image/ab67616d00001e023d98a0ae7c78a3a9babaf8af' },
  { id: '2',  title: 'ESPRESSO', artist: 'SABRINA CARPENTER', artwork: 'https://upload.wikimedia.org/wikipedia/en/7/71/Espresso_-_Sabrina_Carpenter.png' },
  { id: '3',  title: 'SNOOZE', artist: 'SZA', artwork: 'https://m.media-amazon.com/images/I/91BazzuLE+L._UF350,350_QL50_.jpg' },
  { id: '4',  title: 'THE ADULTS ARE TALKING', artist: 'THE STROKES', artwork: 'https://pics.filmaffinity.com/the_strokes_the_adults_are_talking-770338151-mmed.jpg' },
  { id: '5',  title: 'FIRST PERSON SHOOTER', artist: 'DRAKE', artwork: 'https://m.media-amazon.com/images/I/41bNY36ilJL._UXNaN_FMjpg_QL85_.jpg' },
  { id: '6',  title: 'RUSH', artist: 'TROYE SIVAN', artwork: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Troye_Sivan_-_Rush.png' },
  { id: '7',  title: 'TQG', artist: 'KAROL G & SHAKIRA', artwork: 'https://i.scdn.co/image/ab67616d0000b27382de1ca074ae63cb18fce335' },
  { id: '8',  title: 'CALM DOWN', artist: 'REMA', artwork: 'https://upload.wikimedia.org/wikipedia/en/b/b1/Rema_-_Calm_Down.png' },
  { id: '9',  title: 'BAGS', artist: 'CLAIRO', artwork: 'https://i.scdn.co/image/ab67616d0000b27333ccb60f9b2785ef691b2fbc' },
  { id: '10', title: 'HOT GIRL', artist: 'CHARLI XCX', artwork: 'https://i1.sndcdn.com/artworks-19CTU1x0lsAE-0-t500x500.jpg' },
];

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

export default function Swiping() {
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [playing, setPlaying] = useState(true);

  const position = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const top = SONGS[index];
  const next = SONGS[index + 1];
  const finished = index >= SONGS.length;

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
    []
  );

  const swipe = (dir: 'left' | 'right', vy: number) => {
    const toX = dir === 'right' ? width * 1.3 : -width * 1.3;
    Haptics.selectionAsync();
    Animated.timing(position, { toValue: { x: toX, y: vy * 16 }, duration: 220, useNativeDriver: true }).start(() => {
      if (top) {
        if (dir === 'right') setLiked(arr => [...arr, top.id]);
        else setPassed(arr => [...arr, top.id]);
      }
      // reset transform then advance next frame to avoid one-frame ghost
      position.setValue({ x: 0, y: 0 });
      requestAnimationFrame(() => setIndex(i => i + 1));
      setPlaying(true);
    });
  };

  const programmatic = (dir: 'left' | 'right') => swipe(dir, 0);

  return (
    <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.wrap}>
        {/* top bar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.topBtn} disabled><Text style={styles.topIcon}>‹</Text></TouchableOpacity>
          <Text style={styles.counter}>{Math.min(index + 1, SONGS.length)}/{SONGS.length}</Text>
          <TouchableOpacity style={styles.topBtn} disabled><Text style={styles.topIcon}>?</Text></TouchableOpacity>
        </View>

        {/* centered deck */}
        <View style={styles.deck}>
          {/* next card behind for depth */}
          {next && (
            <View key={next.id} style={[styles.card, styles.cardUnder]}>
              <VinylDisc spinning={false} artwork={next.artwork} />
              <Text numberOfLines={1} style={styles.song}>{next.title}</Text>
              <Text numberOfLines={1} style={styles.artist}>{next.artist}</Text>
            </View>
          )}

          {!finished && top && (
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
              <VinylDisc spinning={playing} artwork={top.artwork} />

              {/* swipe banners */}
              <Animated.View style={[styles.banner, styles.bannerLike, { opacity: likeOpacity }]}>
                <Text style={styles.bannerText}>LIKE</Text>
              </Animated.View>
              <Animated.View style={[styles.banner, styles.bannerNope, { opacity: nopeOpacity }]}>
                <Text style={styles.bannerText}>NOPE</Text>
              </Animated.View>

              <Text numberOfLines={1} style={styles.song}>{top.title}</Text>
              <Text numberOfLines={1} style={styles.artist}>{top.artist}</Text>

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

          {finished && (
            <View style={styles.done}>
              <Text style={styles.doneTitle}>All caught up</Text>
              <Text style={styles.doneSub}>Liked {liked.length} · Passed {passed.length}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 18 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  topBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
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

  disc: { backgroundColor: '#131415' },
  ring: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(255,255,255,0.06)' },
  gloss: {
    position: 'absolute',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },

  song: { fontSize: 18, fontWeight: '800', color: '#1d1d1d', marginTop: 16, textAlign: 'center' },
  artist: { fontSize: 14, color: '#666', marginTop: 2, textAlign: 'center' },

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

  done: { alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 22, fontWeight: '800', color: '#001133' },
  doneSub: { marginTop: 6, fontSize: 14, color: '#6F7A88' },
});
