import { StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, onAuthStateChanged } from "firebase/auth";

export default function TabTwoScreen() {
  const [image, setImage] = useState<any>(null);
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Storage</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
