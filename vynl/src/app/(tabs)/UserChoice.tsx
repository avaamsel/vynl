import { Link } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from "react-native";
import { Colors } from '@/src/constants/theme';

export default function AuthChoice() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.background, 
      alignItems: "center", 
      justifyContent: "center", 
      padding: 24 
    },
    card: { 
      width: 320, 
      alignItems: "center", 
      justifyContent: "center" 
    },
    btn: { 
      width: 200, 
      height: 44, 
      borderRadius: 8, 
      backgroundColor: theme.secondary, 
      alignItems: "center", 
      justifyContent: "center", 
      marginBottom: 14 
    },
    btnText: { 
      color: "#fff", 
      fontSize: 16, 
      fontWeight: "600" 
    },
    btnSecondary: { 
      width: 200, 
      height: 44, 
      borderRadius: 8, 
      backgroundColor: theme.secondary,
      alignItems: "center", 
      justifyContent: "center" 
    },
    btnSecondaryText: { 
      color: "#fff", 
      fontSize: 16, 
      fontWeight: "600" 
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Link href="/(tabs)/LoginPage" asChild>
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Log in</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(tabs)/SignupPage" asChild>
          <TouchableOpacity style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>Sign up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

