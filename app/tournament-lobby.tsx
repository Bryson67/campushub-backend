import ScoreConfirmation from "@/components/ScoreConfirmation";
import TournamentBracket from "@/components/TournamentBracket";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Lobby() {
  const router = useRouter();
  const { tournamentId } = useLocalSearchParams<{ tournamentId: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("players");
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);

  // Mock user ID - replace with actual auth
  const currentUserId = "user123";

  // Get tournament details
  const tournament = useQuery(
    api.tournaments.getTournamentById,
    tournamentId ? { tournamentId } : "skip",
  );

  // Get players
  const players = useQuery(
    api.players.getByTournamentId,
    tournamentId ? { tournamentId } : "skip",
  );

  // Get bracket matches
  const bracket = useQuery(
    api.tournaments.getTournamentBracket,
    tournamentId ? { tournamentId } : "skip",
  );

  // Mutations
  const generateBracket = useMutation(api.tournaments.generateBracket);

  // Determine game type for styling
  // Determine game type for styling
  const getGameType = () => {
    if (!tournament?.game) return "default";
    const game = tournament.game.toLowerCase();
    if (game.includes("pubg")) return "pubg";
    if (game.includes("call of duty") || game.includes("cod")) return "cod";
    if (game.includes("delta")) return "deltaforce";
    if (game.includes("fifa") || game.includes("efootball")) return "efootball";
    return "default";
  };

  const gameType = getGameType();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleGenerateBracket = async () => {
    try {
      await generateBracket({ tournamentId: tournamentId as string });
      Alert.alert("Success", "Tournament bracket generated!");
    } catch (error) {
      Alert.alert("Error", "Failed to generate bracket");
    }
  };

  const handleMatchPress = (match: any) => {
    setSelectedMatch(match);

    // Handle different match statuses
    if (match.status === "completed") {
      Alert.alert("Match Completed", "This match has already been finalized");
      return;
    }

    if (match.status === "disputed") {
      Alert.alert("Under Review", "This match is being reviewed by an admin");
      return;
    }

    // Show confirmation modal for all other matches
    setConfirmationModalVisible(true);
  };

  const handleBack = () => {
    router.back();
  };

  // Loading state
  if (!tournamentId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>No tournament selected</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (tournament === undefined || players === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading lobby...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (tournament === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="trophy-outline" size={48} color="#f59e0b" />
          <Text style={styles.errorText}>Tournament not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get game-specific colors for header
  const getHeaderColors = () => {
    switch (gameType) {
      case "pubg":
        return { bg: "#f59e0b", text: "#92400e" };
      case "cod":
        return { bg: "#dc2626", text: "#991b1b" };
      case "deltaforce":
        return { bg: "#2563eb", text: "#1e3a8a" };
      case "efootball":
        return { bg: "#059669", text: "#064e3b" };
      default:
        return { bg: "#6366f1", text: "#3730a3" };
    }
  };

  const headerColors = getHeaderColors();
  const totalPrizePool = (players?.length || 0) * tournament.fee;
  const spotsLeft = Math.max(0, 16 - (players?.length || 0));

  // Convert bracket object to array if it exists
  const bracketArray = bracket ? Object.values(bracket).flat() : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerColors.bg }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tournament Lobby</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Tournament Info Card */}
      <View style={styles.tournamentCard}>
        <View style={styles.tournamentHeader}>
          <Text style={styles.tournamentName}>{tournament.name}</Text>
          <View
            style={[
              styles.gameBadge,
              { backgroundColor: headerColors.bg + "20" },
            ]}
          >
            <Text style={[styles.gameBadgeText, { color: headerColors.bg }]}>
              {tournament.game}
            </Text>
          </View>
        </View>

        <View style={styles.tournamentDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {new Date(tournament.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="trophy-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Knockout Stage</Text>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { borderTopColor: headerColors.bg }]}>
          <Text style={styles.statValue}>{players?.length || 0}</Text>
          <Text style={styles.statLabel}>Players</Text>
        </View>

        <View style={[styles.statCard, { borderTopColor: "#f59e0b" }]}>
          <Text style={styles.statValue}>
            KES {totalPrizePool.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Prize Pool</Text>
        </View>

        <View style={[styles.statCard, { borderTopColor: "#10b981" }]}>
          <Text style={styles.statValue}>{spotsLeft}</Text>
          <Text style={styles.statLabel}>Spots Left</Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "players" && [
              styles.activeTab,
              { borderColor: headerColors.bg },
            ],
          ]}
          onPress={() => setActiveTab("players")}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === "players" ? headerColors.bg : "#9ca3af"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "players" && { color: headerColors.bg },
            ]}
          >
            Players
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "bracket" && [
              styles.activeTab,
              { borderColor: headerColors.bg },
            ],
          ]}
          onPress={() => setActiveTab("bracket")}
        >
          <Ionicons
            name="grid"
            size={20}
            color={activeTab === "bracket" ? headerColors.bg : "#9ca3af"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "bracket" && { color: headerColors.bg },
            ]}
          >
            Bracket
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === "players" ? (
        <FlatList
          data={players}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <View style={styles.playerItem}>
              <View
                style={[
                  styles.playerRank,
                  { backgroundColor: headerColors.bg + "20" },
                ]}
              >
                <Text
                  style={[styles.playerRankText, { color: headerColors.bg }]}
                >
                  {index + 1}
                </Text>
              </View>
              <View
                style={[
                  styles.playerAvatar,
                  { backgroundColor: headerColors.bg },
                ]}
              >
                <Text style={styles.playerAvatarText}>
                  {item.name?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.name}</Text>
                <Text style={styles.playerTime}>
                  Joined {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
              </View>
              {item.mpesaReceipt && (
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No players yet</Text>
              <Text style={styles.emptyStateText}>Be the first to join!</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[headerColors.bg]}
              tintColor={headerColors.bg}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.bracketContainer}>
          {players?.length >= 2 && (!bracket || bracketArray.length === 0) && (
            <View style={styles.generateBracketContainer}>
              <Text style={styles.generateBracketText}>
                Ready to start the tournament?
              </Text>
              <TouchableOpacity
                style={[
                  styles.generateBracketButton,
                  { backgroundColor: headerColors.bg },
                ]}
                onPress={handleGenerateBracket}
              >
                <Ionicons name="trophy" size={20} color="white" />
                <Text style={styles.generateBracketButtonText}>
                  Generate Knockout Bracket
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {bracket && bracketArray.length > 0 && (
            <TournamentBracket
              matches={bracketArray}
              players={players || []}
              gameType={gameType}
              onMatchPress={handleMatchPress}
              currentUserId={currentUserId}
            />
          )}

          {players?.length < 2 && (
            <View style={styles.emptyState}>
              <Ionicons name="warning-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>Need more players</Text>
              <Text style={styles.emptyStateText}>
                At least 2 players needed to start
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Score Confirmation Modal */}
      {confirmationModalVisible && selectedMatch && (
        <ScoreConfirmation
          visible={confirmationModalVisible}
          onClose={() => setConfirmationModalVisible(false)}
          match={selectedMatch}
          currentUserId={currentUserId}
          player1Name={
            players?.find((p: any) => p.userId === selectedMatch?.player1Id)
              ?.name || "Player 1"
          }
          player2Name={
            players?.find((p: any) => p.userId === selectedMatch?.player2Id)
              ?.name || "Player 2"
          }
          gameType={gameType}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: "#1f2937",
    fontWeight: "600",
    textAlign: "center",
  },
  header: {
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
  tournamentCard: {
    backgroundColor: "white",
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tournamentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tournamentName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
  },
  gameBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  gameBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tournamentDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderTopWidth: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 25,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
    borderRadius: 21,
  },
  activeTab: {
    borderWidth: 2,
    backgroundColor: "#f9fafb",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9ca3af",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  playerItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  playerRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  playerRankText: {
    fontSize: 14,
    fontWeight: "600",
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  playerAvatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 2,
  },
  playerTime: {
    fontSize: 11,
    color: "#9ca3af",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#6366f1",
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  bracketContainer: {
    flex: 1,
  },
  generateBracketContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  generateBracketText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 16,
    textAlign: "center",
  },
  generateBracketButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
  },
  generateBracketButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
