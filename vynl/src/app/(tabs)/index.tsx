import { Image } from 'expo-image';
import { StyleSheet, View, Text, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Poppins_400Regular } from '@expo-google-fonts/poppins';
import { EBGaramond_400Regular } from '@expo-google-fonts/eb-garamond';

// Image assets
const imgVinyl1 = require('@/assets/images/vinyl.png');
const imgBackground = require('@/assets/images/background.png');

export default function DashboardScreen() {
  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    EBGaramond: EBGaramond_400Regular,
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
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.subtitleText}>What's Your Vibe Today?</Text>
          </View>

          {/* Middle Section - Large Card with Vinyl Record */}
          <View style={styles.cardContainer}>
            <View style={styles.peachCard}>
              <Image
                source={imgVinyl1}
                style={styles.vinylImage}
                contentFit="cover"
              />
            </View>
          </View>

          {/* Create New Playlist Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.playlistButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF6B9D', '#FF8C42']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.plusIconGradient}
              >
                <Text style={styles.plusSign}>+</Text>
              </LinearGradient>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Create New Playlist</Text>
                <Text style={styles.buttonSubtitle}>Start discovering your music</Text>
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
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 120, // Space for navigation bar
  },
  welcomeSection: {
    marginBottom: 30,
    maxWidth: 350,
    alignSelf: 'center',
    width: '100%',
  },
  welcomeText: {
    fontSize: 60,
    fontFamily: Platform.select({
      ios: 'AppleGaramond-Italic',
      android: 'EBGaramond',
      default: 'EBGaramond',
    }),
    fontStyle: 'italic',
    color: '#000000',
    textAlign: 'left',
    lineHeight: 72,
    fontWeight: '300',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#000000',
    textAlign: 'left',
    lineHeight: 27,
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 25,
  },
  peachCard: {
    width: '100%',
    maxWidth: 350,
    height: 320,
    backgroundColor: '#FFF8F5',
    borderRadius: 28,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  vinylImage: {
    position: 'absolute',
    right: -90,
    top: '50%',
    marginTop: -140,
    width: 320,
    height: 320,
  },
  buttonContainer: {
    paddingBottom: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  playlistButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  plusIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  plusSign: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 32,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '400',
    color: '#666666',
  },
});
