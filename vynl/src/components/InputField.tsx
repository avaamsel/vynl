import React from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps, useColorScheme } from "react-native";
import { Colors } from "../constants/theme";

interface InputFieldProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string; // optional error message
  width?: number | string;
  height?: number | string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = "default",
  placeholder,
  width,
  height,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const dynamicStyles = StyleSheet.create({
    inputWrapper: {
      position: "relative",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingTop: 4,
      paddingHorizontal: 12,
      height: 50,
    },
    inputWrapperError: {
      borderColor: colors.error,
    },
    label: {
      position: "absolute",
      top: -8,
      left: 12,
      backgroundColor: colors.background,
      paddingHorizontal: 6,
      fontSize: 12,
      color: colors.placeholder,
    },
    input: {
      fontSize: 16,
      height: "100%",
      color: colors.text,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
  });
  
  return (
    <View style={styles.container}>
      <View
        style={[
          dynamicStyles.inputWrapper,
          error && dynamicStyles.inputWrapperError,
          { width: width as any, height: height as any },
        ]}
      >
        <Text style={dynamicStyles.label}>{label}</Text>
        <TextInput
          style={[dynamicStyles.input, { height: height as any }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          {...props}
        />
      </View>
      {error ? <Text style={dynamicStyles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default InputField;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
});
