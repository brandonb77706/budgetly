import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import colors from "@/constants/ColorScheme";
import { Text, View } from "@/components/Themed";
import { auth } from "@/FirebaseConfig";

const SignOut = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => auth.signOut()}>
        <Text style={styles.title}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.primary,
    fontSize: 30,
  },
});
export default SignOut;
