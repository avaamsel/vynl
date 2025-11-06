import React, { useState } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Colors } from '../constants/theme';
import { Link } from 'expo-router';
import AppButton from "../components/AppButton";
import InputField from '../components/InputField';
import { supabase } from '@/src/utils/supabase';
import { Playlist } from '../types';

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
    // Later: call API from services/api.ts
    console.log("Login Data:", formData);


    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });
      console.log(data);
      console.log(error);
      if (error) {
        setErrors((prev) => ({ ...prev, password: error.message || 'Login failed' }));
      }
      const session = data.session;
      if (session?.access_token) {
        const playlist: Playlist = {
          id: 0,
          name: 'Test Create Playlist',
          created_at: '',
          user_id: session.user.id,
          songs: [
            {
              song_id: 1,
              title: "Unknown/Nth",
              artist: "Hozier",
              duration_sec: 10
            },
            {
              song_id: 2,
              title: "The Ghost On The Shore",
              artist: "Lord Huron",
              duration_sec: 56
            }
          ]
        }
        const response = await fetch('/api/playlist', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + session.access_token
          },
          body: JSON.stringify(playlist)
        });

        console.log(response);
        // if (response.ok) {
        //   const playlist: Playlist = await response.json();

        //   console.log('Recommended Playlist:', playlist);
          
        // }
      }
    } catch (err) {
      console.error('Login error', err);
      setErrors((prev) => ({ ...prev, password: 'An unexpected error occurred' }));
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
