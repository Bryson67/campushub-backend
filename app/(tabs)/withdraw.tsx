import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function WithdrawPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("mpesa");
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showTournamentSelector, setShowTournamentSelector] = useState(false);

  // Get user data
  const user = useQuery(api.users.getUserProfile, userId ? { userId } : "skip");

  // Get user's withdrawals
  const withdrawals = useQuery(
    api.withdrawals.getUserWithdrawals,
    userId ? { userId } : "skip",
  );

  // Mutations
  const requestWithdrawal = useMutation(api.withdrawals.requestWithdrawal);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      setUserId(storedUserId);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!phoneNumber) {
      Alert.alert("Error", "Please enter your M-Pesa phone number");
      return;
    }

    const withdrawAmount = parseFloat(amount);
    const userBalance = user?.balance || 0;

    if (withdrawAmount > userBalance) {
      Alert.alert("Error", "Insufficient balance");
      return;
    }

    if (withdrawAmount < 100) {
      Alert.alert("Error", "Minimum withdrawal is KES 100");
      return;
    }

    setLoading(true);

    try {
      const result = await requestWithdrawal({
        userId: userId!,
        userName: user?.gamerTag || user?.username || "User",
        amount: withdrawAmount,
        phoneNumber,
        paymentMethod: selectedMethod,
        tournamentId: selectedTournament?._id,
        tournamentName: selectedTournament?.name,
      });

      Alert.alert("Success", result.message);
      setAmount("");
      setPhoneNumber("");
      setSelectedTournament(null);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      case "pending":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      case "pending":
        return "time";
      default:
        return "help-circle";
    }
  };

  if (loading && !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ffff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#00ffff"]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(user?.balance || 0)}
        </Text>
        <Text style={styles.balanceNote}>Minimum withdrawal: KES 100</Text>
      </View>

      {/* Withdrawal Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Request Withdrawal</Text>

        {/* Amount Input */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="cash-outline"
            size={20}
            color="#00ffff"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Amount"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Phone Number Input */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="call-outline"
            size={20}
            color="#00ffff"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="M-Pesa Phone Number (e.g., 254712345678)"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        {/* Tournament Selection (Optional) */}
        <TouchableOpacity
          style={styles.tournamentSelector}
          onPress={() => setShowTournamentSelector(!showTournamentSelector)}
        >
          <Ionicons name="trophy-outline" size={20} color="#00ffff" />
          <Text style={styles.tournamentSelectorText}>
            {selectedTournament
              ? selectedTournament.name
              : "Select Tournament (Optional)"}
          </Text>
          <Ionicons
            name={showTournamentSelector ? "chevron-up" : "chevron-down"}
            size={20}
            color="#00ffff"
          />
        </TouchableOpacity>

        {/* Tournament List (if expanded) */}
        {showTournamentSelector &&
          user?.tournaments &&
          user.tournaments.length > 0 && (
            <View style={styles.tournamentList}>
              {user.tournaments
                .filter((t: any) => t.isWinner)
                .map((tournament: any) => (
                  <TouchableOpacity
                    key={tournament._id}
                    style={[
                      styles.tournamentItem,
                      selectedTournament?._id === tournament._id &&
                        styles.tournamentItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedTournament(tournament);
                      setShowTournamentSelector(false);
                    }}
                  >
                    <View style={styles.tournamentItemLeft}>
                      <Ionicons name="trophy" size={16} color="#ffee00" />
                      <Text style={styles.tournamentItemName}>
                        {tournament.name}
                      </Text>
                    </View>
                    <Text style={styles.tournamentItemPrize}>
                      Won {formatCurrency(tournament.winnerPrize || 0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              {user.tournaments.filter((t: any) => t.isWinner).length === 0 && (
                <Text style={styles.noTournaments}>
                  No winning tournaments yet
                </Text>
              )}
            </View>
          )}

        {/* Withdraw Button */}
        <TouchableOpacity
          style={[
            styles.withdrawButton,
            loading && styles.withdrawButtonDisabled,
          ]}
          onPress={handleWithdraw}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#050b1f" />
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color="#050b1f" />
              <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Ionicons name="information-circle" size={16} color="#00ffff" />
          <Text style={styles.noteText}>
            Withdrawals are processed within 30 minutes. You'll receive an
            M-Pesa confirmation.
          </Text>
        </View>
      </View>

      {/* Withdrawal History */}
      {withdrawals && withdrawals.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Withdrawal History</Text>

          {withdrawals.map((withdrawal: any) => (
            <View key={withdrawal._id} style={styles.historyItem}>
              <View style={styles.historyItemLeft}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(withdrawal.status) + "20",
                    },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(withdrawal.status)}
                    size={14}
                    color={getStatusColor(withdrawal.status)}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(withdrawal.status) },
                    ]}
                  >
                    {withdrawal.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.historyAmount}>
                  {formatCurrency(withdrawal.amount)}
                </Text>
                <Text style={styles.historyDate}>
                  {formatDate(withdrawal.requestedAt)}
                </Text>
              </View>
              <View style={styles.historyItemRight}>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050b1f",
  },
  content: {
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050b1f",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0a1333",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00ffff",
  },
  placeholder: {
    width: 40,
  },
  balanceCard: {
    backgroundColor: "#0a1333",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00ffff",
  },
  balanceLabel: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#00ffff",
    marginBottom: 4,
  },
  balanceNote: {
    fontSize: 12,
    color: "#666",
  },
  formCard: {
    backgroundColor: "#0a1333",
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a2555",
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: "#fff",
    fontSize: 16,
  },
  tournamentSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a2555",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  tournamentSelectorText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    marginLeft: 10,
  },
  tournamentList: {
    backgroundColor: "#1a2555",
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  tournamentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
  },
  tournamentItemSelected: {
    backgroundColor: "#00ffff20",
    borderWidth: 1,
    borderColor: "#00ffff",
  },
  tournamentItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tournamentItemName: {
    color: "#fff",
    fontSize: 14,
  },
  tournamentItemPrize: {
    color: "#00ffff",
    fontSize: 12,
    fontWeight: "500",
  },
  noTournaments: {
    color: "#666",
    textAlign: "center",
    padding: 16,
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00ffff",
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  withdrawButtonDisabled: {
    opacity: 0.5,
  },
  withdrawButtonText: {
    color: "#050b1f",
    fontSize: 16,
    fontWeight: "600",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#1a2555",
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    flex: 1,
    color: "#aaa",
    fontSize: 12,
  },
  historyCard: {
    backgroundColor: "#0a1333",
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a2555",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyItemLeft: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 11,
    color: "#666",
  },
  historyItemRight: {
    marginLeft: 8,
  },
});
