import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Colors } from '@/src/constants/theme';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppButton from "@/src/components/AppButton"; // make sure path is correct
import InputField from '@/src/components/InputField';
import { validatePassword } from "@/scripts/validatePassword";
import { passwordErrorMessages } from "@/scripts/validatePassword";
import { supabase } from '@/src/utils/supabase';
import { useAuth } from '@/src/context/auth-context';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const SignupPage: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" , confirmPassword: ""});
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData({ ...formData, [name]: value });
    // clear error for this field when user edits it
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Check individual password requirements
  const passwordRequirements = useMemo(() => {
    const password = formData.password;
    return {
      minLength: password.length >= 8,
      maxLength: password.length <= 35,
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
    };
  }, [formData.password]);

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
    setIsLoading(true);
    
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
        setIsLoading(false);
        return;
      }
      
      console.log('Sign up data:', data);
      
      // After successful signup, log the user in automatically
      try {
        await login(formData.email, formData.password);
        console.log("Signed up and logged in successfully");
        // Navigate to home screen after successful signup and login
        router.push('/(tabs)');
      } catch (loginError: any) {
        console.error('Auto-login error after signup:', loginError);
        // If auto-login fails, still show success but user may need to log in manually
        setErrors((prev) => ({ ...prev, email: 'Account created, but auto-login failed. Please log in manually.' }));
      }
    } catch (err) {
      console.error('Unexpected sign up error:', err);
      setErrors((prev) => ({ ...prev, email: 'Unexpected error. Please try again.' }));
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
    label: {
      fontSize: 16,
      marginBottom: 4,
      fontWeight: "bold",
      color: colors.text,
    },
    inputcontainer: {
      marginVertical: 80,
      marginBottom: 20,
    },
    requirementsContainer: {
      marginTop: 8,
      marginBottom: 20,
      paddingLeft: 4,
    },
    requirementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
    },
    requirementText: {
      fontSize: 13,
      color: colors.text,
      marginLeft: 8,
      opacity: 0.7,
    },
    requirementTextMet: {
      opacity: 1,
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
        {formData.password.length > 0 && (
          <View style={dynamicStyles.requirementsContainer}>
            <View style={dynamicStyles.requirementRow}>
              <Ionicons 
                name={passwordRequirements.minLength ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={passwordRequirements.minLength ? "#4CAF50" : "#F44336"} 
              />
              <Text style={[dynamicStyles.requirementText, passwordRequirements.minLength && dynamicStyles.requirementTextMet]}>
                At least 8 characters
              </Text>
            </View>
            <View style={dynamicStyles.requirementRow}>
              <Ionicons 
                name={passwordRequirements.maxLength ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={passwordRequirements.maxLength ? "#4CAF50" : "#F44336"} 
              />
              <Text style={[dynamicStyles.requirementText, passwordRequirements.maxLength && dynamicStyles.requirementTextMet]}>
                Less than 35 characters
              </Text>
            </View>
            <View style={dynamicStyles.requirementRow}>
              <Ionicons 
                name={passwordRequirements.hasNumber ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={passwordRequirements.hasNumber ? "#4CAF50" : "#F44336"} 
              />
              <Text style={[dynamicStyles.requirementText, passwordRequirements.hasNumber && dynamicStyles.requirementTextMet]}>
                At least one number
              </Text>
            </View>
            <View style={dynamicStyles.requirementRow}>
              <Ionicons 
                name={passwordRequirements.hasSpecialChar ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={passwordRequirements.hasSpecialChar ? "#4CAF50" : "#F44336"} 
              />
              <Text style={[dynamicStyles.requirementText, passwordRequirements.hasSpecialChar && dynamicStyles.requirementTextMet]}>
                At least one special character
              </Text>
            </View>
            <View style={dynamicStyles.requirementRow}>
              <Ionicons 
                name={passwordRequirements.hasUppercase ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={passwordRequirements.hasUppercase ? "#4CAF50" : "#F44336"} 
              />
              <Text style={[dynamicStyles.requirementText, passwordRequirements.hasUppercase && dynamicStyles.requirementTextMet]}>
                At least one uppercase letter
              </Text>
            </View>
            <View style={dynamicStyles.requirementRow}>
              <Ionicons 
                name={passwordRequirements.hasLowercase ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={passwordRequirements.hasLowercase ? "#4CAF50" : "#F44336"} 
              />
              <Text style={[dynamicStyles.requirementText, passwordRequirements.hasLowercase && dynamicStyles.requirementTextMet]}>
                At least one lowercase letter
              </Text>
            </View>
          </View>
        )}
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
      <AppButton 
        title={isLoading ? "Signing up..." : "Sign Up"} 
        onPress={handleSubmit} 
        backgroundColor={colors.primary}
        disabled={isLoading}
      />
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

