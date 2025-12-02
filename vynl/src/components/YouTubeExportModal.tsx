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
import * as Linking from 'expo-linking';
import {
  isYouTubeAuthenticated,
  exportPlaylistToYouTube,
  clearYouTubeTokens,
} from '@/src/utils/youtube';
import {
  initiateYouTubeAuth,
  handleYouTubeCallback,
  handleYouTubeCallbackFromQuery,
} from '@/src/utils/youtubeAuth';

interface YouTubeExportModalProps {
  visible: boolean;
  onClose: () => void;
  playlistName: string;
  songs: Array<{ title: string; artist: string }>;
  onSuccess?: (playlistUrl: string) => void;
}

export default function YouTubeExportModal({
  visible,
  onClose,
  playlistName,
  songs,
  onSuccess,
}: YouTubeExportModalProps) {
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

  useEffect(() => {
    if (!visible) {
      setIsAuthenticated(false);
      setIsCheckingAuth(true);
      setIsExporting(false);
      setExportProgress(null);
      setExportResult(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let mounted = true;

    const checkAuth = async () => {
      setIsCheckingAuth(true);
      try {
        const authenticated = await isYouTubeAuthenticated();
        if (mounted) {
          setIsAuthenticated(authenticated);
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error('Error checking YouTube auth:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [visible]);

  useEffect(() => {
    if (Platform.OS === 'web' && visible) {
      handleYouTubeCallbackFromQuery()
        .then((success) => {
          if (success) {
            setIsAuthenticated(true);
            setIsCheckingAuth(false);
          }
        })
        .catch((error) => {
          console.error('Error handling YouTube callback:', error);
        });
    }
  }, [visible]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const subscription = Linking.addEventListener('url', async (event) => {
        try {
          await handleYouTubeCallback(event.url);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error handling YouTube deep link:', error);
          Alert.alert('Error', 'Failed to authenticate with YouTube Music');
        }
      });
      return () => subscription.remove();
    }
  }, []);

  const handleAuthenticate = async () => {
    try {
      if (Platform.OS === 'web') {
        const authUrl = await initiateYouTubeAuth();
        if (authUrl && typeof window !== 'undefined') {
          window.location.href = authUrl;
        }
      } else {
        await initiateYouTubeAuth();
        setTimeout(async () => {
          try {
            const authenticated = await isYouTubeAuthenticated();
            setIsAuthenticated(authenticated);
          } catch (error) {
            console.error('Error verifying YouTube authentication:', error);
          }
        }, 1200);
      }
    } catch (error: any) {
      if (error.message?.includes('cancel')) {
        console.log('User cancelled YouTube authentication');
        return;
      }
      Alert.alert('Error', error.message || 'Failed to authenticate with YouTube Music');
    }
  };

  const handleExport = async () => {
    if (songs.length === 0) {
      Alert.alert('Playlist is empty', 'Add a few songs before exporting.');
      return;
    }

    setIsExporting(true);
    setExportProgress({ current: 0, total: songs.length, status: 'Starting export...' });
    setExportResult(null);

    try {
      const result = await exportPlaylistToYouTube(playlistName, songs, (progress) =>
        setExportProgress(progress)
      );

      setExportResult(result);
      setIsExporting(false);

      onSuccess?.(result.playlistUrl);

      Alert.alert(
        'Exported to YouTube Music',
        `Found ${result.tracksFound} of ${result.tracksTotal} tracks`,
        [
          {
            text: 'Open Playlist',
            onPress: () => {
              if (Platform.OS === 'web') {
                if (typeof window !== 'undefined') {
                  window.open(result.playlistUrl, '_blank');
                }
              } else {
                Linking.openURL(result.playlistUrl);
              }
            },
          },
          { text: 'Close', onPress: onClose },
        ]
      );
    } catch (error: any) {
      console.error('Failed to export playlist to YouTube Music:', error);
      setIsExporting(false);
      setExportProgress(null);
      Alert.alert('Error', error.message || 'Export failed. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect YouTube Music',
      'Disconnecting removes access to export playlists.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await clearYouTubeTokens();
            setIsAuthenticated(false);
            setExportResult(null);
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modalContentWrapper, { marginBottom: insets.bottom }]}>
          <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Export to YouTube Music</Text>
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
                  <ActivityIndicator size="large" color="#FF375F" />
                  <Text style={styles.statusText}>Checking YouTube access...</Text>
                </View>
              ) : !isAuthenticated ? (
                <View style={styles.authSection}>
                  <Ionicons name="logo-youtube" size={64} color="#FF0000" style={styles.youtubeIcon} />
                  <Text style={styles.authTitle}>Connect YouTube Music</Text>
                  <Text style={styles.authDescription}>
                    Securely connect your YouTube Music account so we can create playlists for you.
                  </Text>
                  <View style={styles.buttonContainer}>
                    <AppButton
                      title="Connect YouTube Music"
                      onPress={handleAuthenticate}
                      backgroundColor="#FF0000"
                      textColor="#FFFFFF"
                      width="100%"
                    />
                  </View>
                </View>
              ) : isExporting ? (
                <View style={styles.exportSection}>
                  <ActivityIndicator size="large" color="#FF375F" style={styles.loader} />
                  <Text style={styles.exportStatus}>{exportProgress?.status}</Text>
                  {exportProgress && (
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(
                              100,
                              (exportProgress.current / exportProgress.total) * 100
                            )}%`,
                          },
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
                  <Text style={styles.successTitle}>All set!</Text>
                  <Text style={styles.successText}>
                    Found {exportResult.tracksFound} of {exportResult.tracksTotal} tracks.
                  </Text>
                  <View style={styles.buttonContainer}>
                    <AppButton
                      title="Open in YouTube Music"
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          if (typeof window !== 'undefined') {
                            window.open(exportResult.playlistUrl, '_blank');
                          }
                        } else {
                          Linking.openURL(exportResult.playlistUrl);
                        }
                      }}
                      backgroundColor="#FF0000"
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
                  <Ionicons name="logo-youtube" size={64} color="#FF0000" style={styles.youtubeIcon} />
                  <Text style={styles.readyTitle}>Ready to Export</Text>
                  <Text style={styles.readyDescription}>
                    Export "{playlistName}" with {songs.length} song{songs.length !== 1 ? 's' : ''} to YouTube
                    Music.
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
                      title="Export to YouTube Music"
                      onPress={handleExport}
                      backgroundColor="#FF0000"
                      textColor="#FFFFFF"
                      width="100%"
                    />
                  </View>
                  <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectButton}>
                    <Text style={styles.disconnectText}>Disconnect YouTube Music</Text>
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
  youtubeIcon: {
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
    backgroundColor: '#FF0000',
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


