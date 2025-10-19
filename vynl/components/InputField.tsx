import React from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";

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
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputWrapper,
          error && styles.inputWrapperError,
          { width: width as any, height: height as any },
        ]}
      >
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[styles.input, { height: height as any }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor="#999"
          autoCapitalize="none"
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

export default InputField;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputWrapper: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 14,
    paddingTop: 4,
    paddingHorizontal: 12,
    height: 50,
  },
  inputWrapperError: {
    borderColor: "red",
  },
  label: {
    position: "absolute",
    top: -8,
    left: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    fontSize: 12,
    color: "#666",
  },
  input: {
    fontSize: 16,
    height: "100%",
    color: "#000",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});
