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
  View
} from "react-native";

export default function WinnersPage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "all">("all");

  // Get winners
  const winners = useQuery(
    api.tournaments.getWinners,
    selectedGame ? { game: selectedGame } : {},
  );

  const topWinners = useQuery(api.tournaments.getTopWinners, { limit: 10 });

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

  const games = [
    "All Games",
    "PUBG",
    "Call of Duty",
    "Delta Force",
    "FIFA",
    "eFootball",
  ];

  const getGameIcon = (game: string) => {
    const gameLower = game.toLowerCase();
    if (gameLower.includes("pubg")) return "airplane";
    if (gameLower.includes("call of duty") || gameLower.includes("cod"))
      return "flash";
    if (gameLower.includes("delta")) return "shield";
    if (gameLower.includes("fifa") || gameLower.includes("football"))
      return "football";
    return "trophy";
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

  const filterWinnersByTime = (winnersList: any[]) => {
    if (timeFilter === "all") return winnersList;

    const now = Date.now();
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    const monthInMs = 30 * 24 * 60 * 60 * 1000;

    return winnersList.filter((w) => {
      const winnerDate = new Date(w.date).getTime();
      if (timeFilter === "week") {
        return now - winnerDate <= weekInMs;
      }
      if (timeFilter === "month") {
        return now - winnerDate <= monthInMs;
      }
      return true;
    });
  };

  const filteredWinners = winners ? filterWinnersByTime(winners) : [];

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

      {/* Hero Section - Top Winners */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>🏆 Champions League</Text>
        <Text style={styles.heroSubtitle}>
          Celebrating our tournament winners
        </Text>

        {topWinners && topWinners.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.topWinnersScroll}
          >
            {topWinners.slice(0, 3).map((winner, index) => (
              <View
                key={winner._id}
                style={[
                  styles.topWinnerCard,
                  {
                    backgroundColor: getGameColor(winner.game),
                    marginLeft: index === 0 ? 20 : 0,
                  },
                ]}
              >
                <View style={styles.topWinnerRank}>
                  <Text style={styles.topWinnerRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.topWinnerAvatar}>
                  <Text style={styles.topWinnerAvatarText}>
                    {winner.winnerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.topWinnerName} numberOfLines={1}>
                  {winner.winnerName}
                </Text>
                <Text style={styles.topWinnerPrize}>
                  {formatCurrency(winner.prize)}
                </Text>
                <View style={styles.topWinnerGame}>
                  <Ionicons
                    name={getGameIcon(winner.game)}
                    size={12}
                    color="white"
                  />
                  <Text style={styles.topWinnerGameText}>{winner.game}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.gamesScroll}
        >
          {games.map((game) => (
            <TouchableOpacity
              key={game}
              style={[
                styles.gameChip,
                (selectedGame === game ||
                  (game === "All Games" && !selectedGame)) &&
                  styles.selectedGameChip,
              ]}
              onPress={() =>
                setSelectedGame(game === "All Games" ? null : game)
              }
            >
              <Text
                style={[
                  styles.gameChipText,
                  (selectedGame === game ||
                    (game === "All Games" && !selectedGame)) &&
                    styles.selectedGameChipText,
                ]}
              >
                {game}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.timeFilters}>
          <TouchableOpacity
            style={[
              styles.timeChip,
              timeFilter === "week" && styles.selectedTimeChip,
            ]}
            onPress={() => setTimeFilter("week")}
          >
            <Text
              style={[
                styles.timeChipText,
                timeFilter === "week" && styles.selectedTimeChipText,
              ]}
            >
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeChip,
              timeFilter === "month" && styles.selectedTimeChip,
            ]}
            onPress={() => setTimeFilter("month")}
          >
            <Text
              style={[
                styles.timeChipText,
                timeFilter === "month" && styles.selectedTimeChipText,
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeChip,
              timeFilter === "all" && styles.selectedTimeChip,
            ]}
            onPress={() => setTimeFilter("all")}
          >
            <Text
              style={[
                styles.timeChipText,
                timeFilter === "all" && styles.selectedTimeChipText,
              ]}
            >
              All Time
            </Text>
          </TouchableOpacity>
        </View>
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
                {item.winnerName.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.winnerInfo}>
              <View style={styles.winnerHeader}>
                <Text style={styles.winnerName}>{item.winnerName}</Text>
                <View style={styles.winnerGameBadge}>
                  <Ionicons
                    name={getGameIcon(item.game)}
                    size={12}
                    color={getGameColor(item.game)}
                  />
                  <Text
                    style={[
                      styles.winnerGameText,
                      { color: getGameColor(item.game) },
                    ]}
                  >
                    {item.game}
                  </Text>
                </View>
              </View>

              <Text style={styles.tournamentName}>{item.tournamentName}</Text>

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
                    {item.matchesPlayed} matches
                  </Text>
                </View>

                {item.kills !== undefined && (
                  <View style={styles.statItem}>
                    <Ionicons name="skull" size={16} color="#f59e0b" />
                    <Text style={styles.statValue}>{item.kills} kills</Text>
                  </View>
                )}

                {item.deaths !== undefined && (
                  <View style={styles.statItem}>
                    <Ionicons name="heart-dislike" size={16} color="#ef4444" />
                    <Text style={styles.statValue}>{item.deaths} deaths</Text>
                  </View>
                )}

                {item.headshots !== undefined && item.headshots > 0 && (
                  <View style={styles.statItem}>
                    <Ionicons name="eye" size={16} color="#3b82f6" />
                    <Text style={styles.statValue}>{item.headshots} HS</Text>
                  </View>
                )}

                {item.averageScore !== undefined && (
                  <View style={styles.statItem}>
                    <Ionicons name="stats-chart" size={16} color="#8b5cf6" />
                    <Text style={styles.statValue}>
                      Avg: {item.averageScore}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.winnerBadge}>
              <Ionicons name="trophy" size={20} color="#f59e0b" />
            </View>
          </View>
        )}
        ListHeaderComponent={
          filteredWinners.length > 0 ? (
            <Text style={styles.sectionTitle}>
              {filteredWinners.length} Winner
              {filteredWinners.length !== 1 ? "s" : ""}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#d1d5db" />
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
            colors={["#6366f1"]}
            tintColor="#6366f1"
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
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#6366f1",
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
    color: "white",
  },
  heroSection: {
    backgroundColor: "white",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    paddingHorizontal: 20,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  topWinnersScroll: {
    flexDirection: "row",
  },
  topWinnerCard: {
    width: 160,
    height: 200,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topWinnerRank: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topWinnerRankText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  topWinnerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  topWinnerAvatarText: {
    fontSize: 28,
    fontWeight: "600",
    color: "white",
  },
  topWinnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 4,
  },
  topWinnerPrize: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },
  topWinnerGame: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  topWinnerGameText: {
    fontSize: 12,
    color: "white",
    opacity: 0.9,
  },
  filtersContainer: {
    backgroundColor: "white",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  gamesScroll: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  gameChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  selectedGameChip: {
    backgroundColor: "#6366f1",
  },
  gameChipText: {
    fontSize: 14,
    color: "#4b5563",
  },
  selectedGameChipText: {
    color: "white",
  },
  timeFilters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  timeChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  selectedTimeChip: {
    backgroundColor: "#6366f1",
  },
  timeChipText: {
    fontSize: 12,
    color: "#6b7280",
  },
  selectedTimeChipText: {
    color: "white",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    padding: 16,
  },
  winnerCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  winnerRank: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  winnerRankText: {
    fontSize: 10,
    color: "#6b7280",
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
    color: "#1f2937",
  },
  winnerGameBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  winnerGameText: {
    fontSize: 12,
    fontWeight: "500",
  },
  tournamentName: {
    fontSize: 13,
    color: "#6b7280",
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
    color: "#4b5563",
  },
  winnerBadge: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
