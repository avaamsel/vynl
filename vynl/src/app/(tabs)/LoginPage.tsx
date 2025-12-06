import React, { useState } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Colors } from '@/src/constants/theme';
import { Link, useRouter } from 'expo-router';
import AppButton from "@/src/components/AppButton";
import InputField from '@/src/components/InputField';
import { useAuth } from '@/src/context/auth-context';

interface FormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData({ ...formData, [name]: value });
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
    // Validate password not empty
    if (!formData.password) {
      setErrors((prev) => ({ ...prev, password: 'Please enter your password' }));
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      await login(email, formData.password);
      console.log("Logged in successfully");
      // Navigate to home screen after successful login
      router.push('/(tabs)');
    } catch (err: any) {
      console.error('Login error', err);
      setErrors((prev) => ({ ...prev, password: err?.message || 'Login failed. Please check your credentials.' }));
    } finally {
      setIsLoading(false);
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
      color:'#F28695',
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
      <AppButton 
        title={isLoading ? "Logging in..." : "Log In"} 
        onPress={handleSubmit} 
        backgroundColor={colors.primary}
        disabled={isLoading}
      />
      <Text style={dynamicStyles.signupText}>
        Don't have an account?{' '}
        <Link href="/(tabs)/SignupPage" style={dynamicStyles.signupLink}>
          Sign up
        </Link>
      </Text>
    </View>
  );
};

export default LoginPage;

