import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WinnersPage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(
    null,
  );

  // Get ALL winners
  const allWinners = useQuery(api.tournaments.getAllWinners);

  // Get unique tournament names from winners
  const getUniqueTournaments = () => {
    if (!allWinners) return [];
    const tournaments = allWinners.map((w) => w.tournamentName);
    return ["All Tournaments", ...new Set(tournaments)];
  };

  const tournaments = getUniqueTournaments();

  // Filter winners by selected tournament
  const filteredWinners =
    selectedTournament && selectedTournament !== "All Tournaments"
      ? allWinners?.filter((w) => w.tournamentName === selectedTournament)
      : allWinners;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleBack = () => {
    router.back();
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getGameColor = (game: string) => {
    const gameLower = game.toLowerCase();
    if (gameLower.includes("pubg")) return "#f59e0b";
    if (gameLower.includes("call of duty") || gameLower.includes("cod"))
      return "#dc2626";
    if (gameLower.includes("delta")) return "#2563eb";
    if (gameLower.includes("fifa") || gameLower.includes("football"))
      return "#059669";
    return "#6366f1";
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return "#FFD700"; // Gold
      case 2:
        return "#C0C0C0"; // Silver
      case 3:
        return "#CD7F32"; // Bronze
      default:
        return "#6366f1";
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return "trophy";
      case 2:
        return "medal";
      case 3:
        return "ribbon";
      default:
        return "person";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tournament Winners</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Tournament Filter */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tournamentsScroll}
        >
          {tournaments.map((tournament) => (
            <TouchableOpacity
              key={tournament}
              style={[
                styles.tournamentChip,
                (selectedTournament === tournament ||
                  (tournament === "All Tournaments" && !selectedTournament)) &&
                  styles.selectedTournamentChip,
              ]}
              onPress={() =>
                setSelectedTournament(
                  tournament === "All Tournaments" ? null : tournament,
                )
              }
            >
              <Text
                style={[
                  styles.tournamentChipText,
                  (selectedTournament === tournament ||
                    (tournament === "All Tournaments" &&
                      !selectedTournament)) &&
                    styles.selectedTournamentChipText,
                ]}
                numberOfLines={1}
              >
                {tournament === "All Tournaments"
                  ? "🏆 All Tournaments"
                  : `🏆 ${tournament}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Winners List */}
      <FlatList
        data={filteredWinners}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <View style={styles.winnerCard}>
            <View style={styles.winnerRank}>
              <Text style={styles.winnerRankText}>#{index + 1}</Text>
            </View>

            <View
              style={[
                styles.winnerAvatar,
                { backgroundColor: getGameColor(item.game) },
              ]}
            >
              <Text style={styles.winnerAvatarText}>
                {item.winnerName?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>

            <View style={styles.winnerInfo}>
              <View style={styles.winnerHeader}>
                <Text style={styles.winnerName}>{item.winnerName}</Text>
                <View
                  style={[
                    styles.positionBadge,
                    { backgroundColor: getPositionColor(item.position) },
                  ]}
                >
                  <Ionicons
                    name={getPositionIcon(item.position)}
                    size={12}
                    color="#fff"
                  />
                  <Text style={styles.positionText}>
                    {item.position === 1
                      ? "1st"
                      : item.position === 2
                        ? "2nd"
                        : "3rd"}
                  </Text>
                </View>
              </View>

              <Text style={styles.tournamentName}>{item.tournamentName}</Text>
              <Text style={styles.gameName}>🎮 {item.game}</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Ionicons name="cash" size={16} color="#10b981" />
                  <Text style={styles.statValue}>
                    {formatCurrency(item.prize)}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="calendar" size={16} color="#6b7280" />
                  <Text style={styles.statValue}>{formatDate(item.date)}</Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="game-controller" size={16} color="#6366f1" />
                  <Text style={styles.statValue}>
                    {item.matchesPlayed || 0} matches
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#333" />
            <Text style={styles.emptyStateTitle}>No winners yet</Text>
            <Text style={styles.emptyStateText}>
              Complete tournaments to see winners here
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00ffff"]}
            tintColor="#00ffff"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050b1f",
  },
  header: {
    backgroundColor: "#00ffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#050b1f",
  },
  filtersContainer: {
    backgroundColor: "#0a1333",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#00ffff",
  },
  tournamentsScroll: {
    paddingHorizontal: 16,
  },
  tournamentChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1a2555",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#333",
    maxWidth: 200,
  },
  selectedTournamentChip: {
    backgroundColor: "#00ffff",
    borderColor: "#00ffff",
  },
  tournamentChipText: {
    fontSize: 14,
    color: "#fff",
  },
  selectedTournamentChipText: {
    color: "#050b1f",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
  },
  winnerCard: {
    flexDirection: "row",
    backgroundColor: "#0a1333",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#00ffff",
    position: "relative",
  },
  winnerRank: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#1a2555",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  winnerRankText: {
    fontSize: 10,
    color: "#00ffff",
    fontWeight: "600",
  },
  winnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 20,
  },
  winnerAvatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  winnerInfo: {
    flex: 1,
    marginLeft: 4,
  },
  winnerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  positionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  positionText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  tournamentName: {
    fontSize: 13,
    color: "#00ffff",
    marginBottom: 2,
    fontWeight: "500",
  },
  gameName: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
  },
});
