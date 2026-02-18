import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface ShooterScoreModalProps {
  visible: boolean;
  onClose: () => void;
  match: any;
  player1Name: string;
  player2Name: string;
  gameType: "pubg" | "cod" | "deltaforce";
}

export default function ShooterScoreModal({
  visible,
  onClose,
  match,
  player1Name,
  player2Name,
  gameType,
}: ShooterScoreModalProps) {
  const [player1Kills, setPlayer1Kills] = useState("");
  const [player2Kills, setPlayer2Kills] = useState("");
  const [player1Deaths, setPlayer1Deaths] = useState("");
  const [player2Deaths, setPlayer2Deaths] = useState("");
  const [player1Headshots, setPlayer1Headshots] = useState("");
  const [player2Headshots, setPlayer2Headshots] = useState("");
  const [winnerMethod, setWinnerMethod] = useState("kills");

  const updateShooterMatch = useMutation(api.matches.updateShooterMatch);

  // Game-specific colors
  const getColors = () => {
    switch (gameType) {
      case "pubg":
        return {
          primary: "#f59e0b",
          secondary: "#d97706",
          background: "#fffbeb",
          accent: "#fbbf24",
        };
      case "cod":
        return {
          primary: "#dc2626",
          secondary: "#b91c1c",
          background: "#fee2e2",
          accent: "#f87171",
        };
      case "deltaforce":
        return {
          primary: "#2563eb",
          secondary: "#1d4ed8",
          background: "#dbeafe",
          accent: "#60a5fa",
        };
      default:
        return {
          primary: "#6366f1",
          secondary: "#4f46e5",
          background: "#ede9fe",
          accent: "#818cf8",
        };
    }
  };

  const colors = getColors();

  const handleSubmit = async () => {
    if (!player1Kills || !player2Kills) {
      Alert.alert("Error", "Please enter kill counts for both players");
      return;
    }

    try {
      await updateShooterMatch({
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
        winnerMethod,
      });

      Alert.alert("Success", "Match results recorded!");
      onClose();

      // Reset form
      setPlayer1Kills("");
      setPlayer2Kills("");
      setPlayer1Deaths("");
      setPlayer2Deaths("");
      setPlayer1Headshots("");
      setPlayer2Headshots("");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "An unknown error occurred.");
    }
  };

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
                  name={
                    gameType === "pubg"
                      ? "airplane"
                      : gameType === "cod"
                        ? "flash"
                        : "shield"
                  }
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.title}>Match Results</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Match Info */}
            <View style={styles.matchInfo}>
              <Text style={styles.roundText}>
                Round {match.round} • Match {match.matchNumber}
              </Text>
            </View>

            {/* Player 1 Stats */}
            <View
              style={[
                styles.playerSection,
                { backgroundColor: colors.background },
              ]}
            >
              <Text style={[styles.playerName, { color: colors.primary }]}>
                {player1Name}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="skull" size={20} color={colors.primary} />
                  <TextInput
                    style={styles.statInput}
                    keyboardType="numeric"
                    value={player1Kills}
                    onChangeText={setPlayer1Kills}
                    placeholder="Kills"
                    placeholderTextColor="#9ca3af"
                    maxLength={3}
                  />
                </View>

                <View style={styles.statItem}>
                  <Ionicons
                    name="heart-dislike"
                    size={20}
                    color={colors.secondary}
                  />
                  <TextInput
                    style={styles.statInput}
                    keyboardType="numeric"
                    value={player1Deaths}
                    onChangeText={setPlayer1Deaths}
                    placeholder="Deaths"
                    placeholderTextColor="#9ca3af"
                    maxLength={3}
                  />
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="eye" size={20} color="#10b981" />
                  <TextInput
                    style={styles.statInput}
                    keyboardType="numeric"
                    value={player1Headshots}
                    onChangeText={setPlayer1Headshots}
                    placeholder="HS"
                    placeholderTextColor="#9ca3af"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>

            {/* VS Divider */}
            <View style={styles.vsContainer}>
              <View
                style={[styles.vsLine, { backgroundColor: colors.accent }]}
              />
              <Text style={[styles.vsText, { color: colors.primary }]}>VS</Text>
              <View
                style={[styles.vsLine, { backgroundColor: colors.accent }]}
              />
            </View>

            {/* Player 2 Stats */}
            <View
              style={[
                styles.playerSection,
                { backgroundColor: colors.background },
              ]}
            >
              <Text style={[styles.playerName, { color: colors.primary }]}>
                {player2Name}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="skull" size={20} color={colors.primary} />
                  <TextInput
                    style={styles.statInput}
                    keyboardType="numeric"
                    value={player2Kills}
                    onChangeText={setPlayer2Kills}
                    placeholder="Kills"
                    placeholderTextColor="#9ca3af"
                    maxLength={3}
                  />
                </View>

                <View style={styles.statItem}>
                  <Ionicons
                    name="heart-dislike"
                    size={20}
                    color={colors.secondary}
                  />
                  <TextInput
                    style={styles.statInput}
                    keyboardType="numeric"
                    value={player2Deaths}
                    onChangeText={setPlayer2Deaths}
                    placeholder="Deaths"
                    placeholderTextColor="#9ca3af"
                    maxLength={3}
                  />
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="eye" size={20} color="#10b981" />
                  <TextInput
                    style={styles.statInput}
                    keyboardType="numeric"
                    value={player2Headshots}
                    onChangeText={setPlayer2Headshots}
                    placeholder="HS"
                    placeholderTextColor="#9ca3af"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>

            {/* Winner Method */}
            <View style={styles.methodSection}>
              <Text style={styles.methodLabel}>Win Method</Text>
              <View style={styles.methodOptions}>
                <TouchableOpacity
                  style={[
                    styles.methodOption,
                    winnerMethod === "kills" && [
                      styles.selectedMethod,
                      { borderColor: colors.primary },
                    ],
                  ]}
                  onPress={() => setWinnerMethod("kills")}
                >
                  <Ionicons
                    name="skull"
                    size={16}
                    color={
                      winnerMethod === "kills" ? colors.primary : "#9ca3af"
                    }
                  />
                  <Text
                    style={[
                      styles.methodText,
                      winnerMethod === "kills" && { color: colors.primary },
                    ]}
                  >
                    Most Kills
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodOption,
                    winnerMethod === "position" && [
                      styles.selectedMethod,
                      { borderColor: colors.primary },
                    ],
                  ]}
                  onPress={() => setWinnerMethod("position")}
                >
                  <Ionicons
                    name="trophy"
                    size={16}
                    color={
                      winnerMethod === "position" ? colors.primary : "#9ca3af"
                    }
                  />
                  <Text
                    style={[
                      styles.methodText,
                      winnerMethod === "position" && { color: colors.primary },
                    ]}
                  >
                    Last Standing
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodOption,
                    winnerMethod === "time" && [
                      styles.selectedMethod,
                      { borderColor: colors.primary },
                    ],
                  ]}
                  onPress={() => setWinnerMethod("time")}
                >
                  <Ionicons
                    name="time"
                    size={16}
                    color={winnerMethod === "time" ? colors.primary : "#9ca3af"}
                  />
                  <Text
                    style={[
                      styles.methodText,
                      winnerMethod === "time" && { color: colors.primary },
                    ]}
                  >
                    Time/Score
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.submitButtonText}>Submit Results</Text>
            </TouchableOpacity>

            {/* Game Tips */}
            <View style={styles.tipContainer}>
              <Ionicons name="information-circle" size={16} color="#6b7280" />
              <Text style={styles.tipText}>
                {gameType === "pubg"
                  ? "Winner is usually the last player standing, but kills matter for scoring!"
                  : gameType === "cod"
                    ? "Kill/death ratio determines the winner in most modes."
                    : "Delta Force rewards both kills and objective play."}
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
    width: "100%",
    alignItems: "center",
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxWidth: 400,
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
  matchInfo: {
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  roundText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  playerSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 8,
    width: "100%",
    textAlign: "center",
    backgroundColor: "white",
    fontSize: 14,
  },
  vsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  vsLine: {
    flex: 1,
    height: 1,
  },
  vsText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: "700",
  },
  methodSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  methodOptions: {
    flexDirection: "row",
    gap: 8,
  },
  methodOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 6,
  },
  selectedMethod: {
    borderWidth: 2,
    backgroundColor: "#f9fafb",
  },
  methodText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  tipText: {
    fontSize: 11,
    color: "#6b7280",
    flex: 1,
  },
});
