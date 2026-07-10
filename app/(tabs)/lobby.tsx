import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Lobby() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    const id = await AsyncStorage.getItem("userId");
    setUserId(id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserId();
    setRefreshing(false);
  };

  // Get user's tournaments (paid for)
  const userTournaments = useQuery(
    api.tournaments.getUserTournaments,
    userId ? { userId } : "skip",
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleTournamentPress = (tournamentId: string) => {
    // Navigate to the tournament lobby screen
    router.push({
      pathname: "/tournament-lobby",
      params: { tournamentId },
    });
  };

  if (!userId) {
    return (
      <View style={styles.center}>
        <Ionicons name="log-in-outline" size={64} color="#00ffff" />
        <Text style={styles.messageText}>
          Please log in to view your tournaments
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/SignIn")}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (userTournaments === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ffff" />
        <Text style={styles.loadingText}>Loading your tournaments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tournaments</Text>
        <Text style={styles.headerSubtitle}>
          You have joined {userTournaments.length} tournament(s)
        </Text>
      </View>

      {/* Tournaments List */}
      <FlatList
        data={userTournaments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tournamentCard}
            onPress={() => handleTournamentPress(item._id)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.tournamentName}>{item.name}</Text>
              <View style={styles.feeBadge}>
                <Text style={styles.feeText}>KES {item.fee}</Text>
              </View>
            </View>

            <Text style={styles.gameName}>🎮 {item.game}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.footerItem}>
                <Ionicons name="calendar" size={14} color="#aaa" />
                <Text style={styles.footerText}>{formatDate(item.date)}</Text>
              </View>
              <View style={styles.enterButton}>
                <Text style={styles.enterButtonText}>Enter Lobby</Text>
                <Ionicons name="arrow-forward" size={14} color="#050b1f" />
              </View>
            </View>

            {item.isWinner && (
              <View style={styles.winnerBadge}>
                <Ionicons name="trophy" size={14} color="#ffee00" />
                <Text style={styles.winnerText}>Winner!</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="game-controller-outline" size={64} color="#333" />
            <Text style={styles.emptyStateTitle}>No Tournaments Yet</Text>
            <Text style={styles.emptyStateText}>
              Join a tournament to see it here!
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push("/tournaments")}
            >
              <Text style={styles.browseButtonText}>Browse Tournaments</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00ffff"]}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050b1f",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050b1f",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#aaa",
  },
  messageText: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#00ffff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "#050b1f",
    fontWeight: "600",
    fontSize: 16,
  },
  header: {
    backgroundColor: "#0a1333",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#00ffff",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#00ffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#aaa",
  },
  listContent: {
    padding: 16,
  },
  tournamentCard: {
    backgroundColor: "#0a1333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#00ffff",
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  feeBadge: {
    backgroundColor: "#00ffff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  feeText: {
    color: "#050b1f",
    fontSize: 12,
    fontWeight: "600",
  },
  gameName: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: "#aaa",
  },
  enterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00ffff",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  enterButtonText: {
    color: "#050b1f",
    fontSize: 12,
    fontWeight: "600",
  },
  winnerBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,238,0,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  winnerText: {
    fontSize: 10,
    color: "#ffee00",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: "#00ffff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    color: "#050b1f",
    fontWeight: "600",
    fontSize: 16,
  },
});
