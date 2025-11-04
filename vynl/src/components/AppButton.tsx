import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';

interface AppButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  backgroundColor?: string; // optional prop to change color
  textColor?: string;
  width?: number | string;
  disabled?: boolean;
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  backgroundColor = '#F1CCA6',
  textColor,
  width,
  disabled = false,
}) => {
  const bg = backgroundColor;
  const txt = textColor ?? (disabled ? '#9B9B9B' : '#ffffff');

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bg, width: width as any }]}
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.text, { color: txt }]}>{title}</Text>
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
