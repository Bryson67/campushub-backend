import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DisputeModal from "./DisputeModal";

interface ScoreConfirmationProps {
  visible: boolean;
  onClose: () => void;
  match: any;
  player1Name: string;
  player2Name: string;
  gameType?: string;
}

export default function ScoreConfirmation({
  visible,
  onClose,
  match,
  player1Name,
  player2Name,
  gameType = "default",
}: ScoreConfirmationProps) {
  const [player1Score, setPlayer1Score] = useState("");
  const [player2Score, setPlayer2Score] = useState("");
  const [player1Kills, setPlayer1Kills] = useState("");
  const [player2Kills, setPlayer2Kills] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [pendingDispute, setPendingDispute] = useState<any>(null);

  const proposeScore = useMutation(api.matches.proposeScore);
  const confirmScore = useMutation(api.matches.confirmScore);
  const proposeShooterStats = useMutation(api.matches.proposeShooterStats);
  const confirmShooterStats = useMutation(api.matches.confirmShooterStats);

  // Load userId from AsyncStorage when modal opens
  useEffect(() => {
    if (visible) {
      loadUserId();
    }
  }, [visible]);

  const loadUserId = async () => {
    try {
      const id = await AsyncStorage.getItem("userId");
      console.log("📱 ScoreConfirmation - Loaded userId:", id);
      setCurrentUserId(id);
    } catch (error) {
      console.error("Error loading userId:", error);
    }
  };

  const isShooterGame =
    gameType === "pubg" || gameType === "cod" || gameType === "deltaforce";

  // Check if current user is a player
  const isPlayer1 = currentUserId === match.player1Id;
  const isPlayer2 = currentUserId === match.player2Id;
  const isPlayer = isPlayer1 || isPlayer2;

  // Check if someone has proposed
  const hasProposal = match.proposedBy !== undefined;

  // Check if this user proposed
  const userProposed = match.proposedBy === currentUserId;

  // Check if this user needs to confirm (they are the other player)
  const needsToConfirm = hasProposal && !userProposed && isPlayer;

  // Debug logs
  console.log("🎮 ScoreConfirmation Debug:", {
    currentUserId,
    player1Id: match.player1Id,
    player2Id: match.player2Id,
    isPlayer1,
    isPlayer2,
    isPlayer,
    hasProposal,
    proposedBy: match.proposedBy,
    userProposed,
    needsToConfirm,
    matchStatus: match.status,
  });

  // Get game-specific colors
  const getGameColors = () => {
    switch (gameType) {
      case "pubg":
        return {
          primary: "#f59e0b",
          secondary: "#d97706",
          background: "#fffbeb",
        };
      case "cod":
        return {
          primary: "#dc2626",
          secondary: "#b91c1c",
          background: "#fee2e2",
        };
      case "deltaforce":
        return {
          primary: "#2563eb",
          secondary: "#1d4ed8",
          background: "#dbeafe",
        };
      case "efootball":
      case "fifa":
        return {
          primary: "#059669",
          secondary: "#047857",
          background: "#d1fae5",
        };
      default:
        return {
          primary: "#6366f1",
          secondary: "#4f46e5",
          background: "#ede9fe",
        };
    }
  };

  const colors = getGameColors();

  const handlePropose = async () => {
    if (!currentUserId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    // Validate inputs
    if (isShooterGame) {
      if (!player1Kills || !player2Kills) {
        Alert.alert("Error", "Please enter kill counts for both players");
        return;
      }
    } else {
      if (!player1Score || !player2Score) {
        Alert.alert("Error", "Please enter scores for both players");
        return;
      }
    }

    setLoading(true);

    try {
      if (isShooterGame) {
        await proposeShooterStats({
          matchId: match._id,
          player1Kills: parseInt(player1Kills),
          player2Kills: parseInt(player2Kills),
          player1Deaths: undefined,
          player2Deaths: undefined,
          player1Headshots: undefined,
          player2Headshots: undefined,
          proposedBy: currentUserId,
        });
        Alert.alert("Success", "Your stats have been submitted!");
      } else {
        await proposeScore({
          matchId: match._id,
          player1Score: parseInt(player1Score),
          player2Score: parseInt(player2Score),
          proposedBy: currentUserId,
        });
        Alert.alert("Success", "Your score has been submitted!");
      }
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!currentUserId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    // Validate inputs
    if (isShooterGame) {
      if (!player1Kills || !player2Kills) {
        Alert.alert("Error", "Please enter kill counts for both players");
        return;
      }
    } else {
      if (!player1Score || !player2Score) {
        Alert.alert("Error", "Please enter scores for both players");
        return;
      }
    }

    setLoading(true);

    try {
      let result;

      if (isShooterGame) {
        result = await confirmShooterStats({
          matchId: match._id,
          player1Kills: parseInt(player1Kills),
          player2Kills: parseInt(player2Kills),
          player1Deaths: undefined,
          player2Deaths: undefined,
          player1Headshots: undefined,
          player2Headshots: undefined,
          confirmedBy: currentUserId,
        });
      } else {
        result = await confirmScore({
          matchId: match._id,
          player1Score: parseInt(player1Score),
          player2Score: parseInt(player2Score),
          confirmedBy: currentUserId,
        });
      }

      // Handle dispute case
      if (result && result.disputed) {
        // Store the dispute data and open modal
        setPendingDispute({
          player1Score: parseInt(player1Score),
          player2Score: parseInt(player2Score),
        });
        setDisputeModalVisible(true);
      } else if (result && result.success) {
        Alert.alert("✅ Success", "Match completed!");
        onClose();
      } else {
        Alert.alert("⚠️ Error", "Unexpected response from server");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (match.status === "completed") return "✅ Match Completed";
    if (match.status === "disputed") return "⚠️ Match Under Review";

    if (!hasProposal) {
      return isPlayer ? "📝 Enter Your Results" : "👀 View Match";
    }

    if (userProposed) {
      return "⏳ Waiting for opponent to confirm";
    }

    if (needsToConfirm) {
      return "✓ Confirm or Enter Your Results";
    }

    return isPlayer ? "📝 Enter Your Results" : "👀 View Match";
  };

  if (match.status === "completed") {
    return null;
  }

  return (
    <>
      <Modal
        visible={visible && !disputeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View
              style={[styles.modalContent, { borderTopColor: colors.primary }]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View
                  style={[
                    styles.gameIcon,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Ionicons
                    name={isShooterGame ? "skull" : "football"}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.title}>
                  {isShooterGame ? "Match Results" : "Score Confirmation"}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text style={[styles.statusText, { color: colors.primary }]}>
                  {getStatusMessage()}
                </Text>
              </View>

              {/* Match Info */}
              <View style={styles.matchInfo}>
                <View style={styles.playerColumn}>
                  <View
                    style={[
                      styles.playerAvatar,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.playerAvatarText}>
                      {player1Name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.playerName}>{player1Name}</Text>
                  {match.proposedBy === match.player1Id && (
                    <View style={styles.proposedBadge}>
                      <Text style={styles.proposedBadgeText}>Proposed</Text>
                    </View>
                  )}
                </View>

                <View style={styles.vsContainer}>
                  <Text style={[styles.vsText, { color: colors.primary }]}>
                    VS
                  </Text>
                </View>

                <View style={styles.playerColumn}>
                  <View
                    style={[
                      styles.playerAvatar,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <Text style={styles.playerAvatarText}>
                      {player2Name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.playerName}>{player2Name}</Text>
                  {match.proposedBy === match.player2Id && (
                    <View style={styles.proposedBadge}>
                      <Text style={styles.proposedBadgeText}>Proposed</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Show Opponent's Proposal */}
              {hasProposal && needsToConfirm && (
                <View style={styles.proposalContainer}>
                  <Text style={styles.proposalTitle}>Opponent's Proposal:</Text>
                  {isShooterGame ? (
                    <Text style={styles.proposalText}>
                      {match.proposedPlayer1Kills} -{" "}
                      {match.proposedPlayer2Kills} Kills
                    </Text>
                  ) : (
                    <Text
                      style={[styles.proposalText, { color: colors.primary }]}
                    >
                      {match.proposedPlayer1Score} -{" "}
                      {match.proposedPlayer2Score}
                    </Text>
                  )}
                </View>
              )}

              {/* Input Fields - Always editable for the current player */}
              {isShooterGame ? (
                <View style={styles.shooterContainer}>
                  <Text style={styles.sectionTitle}>
                    Enter Your Kill Counts
                  </Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.playerLabel}>{player1Name}</Text>
                      <TextInput
                        style={styles.statInput}
                        keyboardType="numeric"
                        value={player1Kills}
                        onChangeText={setPlayer1Kills}
                        placeholder="Kills"
                        placeholderTextColor="#9ca3af"
                        editable={isPlayer && !userProposed}
                      />
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.playerLabel}>{player2Name}</Text>
                      <TextInput
                        style={styles.statInput}
                        keyboardType="numeric"
                        value={player2Kills}
                        onChangeText={setPlayer2Kills}
                        placeholder="Kills"
                        placeholderTextColor="#9ca3af"
                        editable={isPlayer && !userProposed}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.scoreContainer}>
                  <View style={styles.scoreInputWrapper}>
                    <Text style={styles.playerLabel}>{player1Name}</Text>
                    <TextInput
                      style={styles.scoreInput}
                      keyboardType="numeric"
                      value={player1Score}
                      onChangeText={setPlayer1Score}
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      maxLength={2}
                      editable={isPlayer && !userProposed}
                    />
                  </View>
                  <Text style={styles.scoreDash}>-</Text>
                  <View style={styles.scoreInputWrapper}>
                    <Text style={styles.playerLabel}>{player2Name}</Text>
                    <TextInput
                      style={styles.scoreInput}
                      keyboardType="numeric"
                      value={player2Score}
                      onChangeText={setPlayer2Score}
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      maxLength={2}
                      editable={isPlayer && !userProposed}
                    />
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              {isPlayer && !userProposed && !hasProposal && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handlePropose}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="send" size={20} color="white" />
                      <Text style={styles.actionButtonText}>
                        SUBMIT PROPOSAL
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {needsToConfirm && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="white"
                      />
                      <Text style={styles.actionButtonText}>
                        CONFIRM RESULTS
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Waiting Message */}
              {userProposed && (
                <View style={styles.waitingContainer}>
                  <Ionicons name="time" size={24} color="#f59e0b" />
                  <Text style={styles.waitingText}>
                    You've submitted your proposal. Waiting for opponent to
                    confirm...
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Dispute Modal */}
      {disputeModalVisible && pendingDispute && (
        <DisputeModal
          visible={disputeModalVisible}
          onClose={() => {
            setDisputeModalVisible(false);
            setPendingDispute(null);
            onClose();
          }}
          match={match}
          currentUserId={currentUserId!}
          player1Name={player1Name}
          player2Name={player2Name}
          proposedPlayer1Score={pendingDispute.player1Score}
          proposedPlayer2Score={pendingDispute.player2Score}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignSelf: "center",
    borderTopWidth: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  gameIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  statusBadge: {
    padding: 8,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  matchInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  playerColumn: {
    alignItems: "center",
    flex: 1,
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  playerAvatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: "white",
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    textAlign: "center",
  },
  proposedBadge: {
    marginTop: 4,
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  proposedBadgeText: {
    fontSize: 10,
    color: "#6366f1",
    fontWeight: "500",
  },
  vsContainer: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 16,
    fontWeight: "700",
  },
  proposalContainer: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  proposalTitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  proposalText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  shooterContainer: {
    width: "100%",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  playerLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  statInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    width: "100%",
    textAlign: "center",
    fontSize: 16,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  scoreInputWrapper: {
    width: 100,
    alignItems: "center",
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    backgroundColor: "#f9fafb",
    width: "100%",
  },
  scoreDash: {
    marginHorizontal: 16,
    fontSize: 24,
    color: "#9ca3af",
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  waitingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  waitingText: {
    fontSize: 14,
    color: "#92400e",
    flex: 1,
  },
});
