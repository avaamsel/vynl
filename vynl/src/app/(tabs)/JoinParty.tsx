import { Image } from 'expo-image';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { useAuth } from '../../context/auth-context';
import { ITunesPlaylist } from '@/src/types';
import { useUser } from '@/src/hooks/use-user';

// Image assets
const imgBackground = require('@/assets/images/background.png');

export default function JoinPartyScreen() {
  const router = useRouter();
  const { authToken } = useAuth();
  const { user, loading: authLoading } = useUser();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { width: screenWidth } = useWindowDimensions();
  const buttonWidth = Math.min(screenWidth - 40, 400); // 20px padding on each side, max 400

  const handleCodeChange = (text: string, index: number) => {
    // Only allow alphanumeric characters
    const filteredText = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 1);
    
    const newCode = [...code];
    newCode[index] = filteredText;
    setCode(newCode);

    // Auto-focus next input
    if (filteredText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleJoinParty = async () => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      console.log('Joining party with code:', fullCode);
      console.log("Logged in as : ", user?.id);
      
      const res = await fetch(`/api/playlist/party/link/${encodeURIComponent(fullCode)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken,
        },
      })

      if (!res.ok) {
        Alert.alert('Error', 'Failed to find playlist with your code');
        setCode(['', '', '', '', '', '']);
      } else {
        const playlist_id = await res.json();
        const int_id = parseInt(playlist_id);
        if (Number.isNaN(int_id)) {
          console.log("Expected a number, instead got id : ", playlist_id);
        }

        router.push({
          pathname: '/(tabs)/playlist-detail',
          params: { id: int_id }
        });
      }

    } else {
      Alert.alert('Error', 'Code must be 6 characters');
    }
  };

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
            <Text style={styles.headerTitle}>Enter Code</Text>
          </View>

          {/* Code Input Fields */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={styles.codeInput}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                maxLength={1}
                keyboardType="default"
                autoCapitalize="characters"
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Instructional Text */}
          <Text style={styles.instructionText}>
            Enter A Party Code To Join The Playlist
          </Text>

          {/* Buttons Section */}
          <View style={styles.buttonContainer}>
            {/* Join Party Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleJoinParty}
              style={{ width: buttonWidth }}
            >
              <LinearGradient
                colors={['#FF6B9D', '#FF8C42']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.gradientButton, { width: buttonWidth }]}
              >
                <Text style={styles.gradientButtonText}>JOIN PARTY</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/PartyMode')}
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
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 120,
    alignItems: 'center',
  },
  headerSection: {
    marginBottom: 50,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Poppins',
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    fontSize: 24,
    fontFamily: 'Poppins',
    fontWeight: '700',
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  instructionText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  gradientButton: {
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



