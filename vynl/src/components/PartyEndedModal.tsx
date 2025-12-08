import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from './AppButton';

interface PartyEndedModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigate?: () => void;
}

export default function PartyEndedModal({
  visible,
  onClose,
  onNavigate,
}: PartyEndedModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
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
        <View style={styles.modalContentWrapper}>
          <LinearGradient colors={['#F8F9FD', '#FFFFFF']} style={[styles.modalContent, { paddingBottom: Math.max(16, insets.bottom) }]}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="close-circle" size={64} color="#F28695" />
              </View>
              <Text style={styles.title}>Party Session Ended</Text>
              <Text style={styles.message}>
                Host has ended the party session. No songs can be added at this time.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <AppButton
                title="OK"
                onPress={() => {
                  onClose();
                  onNavigate?.();
                }}
                backgroundColor="#F28695"
                textColor="#FFFFFF"
                width="100%"
              />
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContentWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#001133',
    fontFamily: 'AppleGaramond-Italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6F7A88',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 8,
  },
});

