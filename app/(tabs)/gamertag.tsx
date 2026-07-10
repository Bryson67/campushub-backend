import { AdBanner } from "@/components/AdBanner";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function GamerTag() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [refreshKey, setRefreshKey] = useState(0);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const updateProfilePhoto = useMutation(api.users.updateProfilePhoto);
  const toggleGame = useMutation(api.users.toggleGame);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log("📱 Loading user data from AsyncStorage...");
      const storedUserId = await AsyncStorage.getItem("userId");
      console.log("📱 Retrieved userId:", storedUserId);
      const allKeys = await AsyncStorage.getAllKeys();
      console.log("📱 All AsyncStorage keys:", allKeys);
      setUserId(storedUserId);
    } catch (error) {
      console.error("❌ Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { userId } : "skip",
  );

  const user = userProfile;

  // Loading states with more detail
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ffff" />
        <Text style={styles.debugText}>Loading storage...</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No user ID found</Text>
        <Text style={styles.debugText}>Please log in again</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/SignIn")}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (userProfile === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ffff" />
        <Text style={styles.debugText}>Loading profile from Convex...</Text>
        <Text style={styles.debugText}>User ID: {userId}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>User not found in database</Text>
        <Text style={styles.debugText}>User ID: {userId}</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/SignIn")}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to change your profile photo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: false,
      });

      if (result.canceled) {
        console.log("📸 Image picking cancelled");
        return;
      }

      console.log("📸 Image selected:", result.assets[0].uri);
      setLoading(true);

      const uploadUrl = await generateUploadUrl();
      console.log("2️⃣ Upload URL from Convex:", uploadUrl);

      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      console.log(
        "3️⃣ Image blob created, size:",
        blob.size,
        "type:",
        blob.type,
      );

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": blob.type || "image/jpeg",
        },
        body: blob,
      });
      console.log("4️⃣ Upload response status:", uploadResponse.status);

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await uploadResponse.json();
      console.log("📸 Storage ID received:", storageId);

      await updateProfilePhoto({
        userId,
        storageId,
      });

      console.log("📸 Profile photo updated in database");
      Alert.alert("Success", "Profile photo updated!");
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("❌ Error uploading image:", err);
      Alert.alert("Error", "Failed to update profile photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = user?.profileImage
    ? `${process.env.EXPO_PUBLIC_CONVEX_URL}/storage/${user.profileImage}`
    : "https://www.shutterstock.com/image-vector/gamer-esports-logo-template-gaming-260nw-2503787045.jpg";

  const GAMES = [
    "Call of Duty",
    "PUBG",
    "EA FC 24",
    "Valorant",
    "Fortnite",
    "Fifa",
    "Football Manager",
    "DreamLeague",
    "Efootball",
    "DeltaForce",
  ];

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getTournamentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "in_progress":
        return "#f59e0b";
      case "pending":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#050b1f" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00ffff"]}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gamer Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            onPress={pickImage}
            style={styles.avatarContainer}
            disabled={loading}
          >
            <Image
              source={{ uri: imageUrl }}
              style={[styles.avatar, loading && styles.avatarLoading]}
            />
            <View
              style={[styles.editBadge, loading && styles.editBadgeDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.gamerTag}>{user.gamerTag}</Text>
          <Text style={styles.email}>{user.email}</Text>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceItem}>
              <Ionicons name="wallet-outline" size={24} color="#00ffff" />
              <View>
                <Text style={styles.balanceLabel}>Account Balance</Text>
                <Text style={styles.balanceAmount}>
                  {formatCurrency(user.balance || 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color="#ffee00" />
              <Text style={styles.statValue}>{user.stats?.wins || 0}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="game-controller" size={24} color="#00ffff" />
              <Text style={styles.statValue}>
                {user.stats?.totalMatches || 0}
              </Text>
              <Text style={styles.statLabel}>Played</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color="#10b981" />
              <Text style={styles.statValue}>{user.stats?.winRate || 0}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "profile" && styles.activeTab]}
              onPress={() => setActiveTab("profile")}
            >
              <Ionicons
                name="person"
                size={20}
                color={activeTab === "profile" ? "#00ffff" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "profile" && styles.activeTabText,
                ]}
              >
                Profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "tournaments" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("tournaments")}
            >
              <Ionicons
                name="trophy"
                size={20}
                color={activeTab === "tournaments" ? "#00ffff" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "tournaments" && styles.activeTabText,
                ]}
              >
                Tournaments
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "stats" && styles.activeTab]}
              onPress={() => setActiveTab("stats")}
            >
              <Ionicons
                name="stats-chart"
                size={20}
                color={activeTab === "stats" ? "#00ffff" : "#666"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "stats" && styles.activeTabText,
                ]}
              >
                Stats
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content based on active tab */}
        {activeTab === "profile" && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>🎮 Select Your Games</Text>
            <View style={styles.gamesGrid}>
              {GAMES.map((game) => {
                const selected = user.selectedGames?.includes(game) ?? false;
                return (
                  <TouchableOpacity
                    key={game}
                    style={[
                      styles.gameChip,
                      selected && styles.gameChipSelected,
                    ]}
                    onPress={async () => {
                      await toggleGame({
                        userId,
                        game,
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.gameChipText,
                        selected && styles.gameChipTextSelected,
                      ]}
                    >
                      {game}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>✨ Your Games</Text>
            <View style={styles.selectedGamesContainer}>
              {user.selectedGames && user.selectedGames.length > 0 ? (
                user.selectedGames.map((game) => (
                  <View key={game} style={styles.selectedGameChip}>
                    <Ionicons
                      name="game-controller"
                      size={16}
                      color="#ffee00"
                    />
                    <Text style={styles.selectedGameText}>{game}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noGame}>No games selected yet</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === "tournaments" && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>🏆 Tournament History</Text>
            {user.tournaments && user.tournaments.length > 0 ? (
              user.tournaments.map((tournament, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tournamentCard}
                  onPress={() =>
                    router.push(`/lobby?tournamentId=${tournament._id}`)
                  }
                >
                  <View style={styles.tournamentHeader}>
                    <Text style={styles.tournamentName}>{tournament.name}</Text>
                    <View
                      style={[
                        styles.tournamentStatus,
                        {
                          backgroundColor:
                            getTournamentStatusColor(tournament.status) + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tournamentStatusText,
                          {
                            color: getTournamentStatusColor(tournament.status),
                          },
                        ]}
                      >
                        {tournament.status?.toUpperCase() || "PENDING"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.tournamentGame}>
                    🎮 {tournament.game}
                  </Text>

                  <View style={styles.tournamentStats}>
                    <View style={styles.tournamentStat}>
                      <Ionicons name="calendar" size={14} color="#666" />
                      <Text style={styles.tournamentStatText}>
                        {new Date(tournament.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.tournamentStat}>
                      <Ionicons name="cash" size={14} color="#666" />
                      <Text style={styles.tournamentStatText}>
                        Fee: {formatCurrency(tournament.fee)}
                      </Text>
                    </View>
                  </View>

                  {tournament.isWinner && (
                    <View style={styles.winnerBadge}>
                      <Ionicons name="trophy" size={16} color="#ffee00" />
                      <Text style={styles.winnerBadgeText}>Winner!</Text>
                    </View>
                  )}

                  {tournament.winnerPrize && tournament.isWinner && (
                    <View style={styles.prizeBadge}>
                      <Text style={styles.prizeText}>
                        Won {formatCurrency(tournament.winnerPrize)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color="#333" />
                <Text style={styles.emptyStateText}>No tournaments yet</Text>
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => router.push("/tournaments")}
                >
                  <Text style={styles.joinButtonText}>Join a Tournament</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === "stats" && (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>📊 Detailed Statistics</Text>

            <View style={styles.detailedStats}>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Total Matches</Text>
                <Text style={styles.statRowValue}>
                  {user.stats?.totalMatches || 0}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Wins</Text>
                <Text style={styles.statRowValue}>{user.stats?.wins || 0}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Losses</Text>
                <Text style={styles.statRowValue}>
                  {user.stats?.losses || 0}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Win Rate</Text>
                <Text style={styles.statRowValue}>
                  {user.stats?.winRate || 0}%
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Total Earnings</Text>
                <Text style={styles.statRowValue}>
                  {formatCurrency(user.totalEarnings || 0)}
                </Text>
              </View>
            </View>

            <View style={styles.chartPlaceholder}>
              <Ionicons name="stats-chart" size={32} color="#333" />
              <Text style={styles.chartPlaceholderText}>
                Performance chart coming soon
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* AD BANNER - FIXED AT BOTTOM */}
      <View style={styles.adFixedContainer}>
        <AdBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050b1f",
  },
  adFixedContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "#0a1333",
    borderTopWidth: 2,
    borderTopColor: "#00ffff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 10,
  },
  avatarLoading: {
    opacity: 0.5,
  },
  editBadgeDisabled: {
    backgroundColor: "#666",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050b1f",
    padding: 20,
  },
  error: {
    color: "#ff4444",
    fontSize: 18,
    marginBottom: 8,
  },
  debugText: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
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
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#00ffff",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#00ffff",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#050b1f",
  },
  gamerTag: {
    fontSize: 28,
    fontFamily: "Orbitron_700Bold",
    color: "#ffee00",
    letterSpacing: 1,
    marginBottom: 4,
    textShadowColor: "#00ffff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  email: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: "#0a1333",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 16,
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  balanceLabel: {
    fontSize: 12,
    color: "#aaa",
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00ffff",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#0a1333",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#aaa",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#0a1333",
    borderRadius: 25,
    padding: 4,
    width: "100%",
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
    backgroundColor: "#1a2555",
  },
  tabText: {
    fontSize: 13,
    color: "#666",
  },
  activeTabText: {
    color: "#00ffff",
  },
  contentSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  gamesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  gameChip: {
    backgroundColor: "#0a1333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  gameChipSelected: {
    backgroundColor: "#00ffff",
    borderColor: "#00ffff",
  },
  gameChipText: {
    color: "#fff",
    fontSize: 14,
  },
  gameChipTextSelected: {
    color: "#050b1f",
    fontWeight: "600",
  },
  selectedGamesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedGameChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a1333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffee00",
    gap: 6,
  },
  selectedGameText: {
    color: "#ffee00",
    fontSize: 14,
  },
  noGame: {
    color: "#666",
    fontSize: 14,
  },
  tournamentCard: {
    backgroundColor: "#0a1333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  tournamentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tournamentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  tournamentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tournamentStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  tournamentGame: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 8,
  },
  tournamentStats: {
    flexDirection: "row",
    gap: 16,
  },
  tournamentStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tournamentStatText: {
    fontSize: 12,
    color: "#666",
  },
  winnerBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  winnerBadgeText: {
    color: "#ffee00",
    fontSize: 12,
    fontWeight: "600",
  },
  prizeBadge: {
    marginTop: 8,
    backgroundColor: "#10b98120",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  prizeText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  joinButton: {
    backgroundColor: "#00ffff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 16,
  },
  joinButtonText: {
    color: "#050b1f",
    fontWeight: "600",
  },
  detailedStats: {
    backgroundColor: "#0a1333",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1a2555",
  },
  statRowLabel: {
    color: "#aaa",
    fontSize: 14,
  },
  statRowValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  chartPlaceholder: {
    backgroundColor: "#0a1333",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  chartPlaceholderText: {
    color: "#666",
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: "#00ffff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  loginButtonText: {
    color: "#050b1f",
    fontWeight: "600",
  },
});
