import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { SafeAreaView } from "react-native-safe-area-context";
import SignOut from "@/components/SignOut";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

//interfaces
interface Account {
  account_id: string;
  name: string;
  type: string;
  subtype: string;
  balances: {
    current: number;
    available: number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface AccountData {
  accounts: Account[];
  [key: string]: any;
}

const Dashboard = () => {
  const params = useLocalSearchParams();
  const [accountData, setAccountData] = useState<AccountData | null>(null);

  const fetchAccountData = async () => {
    const user_Id = await AsyncStorage.getItem("userId");
    if (!user_Id) {
      console.log("no user_Id found");
      return;
    } else {
      console.log("user_Id is:", user_Id);
    }
    console.log("getting account data for ", user_Id);

    const accDataString = await AsyncStorage.getItem("accData");

    // Parse the data if it exists
    if (accDataString) {
      try {
        const parsedData = JSON.parse(accDataString);
        setAccountData(parsedData);
      } catch (e) {
        console.error("Error parsing stored account data:", e);
      }
    }
    console.log("account data in dashboard", accDataString);
    try {
      //fetching accounts after token exchange
      const accountResponse = await fetch(
        "http://localhost:5001/api/accounts",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            userId: user_Id,
          },
        }
      );

      // Check if response is ok
      if (!accountResponse.ok) {
        throw new Error(
          `Server returned ${accountResponse.status}: ${accountResponse.statusText}`
        );
      }
      const data = await accountResponse.json();
      setAccountData(data);
      console.log("got accountdata");
    } catch (error) {
      console.log("error fetch accountdata", error);
    }
  };

  useEffect(() => {
    if (accountData) {
      console.log(accountData.accounts);
    }
  }, [accountData]);

  //calling fetchdata
  useEffect(() => {
    fetchAccountData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Finwise</Text>
        <SignOut />
      </View>

      <View style={styles.accountsContainer}>
        <Text style={styles.sectionTitle}>Your Accounts</Text>
        {accountData && accountData.accounts ? (
          accountData.accounts.map((account, index) => (
            <View key={index} style={styles.accountCard}>
              <Text style={styles.accountName}>{account.name}</Text>
              <Text style={styles.accountBalance}>
                $
                {account.balances.available
                  ? account.balances.available.toFixed(2)
                  : account.balances.current.toFixed(2)}
              </Text>
              <Text style={styles.accountType}>
                {account.type} • {account.subtype}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.loadingContainer}>
            <Text>Loading account data...</Text>
          </View>
        )}
      </View>

      <View style={styles.recentSpendingContainer}>
        <Text style={styles.sectionTitle}>Recent Spending</Text>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            Your recent transactions will appear here once your accounts are
            synced.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2e7d32", // Green color for financial app
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 24,
    color: "#424242",
  },
  accountsContainer: {
    marginBottom: 24,
    width: "100%",
  },
  accountCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accountName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#424242",
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e7d32",
    marginVertical: 8,
  },
  accountType: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  recentSpendingContainer: {
    width: "100%",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 12,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderRadius: 8,
    marginVertical: 16,
  },
  errorText: {
    color: "#c62828",
    marginBottom: 8,
  },
});
