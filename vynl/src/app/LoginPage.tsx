import React, { useState } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Colors } from '../../constants/theme';
import { Link } from 'expo-router';
import AppButton from "../../components/AppButton";
import InputField from '../../components/InputField';

interface FormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = () => {
    // Validate email format
    const email = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }
    // Validate password not empty
    if (!formData.password) {
      setErrors((prev) => ({ ...prev, password: 'Please enter your password' }));
      return;
    }
    setErrors({});
    // Later: call API from services/api.ts
    console.log("Login Data:", formData);
  };

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 26,
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 26,
      color: colors.text,
    },
    inputcontainer: {
      marginVertical: 90,
      marginBottom: 230,
    },
    signupText: {
      textAlign: 'center',
      marginTop: 12,
      color: colors.text,
    },
    signupLink: {
      color: '#007AFF',
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.title}>Log In</Text>
      <View style={dynamicStyles.inputcontainer}>
        <InputField
          label="Email"
          value={formData.email}
          onChangeText={(text) => handleChange("email", text)}
          keyboardType="email-address"
          placeholder="Enter your email"
          height={55}
          error={errors.email}
        />
        <InputField
          label="Password"
          value={formData.password}
          onChangeText={(text) => handleChange("password", text)}
          secureTextEntry={true}
          placeholder="Enter your password"
          height={55}
          error={errors.password}
        />
      </View>
      <AppButton title="Log In" onPress={handleSubmit} backgroundColor= {colors.primary} />
      <Text style={dynamicStyles.signupText}>
        Don't have an account?{' '}
        <Link href="../SignupPage" style={dynamicStyles.signupLink}>
          Sign up
        </Link>
      </Text>
    </View>
  );
};

export default LoginPage;

// ...removed static styles, now using dynamicStyles
