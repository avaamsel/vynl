import React, { useMemo, useState, useEffect } from 'react';
import AppButton from '@/src/components/AppButton';
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router'; // ← navigation
import { Ionicons } from '@expo/vector-icons';

const SONGS = [
  { id: '1',  title: 'Super Shy', artist: 'NewJeans', artwork: 'https://i.scdn.co/image/ab67616d00001e023d98a0ae7c78a3a9babaf8af' },
  { id: '2',  title: 'Espresso', artist: 'Sabrina Carpenter', artwork: 'https://upload.wikimedia.org/wikipedia/en/7/71/Espresso_-_Sabrina_Carpenter.png' },
  { id: '3',  title: 'Snooze', artist: 'SZA', artwork: 'https://m.media-amazon.com/images/I/91BazzuLE+L._UF350,350_QL50_.jpg' },
  { id: '4',  title: 'The Adults Are Talking', artist: 'The Strokes', artwork: 'https://pics.filmaffinity.com/the_strokes_the_adults_are_talking-770338151-mmed.jpg' },
  { id: '5',  title: 'First Person Shooter (feat. J. Cole)', artist: 'Drake', artwork: 'https://m.media-amazon.com/images/I/41bNY36ilJL._UXNaN_FMjpg_QL85_.jpg' },
  { id: '6',  title: 'Rush', artist: 'Troye Sivan', artwork: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Troye_Sivan_-_Rush.png' },
  { id: '7',  title: 'TQG', artist: 'KAROL G & Shakira', artwork: 'https://i.scdn.co/image/ab67616d0000b27382de1ca074ae63cb18fce335' },
  { id: '8',  title: 'Calm Down', artist: 'Rema', artwork: 'https://upload.wikimedia.org/wikipedia/en/b/b1/Rema_-_Calm_Down.png' },
  { id: '9',  title: 'Bags', artist: 'Clairo', artwork: 'https://i.scdn.co/image/ab67616d0000b27333ccb60f9b2785ef691b2fbc' },
  { id: '10', title: 'Hot Girl (Bodies Bodies Bodies)', artist: 'Charli XCX', artwork: 'https://i1.sndcdn.com/artworks-19CTU1x0lsAE-0-t500x500.jpg' },
];

export default function UploadSongs() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    SONGS.forEach(s => {
      Image.prefetch(s.artwork).catch(e => {
        console.warn('Prefetch failed for', s.title, e?.message ?? e);
      });
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SONGS.filter(
      s =>
        s.title.toLowerCase().trim() === q ||
        s.artist.toLowerCase().trim() === q
    );
  }, [query]);

  const likedSongs = useMemo(() => {
    if (!selected.length) return [];
    return SONGS.filter(s => selected.includes(s.id));
  }, [selected]);

  const toggle = (id: string) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else if (selected.length < 2) setSelected([...selected, id]);
  };

  const ready = selected.length === 2;

  // Navigate to swiping.tsx with the two picks
  const goSwiping = () => {
    if (!ready) return;
    // pass as simple params (s1, s2). Access in swiping.tsx via useLocalSearchParams()
    router.push({ pathname: '/swiping', params: { s1: selected[0], s2: selected[1] } });
  };

  return (
    <LinearGradient colors={['#F1CCA6', '#F28695']} start={{x:0,y:0}} end={{x:0,y:1}} style={{ flex: 1 }}>
      <SafeAreaView style={s.wrap}>
        <View style={s.header}>
          <Text style={s.title}>Select</Text>
          <Text style={s.subtitle}>Choose 2 songs to get started</Text>

          <View style={s.searchWrap}>
            <Ionicons name="search" size={20} color="rgba(0,0,0,0.5)" />
            <TextInput
              style={s.searchInput}
              placeholder="What's your vibe?"
              placeholderTextColor="rgba(0,0,0,0.5)"
              value={query}
              onChangeText={setQuery}
              underlineColorAndroid="transparent"
            />
          </View>
        </View>

        {/* Liked tray stays visible while searching */}
        {likedSongs.length > 0 && (
          <View style={s.likedWrap}>
            <View style={s.likedHeader}>
              <Text style={s.likedTitle}>Liked</Text>
              <Text style={s.likedCount}>{selected.length}/2</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.likedScroll}
            >
              {likedSongs.map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggle(item.id)}
                  activeOpacity={0.9}
                >
                  <View style={s.likedChip}>
                    <Image
                      source={{ uri: item.artwork }}
                      style={s.likedArt}
                      contentFit="cover"
                      transition={120}
                      onError={({ error }) => {
                        console.warn('Image failed', item.title, error ?? '');
                      }}
                      placeholder={BLUR_PLACEHOLDER}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.likedSong} numberOfLines={1}>{item.title}</Text>
                      <Text style={s.likedArtist} numberOfLines={1}>{item.artist}</Text>
                    </View>
                    <View style={s.removePill}>
                      <Text style={s.removeX}>×</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Hide the bottom list entirely once two songs are selected */}
        {!ready && (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            {filtered.map(item => {
              const on = selected.includes(item.id);
              return (
                <TouchableOpacity key={item.id} onPress={() => toggle(item.id)} activeOpacity={0.85}>
                  <View style={[s.row, on && s.rowOn]}>
                    <Image
                      source={{ uri: item.artwork }}
                      style={s.art}
                      contentFit="cover"
                      transition={150}
                      onError={({ error }) => {
                        console.warn('Image failed', item.title, error ?? '');
                      }}
                      placeholder={BLUR_PLACEHOLDER}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={s.song}>{item.title}</Text>
                      <Text style={s.artist}>{item.artist}</Text>
                    </View>
                    <View style={[s.dot, on && s.dotOn]}>{on ? <Text style={s.check}>✓</Text> : null}</View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={s.cta}>
          <AppButton
            title={ready ? 'Start Swiping' : `Pick ${2 - selected.length} more`}
            disabled={!ready}
            onPress={goSwiping}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const BLUR_PLACEHOLDER = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';

const s = StyleSheet.create({
  wrap: { flex: 1 },
  header: { paddingTop: 40, paddingHorizontal: 24 },
  title: { color: 'black', fontSize: 60, fontFamily: 'AppleGaramond-Italic' },
  subtitle: { color: 'black', fontSize: 20, marginTop: 12, fontFamily: 'Poppins-Regular' },
  searchWrap: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: 'black',
    fontFamily: 'Poppins-Regular',
    padding: 0,
  },

  // Liked tray
  likedWrap: { marginTop: 12, paddingHorizontal: 24 },
  likedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  likedTitle: { color: '#2F2F2F', fontSize: 16, fontWeight: '700' },
  likedCount: { color: '#2F2F2F', fontSize: 14, opacity: 0.7 },
  likedScroll: { paddingRight: 12 },
  likedChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 14, marginRight: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
  },
  likedArt: { width: 34, height: 34, borderRadius: 8, marginRight: 10, backgroundColor: '#eee' },
  likedSong: { fontSize: 14, fontWeight: '700', color: '#2F2F2F' },
  likedArtist: { fontSize: 12, color: '#6B6B6B', marginTop: 2, maxWidth: 120 },
  removePill: {
    marginLeft: 10, width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#2F2F2F',
    alignItems: 'center', justifyContent: 'center',
  },
  removeX: { color: '#2F2F2F', fontSize: 14, fontWeight: '800', lineHeight: 16 },

  // Search results
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 16, padding: 12, marginTop: 14,
  },
  rowOn: { borderWidth: 2, borderColor: '#2F2F2F' },
  art: { width: 52, height: 52, borderRadius: 10, marginRight: 12, backgroundColor: '#eee' },
  song: { fontSize: 18, fontWeight: '700', color: '#2F2F2F' },
  artist: { fontSize: 14, color: '#6B6B6B', marginTop: 2 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#2F2F2F', alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: '#2F2F2F' },
  check: { color: 'white', fontWeight: '800' },
  cta: { position: 'absolute', left: 24, right: 24, bottom: 24 },
});
