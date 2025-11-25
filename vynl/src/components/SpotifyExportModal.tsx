import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from './AppButton';
import * as WebBrowser from 'expo-web-browser';
import {
  isSpotifyAuthenticated,
  exportPlaylistToSpotify,
  clearSpotifyTokens,
} from '@/src/utils/spotify';
import { initiateSpotifyAuth, handleSpotifyCallback } from '@/src/utils/spotifyAuth';
import * as Linking from 'expo-linking';

interface SpotifyExportModalProps {
  visible: boolean;
  onClose: () => void;
  playlistName: string;
  songs: Array<{ title: string; artist: string }>;
  onSuccess?: (playlistUrl: string) => void;
}

export default function SpotifyExportModal({
  visible,
  onClose,
  playlistName,
  songs,
  onSuccess,
}: SpotifyExportModalProps) {
  const insets = useSafeAreaInsets();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);
  const [exportResult, setExportResult] = useState<{
    playlistUrl: string;
    tracksFound: number;
    tracksTotal: number;
  } | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setIsCheckingAuth(true);
      setIsAuthenticated(false);
      setIsExporting(false);
      setExportProgress(null);
      setExportResult(null);
    }
  }, [visible]);

  // Check authentication status
  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    
    const checkAuth = async () => {
      console.log('Modal visible, checking Spotify auth...');
      if (isMounted) {
        setIsCheckingAuth(true);
        setIsAuthenticated(false);
      }
      
      try {
        const authenticated = await isSpotifyAuthenticated();
        console.log('Spotify auth check result:', authenticated);
        if (isMounted) {
          setIsAuthenticated(authenticated || false);
          setIsCheckingAuth(false);
        }
      } catch (error: any) {
        console.error('Error checking Spotify auth:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Handle deep linking for OAuth callback (mobile)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      const subscription = Linking.addEventListener('url', handleDeepLink);
      return () => subscription.remove();
    }
  }, []);

  const handleDeepLink = async (event: { url: string }) => {
    try {
      await handleSpotifyCallback(event.url);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      Alert.alert('Error', 'Failed to authenticate with Spotify');
    }
  };

  const handleAuthenticate = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web OAuth flow
        const authUrl = await initiateSpotifyAuth();
        if (authUrl && typeof authUrl === 'string') {
          // Open in same window and handle callback
          if (typeof window !== 'undefined') {
            window.location.href = authUrl;
          }
        }
      } else {
        // Mobile OAuth flow
        await initiateSpotifyAuth();
        setTimeout(async () => {
          try {
            const authenticated = await isSpotifyAuthenticated();
            setIsAuthenticated(authenticated);
          } catch (error) {
            console.error('Error checking auth status:', error);
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error authenticating with Spotify:', error);
      Alert.alert('Error', error.message || 'Failed to authenticate with Spotify');
    }
  };

  const handleExport = async () => {
    if (songs.length === 0) {
      Alert.alert('Error', 'Playlist is empty');
      return;
    }

    setIsExporting(true);
    setExportProgress({ current: 0, total: songs.length, status: 'Starting export...' });
    setExportResult(null);

    try {
      const result = await exportPlaylistToSpotify(playlistName, songs, (progress) => {
        setExportProgress(progress);
      });

      setExportResult(result);
      setIsExporting(false);

      if (onSuccess) {
        onSuccess(result.playlistUrl);
      }

      Alert.alert(
        'Success!',
        `Playlist exported to Spotify!\n\nFound ${result.tracksFound} out of ${result.tracksTotal} tracks.`,
        [
          {
            text: 'Open in Spotify',
            onPress: () => {
              if (Platform.OS === 'web') {
                window.open(result.playlistUrl, '_blank');
              } else {
                Linking.openURL(result.playlistUrl);
              }
            },
          },
          { text: 'OK', onPress: onClose },
        ]
      );
    } catch (error: any) {
      console.error('Error exporting playlist:', error);
      setIsExporting(false);
      setExportProgress(null);
      Alert.alert('Error', error.message || 'Failed to export playlist to Spotify');
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Spotify',
      'Are you sure you want to disconnect your Spotify account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await clearSpotifyTokens();
            setIsAuthenticated(false);
            setExportResult(null);
          },
        },
      ]
    );
  };

  console.log('SpotifyExportModal render - visible:', visible, 'isCheckingAuth:', isCheckingAuth, 'isAuthenticated:', isAuthenticated, 'playlistName:', playlistName, 'songs:', songs.length);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modalContentWrapper, { marginBottom: insets.bottom }]}>
          <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Export to Spotify</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#001133" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {isCheckingAuth ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator size="large" color="#F28695" />
                  <Text style={styles.statusText}>Checking authentication...</Text>
                </View>
              ) : !isAuthenticated ? (
                <View style={styles.authSection}>
                  <Ionicons name="musical-notes" size={64} color="#1DB954" style={styles.spotifyIcon} />
                  <Text style={styles.authTitle}>Connect to Spotify</Text>
                  <Text style={styles.authDescription}>
                    Connect your Spotify account to export playlists and start listening!
                  </Text>
                  <View style={styles.buttonContainer}>
                    <AppButton
                      title="Connect Spotify"
                      onPress={handleAuthenticate}
                      backgroundColor="#1DB954"
                      textColor="#FFFFFF"
                      width="100%"
                    />
                  </View>
                </View>
              ) : isExporting ? (
                <View style={styles.exportSection}>
                  <ActivityIndicator size="large" color="#F28695" style={styles.loader} />
                  <Text style={styles.exportStatus}>
                    {exportProgress?.status || 'Exporting playlist...'}
                  </Text>
                  {exportProgress && (
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${(exportProgress.current / exportProgress.total) * 100}%` },
                        ]}
                      />
                    </View>
                  )}
                  <Text style={styles.progressText}>
                    {exportProgress?.current || 0} / {exportProgress?.total || songs.length} tracks
                  </Text>
                </View>
              ) : exportResult ? (
                <View style={styles.successSection}>
                  <Ionicons name="checkmark-circle" size={64} color="#1DB954" style={styles.successIcon} />
                  <Text style={styles.successTitle}>Export Complete!</Text>
                  <Text style={styles.successText}>
                    Found {exportResult.tracksFound} out of {exportResult.tracksTotal} tracks
                  </Text>
                  <View style={styles.buttonContainer}>
                    <AppButton
                      title="Open in Spotify"
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          if (typeof window !== 'undefined') {
                            window.open(exportResult.playlistUrl, '_blank');
                          }
                        } else {
                          Linking.openURL(exportResult.playlistUrl);
                        }
                      }}
                      backgroundColor="#1DB954"
                      textColor="#FFFFFF"
                      width="100%"
                    />
                  </View>
                  <View style={styles.buttonContainer}>
                    <AppButton
                      title="Close"
                      onPress={onClose}
                      backgroundColor="#F28695"
                      textColor="#FFFFFF"
                      width="100%"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.readySection}>
                  <Ionicons name="musical-notes" size={64} color="#1DB954" style={styles.spotifyIcon} />
                  <Text style={styles.readyTitle}>Ready to Export</Text>
                  <Text style={styles.readyDescription}>
                    Export "{playlistName}" with {songs.length} song{songs.length !== 1 ? 's' : ''} to
                    Spotify?
                  </Text>
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistInfoText}>
                      <Text style={styles.bold}>Playlist:</Text> {playlistName}
                    </Text>
                    <Text style={styles.playlistInfoText}>
                      <Text style={styles.bold}>Songs:</Text> {songs.length}
                    </Text>
                  </View>
                  <View style={styles.buttonContainer}>
                    <AppButton
                      title="Export to Spotify"
                      onPress={handleExport}
                      backgroundColor="#1DB954"
                      textColor="#FFFFFF"
                      width="100%"
                    />
                  </View>
                  <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectButton}>
                    <Text style={styles.disconnectText}>Disconnect Spotify</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContentWrapper: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '80%',
    minHeight: 300,
  },
  modalContent: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 24,
    maxHeight: '100%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#001133',
    fontFamily: 'AppleGaramond-Italic',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    maxHeight: '100%',
  },
  contentContainer: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    minHeight: 200,
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6F7A88',
  },
  authSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  spotifyIcon: {
    marginBottom: 12,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#001133',
    marginBottom: 8,
  },
  authDescription: {
    fontSize: 14,
    color: '#6F7A88',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  exportSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loader: {
    marginBottom: 12,
  },
  exportStatus: {
    fontSize: 16,
    color: '#001133',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6F7A88',
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIcon: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#001133',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#6F7A88',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  readySection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  readyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#001133',
    marginBottom: 8,
  },
  readyDescription: {
    fontSize: 14,
    color: '#6F7A88',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  playlistInfo: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  playlistInfoText: {
    fontSize: 14,
    color: '#001133',
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 12,
  },
  disconnectButton: {
    marginTop: 8,
    padding: 12,
    width: '100%',
  },
  disconnectText: {
    fontSize: 14,
    color: '#F28695',
    textAlign: 'center',
  },
});

