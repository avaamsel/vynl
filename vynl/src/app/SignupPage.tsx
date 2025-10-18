import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert } from "react-native";
import AppButton from "../../components/AppButton"; // make sure path is correct
import InputField from '../../components/InputField';

interface FormData {
  email: string;
  password: string;
}

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" });

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    console.log("Form Data:", formData);
    Alert.alert("Sign Up", `Email: ${formData.email}\nPassword: ${formData.password}`);
    // Later: call API from services/api.ts
  };

  return (
    <View style={styles.container}>
        <InputField
            label="Email"
            value={formData.email}
            onChangeText={(text) => handleChange("email", text)}
            keyboardType="email-address"
            placeholder="Enter your email"
        />

        <InputField
            label="Password"
            value={formData.password}
            onChangeText={(text) => handleChange("password", text)}
            secureTextEntry={true}
            placeholder="Enter your password"
        />
      <AppButton title="Sign Up" onPress={handleSubmit} />
    </View>
  );
};

export default SignupPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
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
});
