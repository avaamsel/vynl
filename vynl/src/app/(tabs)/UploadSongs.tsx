import React, { useMemo, useState } from 'react';
import AppButton from '@/src/components/AppButton';
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router'; // ← navigation
import { Ionicons } from '@expo/vector-icons';

const SONGS = [
  {
    id: '1',
    title: 'Nights',
    artist: 'Frank Ocean',
    artwork: 'https://i.scdn.co/image/ab67616d00001e02e3ddac71977b8c5a09d29124',
  },
  {
    id: '2',
    title: 'Ladders',
    artist: 'Mac Miller',
    artwork: 'https://i.scdn.co/image/ab67616d00001e02dc68e0a6bf2a444ef0e00216',
  },
];

export default function UploadSongs() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SONGS;
    return SONGS.filter(
      s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [query]);

  const toggle = (id: string) => {
    if (selected.includes(id)) setSelected(selected.filter(x => x !== id));
    else if (selected.length < 2) setSelected([...selected, id]);
  };

  const ready = selected.length === 2;

  return (
    <LinearGradient colors={['#F1CCA6', '#F28695']} start={{x:0,y:0}} end={{x:0,y:1}} style={{ flex: 1 }}>
      <SafeAreaView style={s.wrap}>
        <View style={s.header}>
          <Text style={s.title}>Upload</Text>
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

        {/* Plain list, no FlatList, should always render */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.map(item => {
            const on = selected.includes(item.id);
            return (
              <TouchableOpacity key={item.id} onPress={() => toggle(item.id)} activeOpacity={0.85}>
                <View style={[s.row, on && s.rowOn]}>
                  <Image source={{ uri: item.artwork }} style={s.art} />
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

        <View style={s.cta}>
          <AppButton
            title={ready ? 'Continue' : `Pick ${2 - selected.length} more`}
            disabled={!ready}
            onPress={() => console.log('Selected IDs', selected)}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

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
