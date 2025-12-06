import { Image } from 'expo-image';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Poppins_400Regular } from '@expo-google-fonts/poppins';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCreatePlaylist } from '@/src/hooks/use-create-playlist';
import { useAuth } from '@/src/context/auth-context';
import { supabase } from '@/src/utils/supabase';
import { ITunesSong } from '@/src/types';
import { usePlaylistWithID } from '@/src/hooks/use-playlist-with-id';

const PARTY_CODE_STORAGE_KEY = '@vynl:partyCode';

// Image assets
const imgBackground = require('@/assets/images/background.png');

export default function HostPartyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const playlistId = params.playlistId as string | undefined;
  const [partyCode, setPartyCode] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isFetchingCode, setIsFetchingCode] = useState(false);
  const { createPlaylist } = useCreatePlaylist();
  const { authToken, loading: authLoading } = useAuth();
  const { playlist, loading: playlistLoading } = usePlaylistWithID(playlistId || null);
  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
  });

  // Load party code from AsyncStorage when component mounts (for quick display)
  // The fresh code will be fetched when user clicks "START PARTY"
  useEffect(() => {
    const loadStoredPartyCode = async () => {
      if (!playlistId || !playlist) return;

      try {
        const storedParties = await AsyncStorage.getItem(PARTY_CODE_STORAGE_KEY);
        if (storedParties) {
          const parties = JSON.parse(storedParties);
          // Handle migration from old format (single object) to new format (array)
          const partiesArray = Array.isArray(parties) 
            ? parties 
            : (parties.playlistId ? [parties] : []);
          
          const activeParty = partiesArray.find((p: any) => p.playlistId === playlist.id.toString());
          if (activeParty && activeParty.partyCode) {
            // Show stored code initially, but it will be updated when "START PARTY" is clicked
            setPartyCode(activeParty.partyCode);
          }
        }
      } catch (error) {
        console.error('Error loading party code from storage:', error);
      }
    };

    loadStoredPartyCode();
  }, [playlistId, playlist]);

  const fetchPartyCode = async (playlistId: number): Promise<string | null> => {
    if (!authToken) {
      console.error('No auth token available');
      return null;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        return null;
      }

      const url = `/api/playlist/party/toggle/${playlistId}`;
      console.log('Fetching party code from:', url);
      console.log('User ID:', user.id);
      console.log('Playlist ID:', playlistId);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          uid: user.id,
          enable: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to enable party mode:', response.status, errorText);
        return null;
      }

      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      // The API returns JSON.stringify(partyCode), so we need to parse it
      let code: string;
      try {
        code = JSON.parse(responseText);
      } catch (parseError) {
        // If parsing fails, maybe it's already a string?
        code = responseText;
      }
      
      if (!code || typeof code !== 'string') {
        console.error('Invalid party code format:', code);
        return null;
      }

      console.log('Party code received:', code);
      return code;
    } catch (error) {
      console.error('Error fetching party code:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return null;
    }
  };

  const handleCreateParty = async () => {
    if (isCreating || authLoading || !authToken || isFetchingCode) return;

    // If we have a playlist ID, use the existing playlist
    if (playlistId && playlist) {
      setIsFetchingCode(true);
      // Clear the old code immediately so user sees we're fetching a fresh one
      setPartyCode('');
      
      // Fetch party code from API
      const fetchedCode = await fetchPartyCode(playlist.id);
      
      if (!fetchedCode) {
        console.error('Failed to get party code from API');
        setIsFetchingCode(false);
        return;
      }

      // Set the new code
      setPartyCode(fetchedCode);
      
      // Save party code to storage (support multiple active parties)
      try {
        const existingParties = await AsyncStorage.getItem(PARTY_CODE_STORAGE_KEY);
        let parties = existingParties ? JSON.parse(existingParties) : [];
        
        // Check if this playlist already has an active party
        const existingIndex = parties.findIndex((p: any) => p.playlistId === playlist.id.toString());
        
        if (existingIndex >= 0) {
          // Update existing party code
          parties[existingIndex].partyCode = fetchedCode;
        } else {
          // Add new party
          parties.push({
            playlistId: playlist.id.toString(),
            partyCode: fetchedCode
          });
        }
        
        await AsyncStorage.setItem(PARTY_CODE_STORAGE_KEY, JSON.stringify(parties));
      } catch (error) {
        console.error('Error saving party code:', error);
      }
      
      setIsFetchingCode(false);
      
      // Navigate back to playlist detail with party code
      router.push({
        pathname: '/(tabs)/playlist-detail',
        params: {
          id: playlist.id.toString(),
          partyCode: fetchedCode,
        },
      });
      return;
    }

    // If no playlist ID, create a new playlist (fallback for old flow)
    setIsCreating(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not logged in');
        setIsCreating(false);
        return;
      }

      // Create playlist with empty songs array initially
      const playlist = await createPlaylist(
        'My Playlist',
        user.id,
        [] as ITunesSong[]
      );

      if (!playlist) {
        console.error('Failed to create party playlist');
        setIsCreating(false);
        return;
      }

      // Fetch party code from API
      setIsFetchingCode(true);
      const fetchedCode = await fetchPartyCode(playlist.id);
      setIsFetchingCode(false);

      if (!fetchedCode) {
        console.error('Failed to get party code from API');
        setIsCreating(false);
        return;
      }

      // Navigate to UploadSongs with party mode params
      router.push({
        pathname: '/(tabs)/UploadSongs',
        params: {
          partyMode: 'true',
          partyCode: fetchedCode,
          playlistId: playlist.id.toString(),
          playlistName: playlist.name,
          playlist: JSON.stringify(playlist),
        },
      });
    } catch (error) {
      console.error('Error creating party:', error);
      setIsCreating(false);
      setIsFetchingCode(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  // Show loading state if we're waiting for playlist data
  if (playlistId && playlistLoading) {
    return (
      <View style={styles.container}>
        <Image
          source={imgBackground}
          style={styles.backgroundImage}
          contentFit="cover"
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // If playlist ID provided but playlist not found, show error
  if (playlistId && !playlist) {
    return (
      <View style={styles.container}>
        <Image
          source={imgBackground}
          style={styles.backgroundImage}
          contentFit="cover"
        />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Playlist not found</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/playlists')}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>GO BACK</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image
        source={imgBackground}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Host Party</Text>
            {playlist && (
              <Text style={styles.playlistNameText}>{playlist.name}</Text>
            )}
          </View>

          {/* Party Code Display */}
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>Your Party Code</Text>
            {partyCode ? (
              <>
                <View style={styles.codeDisplayContainer}>
                  {partyCode.split('').map((char, index) => (
                    <View key={index} style={styles.codeCharBox}>
                      <Text style={styles.codeCharText}>{char}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.codeInstruction}>
                  Share this code with friends to join your party
                </Text>
              </>
            ) : (
              <Text style={styles.codeInstruction}>
                Click "START PARTY" to generate your party code
              </Text>
            )}
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonContainer}>
            {/* Create Party Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCreateParty}
              disabled={isCreating || authLoading || isFetchingCode || (playlistId ? !playlist : false)}
            >
              <LinearGradient
                colors={!isCreating && !authLoading && !isFetchingCode && (!playlistId || playlist) ? ['#FF6B9D', '#FF8C42'] : ['#CCCCCC', '#CCCCCC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.gradientButtonText}>
                  {isCreating ? 'CREATING...' : isFetchingCode ? 'GETTING CODE...' : 'START PARTY'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (playlistId) {
                  router.push({
                    pathname: '/(tabs)/playlist-detail',
                    params: { id: playlistId }
                  });
                } else {
                  router.push('/(tabs)/PartyMode');
                }
              }}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    transform: [{ scaleX: 2.17 }, { scaleY: 1 }, { translateX: -0.58 }],
  },
  safeArea: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 120,
    alignItems: 'center',
  },
  headerSection: {
    marginBottom: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Poppins',
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  playlistNameText: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#000000',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#F28695',
    marginBottom: 20,
    textAlign: 'center',
  },
  codeSection: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    marginBottom: 40,
  },
  codeLabel: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  codeDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  codeCharBox: {
    width: 48,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF8C42',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  codeCharText: {
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '700',
    color: '#FF8C42',
  },
  codeInstruction: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  gradientButton: {
    width: '100%',
    maxWidth: 400,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#000000',
    letterSpacing: 0.5,
  },
});

