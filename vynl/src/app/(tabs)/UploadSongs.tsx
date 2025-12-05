import React, { useMemo, useState } from 'react';
import AppButton from '@/src/components/AppButton';
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router'; // ← navigation
import { Ionicons } from '@expo/vector-icons';
import { useSongSearch } from '@/src/hooks/use-song-search';
import { ITunesSong, ITunesPlaylist } from '@/src/types';
import { useCreatePlaylist } from '@/src/hooks/use-create-playlist';
import { useAuth } from '@/src/context/auth-context';
import { supabase } from '@/src/utils/supabase';
import { REGIONS } from '@/src/constants/regions';
import { useRegion } from '@/src/context/region-context';

export default function UploadSongs() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ITunesSong[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { loading: savingPlaylistLoading, error: playlistError, createPlaylist } = useCreatePlaylist();
  const { authToken, loading: authLoading} = useAuth();
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const { region, setRegion } = useRegion();
  

  const router = useRouter();

  const { results: filtered, loading, error } = useSongSearch(query);

  //TODO : dif between liked and selected songs ? 
  const likedSongs = useMemo(() => {
    if (!selected.length) return [];
    return selected;
  }, [selected, filtered]);

  const toggle = (song: ITunesSong) => {
    if (selected.includes(song)) setSelected(selected.filter(x => x !== song));
    else if (selected.length < 2) setSelected([...selected, song]);
  };

  const ready = selected.length === 2;

  // Navigate to swipe.tsx with the two picks
  const goSwiping = async () => {
    console.log("Go swipping");
    if (!ready || authLoading || !authToken) return;

    setIsSaving(true);

    const { data: { user }, error } = await supabase.auth.getUser();
    if (!user) throw new Error("User not logged in");

    const playlist = await createPlaylist(
      "My Playlist",
      user.id,
      selected
    );

    if (!playlist) {
      console.error("Playlist creation failed:", playlistError);
      setIsSaving(false);
      return;
    }

    router.push({
      pathname: '/swipe',
      //TODO : remove songs
      params: { songs: JSON.stringify(selected), playlist: JSON.stringify(playlist) }
    });

    setIsSaving(false);
  };


  return (
    <LinearGradient colors={['#F1CCA6', '#F28695']} start={{x:0,y:0}} end={{x:0,y:1}} style={{ flex: 1 }}>
      <SafeAreaView style={s.wrap}>
        <View style={s.header}>
          <Text style={s.title}>Select</Text>
          <TouchableOpacity onPress={() => setRegionModalVisible(true)} style={s.settingsButton}>
            <Ionicons name="settings-outline" size={28} color="black" />
          </TouchableOpacity>
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
            {loading && <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>}
            {error && <Text style={{ textAlign: 'center', marginTop: 20, color: 'red' }}>{error}</Text>}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.likedScroll}
            >
              {likedSongs.map(item => (
                <TouchableOpacity
                  key={item.song_id}
                  onPress={() => toggle(item)}
                  activeOpacity={0.9}
                >
                  <View style={s.likedChip}>
                    <Image
                      source={{ uri: item.cover_url ?? BLUR_PLACEHOLDER }}
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
            contentContainerStyle={{ paddingHorizontal: 30, paddingBottom: 160 }}
            keyboardShouldPersistTaps="handled"
          >
            {filtered.map(item => {
              const on = selected.includes(item);
              return (
                <TouchableOpacity key={item.song_id} onPress={() => toggle(item)} activeOpacity={0.85}>
                  <View style={[s.row, on && s.rowOn]}>
                    <Image
                      source={{ uri: item.cover_url ?? BLUR_PLACEHOLDER }}
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
              disabled={!ready || authLoading || isSaving}
              onPress={goSwiping}
              backgroundColor="#FFFFFF"
              textColor="#000000"
            />
        </View>
      </SafeAreaView>

      <Modal
        visible={regionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRegionModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Select Region</Text>
            <FlatList
              data={REGIONS}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.modalItem}
                  onPress={() => {
                    setRegion(item);
                    setRegionModalVisible(false);
                  }}
                >
                  <Text style={s.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const BLUR_PLACEHOLDER = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';

const s = StyleSheet.create({
  wrap: { flex: 1 },
  header: { paddingTop: 40, paddingHorizontal: 30 },
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
  likedWrap: { marginTop: 12, paddingHorizontal: 30 },
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
  cta: { position: 'absolute', left: 30, right: 30, bottom: 100 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
  },
  settingsButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemText: { fontSize: 16 },
});
