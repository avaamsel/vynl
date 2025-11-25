import { Image } from 'expo-image';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Poppins_400Regular } from '@expo-google-fonts/poppins';
import { EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Image assets
const imgBackground = require('@/assets/images/background.png');

export default function PartyModeScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    EBGaramond: EBGaramond_400Regular,
    'AppleGaramond-Regular': require('@/assets/fonts/AppleGaramond.ttf'),
    'AppleGaramond-Italic': require('@/assets/fonts/AppleGaramond-Italic.ttf'),
  });

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
            <Text style={styles.headerTitle}>Party Mode</Text>
            <Text style={styles.descriptionText}>
              Create or Join a Live Playlist and Team Up with Friends to build the Perfect Party Soundtrack.
            </Text>
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonContainer}>
            {/* Join Party Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Add Join Party navigation
                console.log('Join Party pressed');
              }}
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

            {/* Create Party Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Add Create Party navigation
                console.log('Create Party pressed');
              }}
            >
              <View style={styles.outlinedButton}>
                <Text style={styles.outlinedButtonText}>HOST PARTY</Text>
              </View>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  headerSection: {
    marginBottom: 40,
    maxWidth: 350,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Poppins',
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    paddingBottom: 20,
    alignItems: 'center',
    marginTop: 20,
    gap: 16,
    width: '100%',
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
  outlinedButton: {
    width: '100%',
    maxWidth: 400,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF8F5',
    borderWidth: 2,
    borderColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outlinedButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '700',
    color: '#FF8C42',
    letterSpacing: 0.5,
  },
});

