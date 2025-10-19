import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert } from "react-native";
import { Link } from 'expo-router';
import AppButton from "../../components/AppButton"; // make sure path is correct
import InputField from '../../components/InputField';

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

  const handleSubmit = () => {
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

    // Clear errors and proceed
    setErrors({});
    console.log("Form Data:", formData);
    // Later: call API from services/api.ts
  };

  return (
    <View style={styles.container}>
      <Text style= {styles.title}>Sign Up</Text>
      <View style = {styles.inputcontainer}>
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
      <AppButton title="Sign Up" onPress={handleSubmit} />
      <Text style={styles.loginText}>
        Already have an account?{' '}
        <Link href="../LoginPage" style={styles.loginLink}>
          Log in
        </Link>
      </Text>
    </View>
  );
};

export default SignupPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 26,
    justifyContent: "center",
    backgroundColor: "#ffff",
  },
  title: {
    fontSize: 26,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputcontainer: {
    marginVertical:80,
    marginBottom: 180,
  },
  loginText: {
    textAlign: 'center',
    marginTop: 12,
    color: '#333',
  },
  loginLink: {
    color: '#007AFF',
  },
});
