import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { StyleSheet } from "react-native";
import colors from "../constants/ColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PlaidCallback() {
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log("Received Plaid callback params:", params);

    async function processCallback() {
      try {
        // First check if user is logged in by retrieving stored auth data
        const authData = await AsyncStorage.getItem("user_auth");

        if (!authData) {
          console.log("No authentication data found, redirecting to login");
          router.replace("/");
          return;
        }

        // User is authenticated, proceed with token exchange
        if (params.public_token) {
          const userData = JSON.parse(authData);

          const response = await fetch(
            "http://localhost:5001/api/exchange_public_token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                public_token: params.public_token,
                userId: userData.userId, // Include user ID from stored auth data
              }),
            }
          );

          if (response.ok) {
            console.log(
              "Successfully exchanged token, navigating to Dashboard"
            );
            router.replace("/(tabs)/Dashboard");
          } else {
            console.error("Failed to exchange token");
            router.replace("/(tabs)/Dashboard"); // Still go to Dashboard even if token exchange fails
          }
        } else {
          console.log("No public_token found, but user is authenticated");
          router.replace("/(tabs)/Dashboard");
        }
      } catch (error) {
        console.error("Error in Plaid callback:", error);
        router.replace("/");
      }
    }

    processCallback();
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Processing your bank connection...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: colors.text,
  },
});
