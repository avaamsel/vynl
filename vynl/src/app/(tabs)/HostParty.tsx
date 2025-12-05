import { Image } from 'expo-image';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Poppins_400Regular } from '@expo-google-fonts/poppins';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useCreatePlaylist } from '@/src/hooks/use-create-playlist';
import { useAuth } from '@/src/context/auth-context';
import { supabase } from '@/src/utils/supabase';
import { ITunesSong } from '@/src/types';
import { usePlaylistWithID } from '@/src/hooks/use-playlist-with-id';

// Image assets
const imgBackground = require('@/assets/images/background.png');

// Generate a random 6-digit alphanumeric code
const generatePartyCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function HostPartyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const playlistId = params.playlistId as string | undefined;
  const [partyCode, setPartyCode] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const { createPlaylist } = useCreatePlaylist();
  const { authToken, loading: authLoading } = useAuth();
  const { playlist, loading: playlistLoading } = usePlaylistWithID(playlistId || null);
  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
  });

  useEffect(() => {
    // Generate code when component mounts
    setPartyCode(generatePartyCode());
  }, []);

  const handleCreateParty = async () => {
    if (isCreating || authLoading || !authToken) return;

    // If we have a playlist ID, use the existing playlist
    if (playlistId && playlist) {
      // Navigate back to playlist detail with party code
      router.push({
        pathname: '/(tabs)/playlist-detail',
        params: {
          id: playlist.id.toString(),
          partyCode: partyCode,
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

      // Navigate to UploadSongs with party mode params
      router.push({
        pathname: '/(tabs)/UploadSongs',
        params: {
          partyMode: 'true',
          partyCode: partyCode,
          playlistId: playlist.id.toString(),
          playlistName: playlist.name,
          playlist: JSON.stringify(playlist),
        },
      });
    } catch (error) {
      console.error('Error creating party:', error);
      setIsCreating(false);
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
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonContainer}>
            {/* Create Party Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCreateParty}
              disabled={isCreating || authLoading || (playlistId && !playlist)}
            >
              <LinearGradient
                colors={!isCreating && !authLoading && (!playlistId || playlist) ? ['#FF6B9D', '#FF8C42'] : ['#CCCCCC', '#CCCCCC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.gradientButtonText}>
                  {isCreating ? 'CREATING...' : 'START PARTY'}
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

