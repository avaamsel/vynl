import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';

interface AppButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  backgroundColor?: string; // optional prop to change color
  width?: number | string;
}

const AppButton: React.FC<AppButtonProps> = ({ title, onPress, backgroundColor = '#F1CCA6', width }) => {
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor, width: width as any }]} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

export default AppButton;

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 15,
    minWidth: 140,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
});
