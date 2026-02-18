import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useState } from "react";
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

interface ScoreConfirmationProps {
  visible: boolean;
  onClose: () => void;
  match: any;
  currentUserId: string;
  player1Name: string;
  player2Name: string;
  gameType?: string;
}

export default function ScoreConfirmation({
  visible,
  onClose,
  match,
  currentUserId,
  player1Name,
  player2Name,
  gameType = "default",
}: ScoreConfirmationProps) {
  const [player1Score, setPlayer1Score] = useState("");
  const [player2Score, setPlayer2Score] = useState("");
  const [player1Kills, setPlayer1Kills] = useState("");
  const [player2Kills, setPlayer2Kills] = useState("");
  const [player1Deaths, setPlayer1Deaths] = useState("");
  const [player2Deaths, setPlayer2Deaths] = useState("");
  const [player1Headshots, setPlayer1Headshots] = useState("");
  const [player2Headshots, setPlayer2Headshots] = useState("");
  const [loading, setLoading] = useState(false);

  const proposeScore = useMutation(api.matches.proposeScore);
  const confirmScore = useMutation(api.matches.confirmScore);
  const proposeShooterStats = useMutation(api.matches.proposeShooterStats);
  const confirmShooterStats = useMutation(api.matches.confirmShooterStats);

  const isShooterGame =
    gameType === "pubg" || gameType === "cod" || gameType === "deltaforce";
  const isPlayer1 = match.player1Id === currentUserId;
  const isPlayer2 = match.player2Id === currentUserId;

  // Check if this player has already proposed stats
  const hasProposed = match.proposedBy === currentUserId;

  // Check if we're waiting for this player's confirmation
  const waitingForMe =
    (match.proposedBy === match.player1Id && isPlayer2) ||
    (match.proposedBy === match.player2Id && isPlayer1);

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

  const handleSubmitShooter = async () => {
    if (!player1Kills || !player2Kills) {
      Alert.alert("Error", "Please enter kill counts for both players");
      return;
    }

    setLoading(true);

    try {
      if (!match.proposedPlayer1Kills) {
        // No stats proposed yet - propose stats
        const result = await proposeShooterStats({
          matchId: match._id,
          player1Kills: parseInt(player1Kills),
          player2Kills: parseInt(player2Kills),
          player1Deaths: player1Deaths ? parseInt(player1Deaths) : undefined,
          player2Deaths: player2Deaths ? parseInt(player2Deaths) : undefined,
          player1Headshots: player1Headshots
            ? parseInt(player1Headshots)
            : undefined,
          player2Headshots: player2Headshots
            ? parseInt(player2Headshots)
            : undefined,
          proposedBy: currentUserId,
        });

        Alert.alert("Success", result.message);
        onClose();
      } else if (waitingForMe) {
        // Stats proposed, we need to confirm
        const result = await confirmShooterStats({
          matchId: match._id,
          player1Kills: parseInt(player1Kills),
          player2Kills: parseInt(player2Kills),
          player1Deaths: player1Deaths ? parseInt(player1Deaths) : undefined,
          player2Deaths: player2Deaths ? parseInt(player2Deaths) : undefined,
          player1Headshots: player1Headshots
            ? parseInt(player1Headshots)
            : undefined,
          player2Headshots: player2Headshots
            ? parseInt(player2Headshots)
            : undefined,
          confirmedBy: currentUserId,
        });

        if (result.disputed) {
          Alert.alert(
            "⚠️ Dispute Created",
            "The stats did not match. An admin will review the match.",
          );
        } else {
          Alert.alert("✅ Success", result.message);
        }
        onClose();
      }

      // Reset form
      setPlayer1Kills("");
      setPlayer2Kills("");
      setPlayer1Deaths("");
      setPlayer2Deaths("");
      setPlayer1Headshots("");
      setPlayer2Headshots("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFootball = async () => {
    if (!player1Score || !player2Score) {
      Alert.alert("Error", "Please enter both scores");
      return;
    }

    const score1 = parseInt(player1Score);
    const score2 = parseInt(player2Score);

    setLoading(true);

    try {
      if (!match.proposedPlayer1Score) {
        // No score proposed yet - propose score
        const result = await proposeScore({
          matchId: match._id,
          player1Score: score1,
          player2Score: score2,
          proposedBy: currentUserId,
        });

        Alert.alert("Success", result.message);
        onClose();
      } else if (waitingForMe) {
        // Score proposed, we need to confirm
        const result = await confirmScore({
          matchId: match._id,
          player1Score: score1,
          player2Score: score2,
          confirmedBy: currentUserId,
        });

        if (result.disputed) {
          Alert.alert(
            "⚠️ Dispute Created",
            "The scores did not match. An admin will review the match.",
          );
        } else {
          Alert.alert("✅ Success", result.message);
        }
        onClose();
      }

      setPlayer1Score("");
      setPlayer2Score("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (match.status === "completed") {
      return "✅ Match Completed";
    }
    if (match.status === "disputed") {
      return "⚠️ Match Under Review";
    }
    if (isShooterGame) {
      if (!match.proposedPlayer1Kills) {
        return "📝 Propose Kill Counts";
      }
      if (waitingForMe) {
        return "✓ Confirm Opponent's Stats";
      }
      if (hasProposed) {
        return "⏳ Waiting for opponent confirmation";
      }
    } else {
      if (!match.proposedPlayer1Score) {
        return "📝 Propose Final Score";
      }
      if (waitingForMe) {
        return "✓ Confirm Opponent's Score";
      }
      if (hasProposed) {
        return "⏳ Waiting for opponent confirmation";
      }
    }
    return "⏳ Waiting...";
  };

  // Don't show if match is completed
  if (match.status === "completed") {
    return null;
  }

  return (
    <Modal
      visible={visible}
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

            {/* Shooter Game Input */}
            {isShooterGame ? (
              <View style={styles.shooterContainer}>
                {/* Proposed Stats Display */}
                {match.proposedPlayer1Kills && waitingForMe && (
                  <View style={styles.proposedStatsContainer}>
                    <Text style={styles.proposedStatsTitle}>
                      Opponent Proposed:
                    </Text>
                    <View style={styles.proposedStatsRow}>
                      <View style={styles.proposedStat}>
                        <Ionicons
                          name="skull"
                          size={14}
                          color={colors.primary}
                        />
                        <Text style={styles.proposedStatText}>
                          {match.proposedPlayer1Kills} -{" "}
                          {match.proposedPlayer2Kills} Kills
                        </Text>
                      </View>
                      {(match.proposedPlayer1Deaths ||
                        match.proposedPlayer2Deaths) && (
                        <View style={styles.proposedStat}>
                          <Ionicons
                            name="heart-dislike"
                            size={14}
                            color="#ef4444"
                          />
                          <Text style={styles.proposedStatText}>
                            {match.proposedPlayer1Deaths || 0} -{" "}
                            {match.proposedPlayer2Deaths || 0} Deaths
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <Text style={styles.sectionTitle}>Player 1 Stats</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="skull" size={20} color={colors.primary} />
                    <TextInput
                      style={styles.statInput}
                      keyboardType="numeric"
                      value={player1Kills}
                      onChangeText={setPlayer1Kills}
                      placeholder={
                        match.proposedPlayer1Kills?.toString() || "Kills"
                      }
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="heart-dislike" size={20} color="#ef4444" />
                    <TextInput
                      style={styles.statInput}
                      keyboardType="numeric"
                      value={player1Deaths}
                      onChangeText={setPlayer1Deaths}
                      placeholder={
                        match.proposedPlayer1Deaths?.toString() || "Deaths"
                      }
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="eye" size={20} color="#10b981" />
                    <TextInput
                      style={styles.statInput}
                      keyboardType="numeric"
                      value={player1Headshots}
                      onChangeText={setPlayer1Headshots}
                      placeholder={
                        match.proposedPlayer1Headshots?.toString() || "HS"
                      }
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Player 2 Stats</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="skull" size={20} color={colors.primary} />
                    <TextInput
                      style={styles.statInput}
                      keyboardType="numeric"
                      value={player2Kills}
                      onChangeText={setPlayer2Kills}
                      placeholder={
                        match.proposedPlayer2Kills?.toString() || "Kills"
                      }
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="heart-dislike" size={20} color="#ef4444" />
                    <TextInput
                      style={styles.statInput}
                      keyboardType="numeric"
                      value={player2Deaths}
                      onChangeText={setPlayer2Deaths}
                      placeholder={
                        match.proposedPlayer2Deaths?.toString() || "Deaths"
                      }
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="eye" size={20} color="#10b981" />
                    <TextInput
                      style={styles.statInput}
                      keyboardType="numeric"
                      value={player2Headshots}
                      onChangeText={setPlayer2Headshots}
                      placeholder={
                        match.proposedPlayer2Headshots?.toString() || "HS"
                      }
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                {/* Action Button */}
                {(isPlayer1 || isPlayer2) && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.primary },
                      hasProposed && !waitingForMe && styles.disabledButton,
                      loading && styles.loadingButton,
                    ]}
                    onPress={handleSubmitShooter}
                    disabled={loading || (hasProposed && !waitingForMe)}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons
                          name={waitingForMe ? "checkmark-circle" : "send"}
                          size={20}
                          color="white"
                        />
                        <Text style={styles.actionButtonText}>
                          {waitingForMe ? "Confirm Stats" : "Submit Stats"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              /* Football Game Input */
              <>
                {/* Proposed Score Display */}
                {match.proposedPlayer1Score && waitingForMe && (
                  <View style={styles.proposedScoreContainer}>
                    <Text style={styles.proposedScoreTitle}>
                      Opponent Proposed:
                    </Text>
                    <Text
                      style={[styles.proposedScore, { color: colors.primary }]}
                    >
                      {match.proposedPlayer1Score} -{" "}
                      {match.proposedPlayer2Score}
                    </Text>
                  </View>
                )}

                {/* Score Input */}
                <View style={styles.scoreContainer}>
                  <View style={styles.scoreInputWrapper}>
                    <TextInput
                      style={styles.scoreInput}
                      keyboardType="numeric"
                      value={player1Score}
                      onChangeText={setPlayer1Score}
                      placeholder={
                        match.proposedPlayer1Score?.toString() || "0"
                      }
                      placeholderTextColor="#9ca3af"
                      maxLength={2}
                      editable={!hasProposed && !match.proposedPlayer1Score}
                    />
                  </View>

                  <Text style={styles.scoreDash}>-</Text>

                  <View style={styles.scoreInputWrapper}>
                    <TextInput
                      style={styles.scoreInput}
                      keyboardType="numeric"
                      value={player2Score}
                      onChangeText={setPlayer2Score}
                      placeholder={
                        match.proposedPlayer2Score?.toString() || "0"
                      }
                      placeholderTextColor="#9ca3af"
                      maxLength={2}
                      editable={!hasProposed && !match.proposedPlayer1Score}
                    />
                  </View>
                </View>

                {/* Action Button */}
                {(isPlayer1 || isPlayer2) && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.primary },
                      hasProposed && !waitingForMe && styles.disabledButton,
                      loading && styles.loadingButton,
                    ]}
                    onPress={handleSubmitFootball}
                    disabled={loading || (hasProposed && !waitingForMe)}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons
                          name={waitingForMe ? "checkmark-circle" : "send"}
                          size={20}
                          color="white"
                        />
                        <Text style={styles.actionButtonText}>
                          {waitingForMe ? "Confirm Score" : "Submit Score"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Dispute Info */}
            {match.status === "disputed" && (
              <View style={styles.disputeContainer}>
                <Ionicons name="alert-triangle" size={20} color="#dc2626" />
                <Text style={styles.disputeText}>
                  Match under review. Admin will resolve shortly.
                </Text>
              </View>
            )}

            {/* Integrity Note */}
            <View style={styles.noteContainer}>
              <Ionicons name="shield-checkmark" size={16} color="#10b981" />
              <Text style={styles.noteText}>
                {isShooterGame
                  ? "Both players must confirm the kill counts."
                  : "Both players must confirm the score."}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
  shooterContainer: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 8,
    width: "100%",
    textAlign: "center",
    marginTop: 4,
    fontSize: 14,
  },
  proposedStatsContainer: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  proposedStatsTitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
    textAlign: "center",
  },
  proposedStatsRow: {
    gap: 4,
  },
  proposedStat: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  proposedStatText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  scoreInputWrapper: {
    width: 80,
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
  },
  scoreDash: {
    marginHorizontal: 16,
    fontSize: 24,
    color: "#9ca3af",
    fontWeight: "600",
  },
  proposedScoreContainer: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  proposedScoreTitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  proposedScore: {
    fontSize: 18,
    fontWeight: "700",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingButton: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disputeContainer: {
    backgroundColor: "#fee2e2",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  disputeText: {
    color: "#dc2626",
    fontSize: 13,
    flex: 1,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  noteText: {
    fontSize: 11,
    color: "#6b7280",
    flex: 1,
  },
});
