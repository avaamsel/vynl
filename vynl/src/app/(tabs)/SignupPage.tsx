import React, { useState } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Colors } from '@/src/constants/theme';
import { Link } from 'expo-router';
import AppButton from "@/src/components/AppButton"; // make sure path is correct
import InputField from '@/src/components/InputField';
import { validatePassword } from "@/scripts/validatePassword";
import { passwordErrorMessages } from "@/scripts/validatePassword";
import { supabase } from '@/src/utils/supabase';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" , confirmPassword: ""});
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData({ ...formData, [name]: value });
    // clear error for this field when user edits it
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async () => {
    // Validate email format
    const email = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      // show inline error under confirm password input
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    // Check if password fullfils requirements
    const passError = validatePassword(formData.password);
    if (passError !== 0) {
      setErrors((prev) => ({ ...prev, password: passwordErrorMessages[passError] }));
      return;
    }

    // Clear errors and proceed
    setErrors({});
    console.log("Form Data:", formData);
    // Later: call API from services/api.ts
    console.log('HERE');
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: 'https://example.com/welcome',
        },
      });
      if (signupError) {
        console.error('Sign up error:', signupError);
        setErrors((prev) => ({ ...prev, email: 'Sign up failed. Please try again.' }));
        return;
      }
      console.log('Sign up data:', data);
    } catch (err) {
      console.error('Unexpected sign up error:', err);
      setErrors((prev) => ({ ...prev, email: 'Unexpected error. Please try again.' }));
    }
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
    label: {
      fontSize: 16,
      marginBottom: 4,
      fontWeight: "bold",
      color: colors.text,
    },
    inputcontainer: {
      marginVertical: 80,
      marginBottom: 180,
    },
    loginText: {
      textAlign: 'center',
      marginTop: 12,
      color: colors.text,
    },
    loginLink: {
      color:'#F28695',
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.title}>Sign Up</Text>
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
        <InputField
          label="Confirm password"
          value={formData.confirmPassword}
          onChangeText={(text) => handleChange("confirmPassword", text)}
          secureTextEntry={true}
          placeholder="Confirm your password"
          height={55}
          error={errors.confirmPassword}
        />
      </View>
      <AppButton title="Sign Up" onPress={handleSubmit} backgroundColor= {colors.primary} />
      <Text style={dynamicStyles.loginText}>
        Already have an account?{' '}
        <Link href="/(tabs)/LoginPage" style={dynamicStyles.loginLink}>
          Log in
        </Link>
      </Text>
    </View>
  );
};

export default SignupPage;

