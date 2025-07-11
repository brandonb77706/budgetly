import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { SafeAreaView } from "react-native-safe-area-context";
import SignOut from "@/components/SignOut";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Keychain from "react-native-keychain";
import { ScrollView } from "react-native";

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
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [transactions, setTransactions] = useState<any[]>();
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

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
  };

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      console.log("trying to fetch");

      //Get access token from Keychain
      const credentials = await Keychain.getGenericPassword({
        service: "plaid",
      });

      if (!credentials) {
        console.log("no access token found");

        if (retryAttempts < 5) {
          setTimeout(() => {
            setRetryAttempts((prev) => prev + 1);
          }, 2000); // Retry after 2 seconds
        }
        return false;
      }
      console.log("accessToken found", credentials.password);

      // Set a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("http://localhost:5001/api/transactions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          access_token: credentials.password,
        },
      });
      console.log("fetched transactions");
      if (!response.ok) {
        throw new Error("failed to get tranactions");
      }
      console.log("got response");
      const data = await response.json();

      console.log("got data");
      setTransactions(data);
      setTransactionsLoading(false);
    } catch (error) {
      console.log("error getting recent transactions", error);
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (accountData) {
      console.log(accountData.accounts);
    }
  }, [accountData]);

  //calling fetchdata
  // Add this to your component
  useEffect(() => {
    const loadData = async () => {
      await fetchAccountData();
      await fetchTransactions();
    };

    loadData();
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

      <ScrollView style={styles.recentSpendingContainer}>
        <Text style={styles.sectionTitle}>Recent Spending</Text>
        {transactions && transactions.length > 0 ? (
          transactions.slice(0, 5).map((transaction: any, index: any) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionName}>{transaction.name}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString()}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: transaction.amount < 0 ? "#2e7d32" : "#c62828" },
                ]}
              >
                ${Math.abs(transaction.amount).toFixed(2)}
              </Text>
            </View>
          ))
        ) : transactionsLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading transactions...</Text>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              Your recent transactions will appear here once your accounts are
              synced.
            </Text>
          </View>
        )}
      </ScrollView>
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
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#424242",
  },
  transactionDate: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
