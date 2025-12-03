import { Image } from 'expo-image';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Poppins_400Regular } from '@expo-google-fonts/poppins';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';

// Image assets
const imgBackground = require('@/assets/images/background.png');

export default function JoinPartyScreen() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
  });

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

  const handleJoinParty = () => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      // TODO: Validate and join party with code
      console.log('Joining party with code:', fullCode);
    }
  };

  if (!fontsLoaded) {
    return null;
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
            <Text style={styles.headerTitle}>Enter Code</Text>
          </View>

          {/* Code Input Fields */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
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
            >
              <LinearGradient
                colors={['#FF6B9D', '#FF8C42']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
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



