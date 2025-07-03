// APP COMPONENT
// Upon rendering of App component, make a request to create and
// obtain a link token to be used in the Link component
import React, { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { openLink, LinkSuccess, LinkExit } from "react-native-plaid-link-sdk";
import { TouchableOpacity } from "react-native";

import { StyleSheet } from "react-native";
import colors from "@/constants/ColorScheme";

const Linking = () => {
  const [linkToken, setLinkToken] = useState(null);
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  console.log("recevied userID:", userId);

  const generateToken = async () => {
    const response = await fetch(
      "http://localhost:5001/api/create_link_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );
    const data = await response.json();
    setLinkToken(data.link_token);
  };

  useEffect(() => {
    if (userId) {
      generateToken();
    } else {
      console.error("none userId");
    }
  }, [userId]);

  return linkToken != null ? (
    <Link linkToken={linkToken} userId={userId} />
  ) : (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>...Loading</Text>
    </View>
  );
};
// LINK COMPONENT
// Use Plaid Link and pass link token and onSuccess function
// in configuration to initialize Plaid Link
interface LinkProps {
  linkToken: string | null;
  userId: string;
}
const Link: React.FC<LinkProps> = (props: LinkProps) => {
  const router = useRouter();

  const onSuccess = React.useCallback(
    async (public_token: any) => {
      //token exchange
      try {
        const response = await fetch(
          "http://localhost:5001/api/exchange_public_token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ public_token, userId: props.userId }),
          }
        );

        const tokenData = await response.json();
        console.log("Token exchange worked: ", tokenData);

        //fetching accounts after token exchange
        const accountResponse = await fetch(
          "http://localhost:5001/api/accounts",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              userId: props.userId,
            },
          }
        );
        const accountData = await accountResponse.json();
        console.log("account data successful:", accountData);

        //send user to dash board
        router.push({
          pathname: "/Dashboard",
          params: { userId: props.userId, accountData: accountData },
        });
      } catch (err) {
        console.error("Err in link flow", err);
      }
    },
    [props.userId, router]
  );

  const config = {
    token: props.linkToken,
    onSuccess: (public_token: string) => {
      console.log("Success:", public_token);
      // Call your token exchange function
      onSuccess(public_token);
    },
    onExit: (error: any, metadata: any) => {
      console.log("Exit:", error, metadata);
    },
  };

  const handleLinkPress = () => {
    openLink({
      tokenConfig: {
        token: props.linkToken!,
        noLoadingState: false,
      },
      onSuccess: (success) => {
        console.log("Success with public token:", success.publicToken);
        onSuccess(success.publicToken);
      },
      onExit: (exit) => {
        console.log("Exit:", exit);
      },
    });
  };
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>FinWise</Text>
        <View style={styles.card}>
          <Text style={styles.subtitle}>Connect Your Bank Account</Text>
          <Text style={styles.instructions}>
            Link your bank account securely using Plaid to track your finances
            and manage your budget.
          </Text>
        </View>
        // Remove the PlaidLink component // Instead, use TouchableOpacity with
        open() function
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            disabled={!props.linkToken}
            style={!props.linkToken ? styles.disabledButton : styles.linkButton}
            onPress={handleLinkPress}
          >
            <Text style={styles.buttonText}>Link Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};
export default Linking;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 24,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 32,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 20,
  },
  linkButton: {
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
  },
  card: {
    backgroundColor: colors.inputBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    width: "100%",
    alignItems: "center",
  },
  icon: {
    width: 60,
    height: 60,
    marginBottom: 16,
  },
  instructions: {
    fontSize: 14,
    color: colors.secondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  disabledButton: {
    // Copy all properties from linkButton
    backgroundColor: colors.disabledButton || "#cccccc",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    // Add opacity to show it's disabled
    opacity: 0.7,
  },
});
