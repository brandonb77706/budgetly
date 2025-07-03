import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { StyleSheet } from "react-native";
import React, { useState, useEffect } from "react";
import { auth } from "../FirebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Import doc and setDoc
import { db } from "@/FirebaseConfig";

import { router } from "expo-router";
import colors from "@/constants/ColorScheme";

const Index = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = async (): Promise<string | null> => {
    try {
      // Sign in the user with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user; // Authenticated user object
      const userId = user.uid; // Firebase UID

      console.log("User credentials are:", user);
      console.log("User signed in with UID:", userId);

      // Navigate to the Linking screen and pass userId as a prop
      if (user) router.push({ pathname: "/linking", params: { userId } });

      return userId; // Return the userId
    } catch (error: any) {
      console.log(error);
      alert("Sign in failed: " + error.message);
      return null; // Return null if sign-in fails
    }
  };

  const signUp = async (): Promise<string | null> => {
    try {
      // Create the user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user; // Authenticated user object
      const userId = user.uid; // Firebase UID

      // Define user data
      const userData = {
        username: username,
        email: email,
        createdAt: new Date(),
      };

      // Save user data to Firestore
      await setDoc(doc(db, "users", userId), userData);

      console.log("User signed up and profile saved to Firestore!", userId);

      // Navigate to the Linking screen and pass userId as a prop
      if (user) router.push({ pathname: "/linking", params: { userId } });

      return userId; // Return the userId
    } catch (error: any) {
      console.log(error);
      alert("Sign up failed: " + error.message);
      return null; // Return null if sign-up fails
    }
  };

  return (
    <View style={{ flex: 1, padding: 30 }}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>FinWise</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.placeholder}
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={signIn}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={signUp}>
          <Text style={styles.buttonTextSecondary}>Make Account</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: "center", // centers form vertically
  },
  title: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    height: 52,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: colors.buttonText,
    fontWeight: "600",
    fontSize: 16,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonTextSecondary: {
    color: colors.buttonTextSecondary,
    fontWeight: "600",
    fontSize: 16,
  },
});
