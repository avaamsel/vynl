import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { AuthProvider } from '@/src/context/auth-context';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { handleSpotifyCallbackFromQuery } from '@/src/utils/spotifyAuth';

export const unstable_settings = { anchor: 'tabs' };

function SpotifyCallbackHandler() {
  useEffect(() => {
    // Handle Spotify OAuth callback on web when app loads
    if (Platform.OS === 'web') {
      handleSpotifyCallbackFromQuery().catch((error) => {
        console.error('Error handling Spotify callback on app load:', error);
      });
    }
  }, []);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SpotifyCallbackHandler />
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}