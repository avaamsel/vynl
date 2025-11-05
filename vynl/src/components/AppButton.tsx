import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';

interface AppButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  backgroundColor?: string; // optional prop to change color
  textColor?: string; // optional prop to change text color
  width?: number | string;
  disabled?: boolean; // optional prop to disable the button
}

const AppButton: React.FC<AppButtonProps> = ({ title, onPress, backgroundColor = '#F1CCA6', textColor = 'white', width, disabled = false }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        { backgroundColor, width: width as any, opacity: disabled ? 0.5 : 1 }
      ]} 
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
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
