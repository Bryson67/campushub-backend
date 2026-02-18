import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TournamentsPage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Get all tournaments using getAllTournaments
  const tournaments = useQuery(api.tournaments.getAllTournaments);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleTournamentPress = (tournamentId: string) => {
    // Navigate to payment page with the selected tournament
    router.push({ pathname: "/payments", params: { tournamentId } });
  };

  if (tournaments === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading tournaments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Tournaments</Text>
        <Text style={styles.subtitle}>Choose a tournament to join</Text>
      </View>

      {tournaments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No tournaments available</Text>
          <Text style={styles.emptyStateSubtext}>Check back later!</Text>
        </View>
      ) : (
        <FlatList
          data={tournaments}
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

              <View style={styles.cardDetails}>
                <Text style={styles.gameText}>🎮 {item.game}</Text>
                <Text style={styles.dateText}>
                  📅 {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.joinText}>Tap to join →</Text>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4f46e5"]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#4f46e5",
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
  },
  listContent: {
    padding: 15,
  },
  tournamentCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tournamentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  feeBadge: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  feeText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  cardDetails: {
    marginBottom: 10,
  },
  gameText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  joinText: {
    color: "#4f46e5",
    fontWeight: "600",
    textAlign: "right",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
  },
});
