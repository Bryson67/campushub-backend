import { Ionicons } from "@expo/vector-icons";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Match {
  _id: string;
  round: number;
  matchNumber: number;
  player1Id?: string;
  player2Id?: string;
  player1Score?: number;
  player2Score?: number;
  player1Kills?: number;
  player2Kills?: number;
  player1Deaths?: number;
  player2Deaths?: number;
  player1Headshots?: number;
  player2Headshots?: number;
  winnerId?: string;
  winnerMethod?: string;
  status: string; // 'pending', 'in_progress', 'awaiting_confirmation', 'completed', 'disputed'
  nextMatchId?: string;
  proposedBy?: string;
  proposedPlayer1Score?: number;
  proposedPlayer2Score?: number;
}

interface BracketProps {
  matches: Match[];
  players: any[];
  gameType?: "pubg" | "cod" | "deltaforce" | "fifa" | "efootball" | "default";
  onMatchPress?: (match: Match) => void;
  currentUserId?: string;
}

const TournamentBracket = ({
  matches,
  players,
  gameType = "default",
  onMatchPress,
  currentUserId,
}: BracketProps) => {
  // Group matches by round
  const rounds: { [key: number]: Match[] } = {};
  matches.forEach((match) => {
    if (!rounds[match.round]) rounds[match.round] = [];
    rounds[match.round].push(match);
  });

  // Sort rounds
  const roundNumbers = Object.keys(rounds).sort(
    (a, b) => Number(a) - Number(b),
  );

  const getPlayerName = (playerId?: string) => {
    if (!playerId) return "TBD";
    const player = players.find((p) => p.userId === playerId);
    return player?.name || "Unknown";
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return "🏆 FINAL";
    if (round === totalRounds - 1) return "🔷 SEMI FINALS";
    if (round === totalRounds - 2) return "🔶 QUARTER FINALS";
    if (round === totalRounds - 3) return "🔴 ROUND OF 16";
    return `⚔️ ROUND ${round}`;
  };

  // Get game-specific colors
  const getGameColors = () => {
    switch (gameType) {
      case "pubg":
        return {
          primary: "#f59e0b",
          secondary: "#d97706",
          background: "#fffbeb",
          text: "#92400e",
          accent: "#fbbf24",
          death: "#ef4444",
          headshot: "#3b82f6",
        };
      case "cod":
        return {
          primary: "#dc2626",
          secondary: "#b91c1c",
          background: "#fee2e2",
          text: "#991b1b",
          accent: "#f87171",
          death: "#6b7280",
          headshot: "#f59e0b",
        };
      case "deltaforce":
        return {
          primary: "#2563eb",
          secondary: "#1d4ed8",
          background: "#dbeafe",
          text: "#1e3a8a",
          accent: "#60a5fa",
          death: "#6b7280",
          headshot: "#10b981",
        };
      case "fifa":
      case "efootball":
        return {
          primary: "#059669",
          secondary: "#047857",
          background: "#d1fae5",
          text: "#064e3b",
          accent: "#34d399",
          death: "#6b7280",
          headshot: "#f59e0b",
        };
      default:
        return {
          primary: "#6366f1",
          secondary: "#4f46e5",
          background: "#ede9fe",
          text: "#3730a3",
          accent: "#818cf8",
          death: "#6b7280",
          headshot: "#f59e0b",
        };
    }
  };

  const colors = getGameColors();
  const totalRounds = roundNumbers.length;
  const isShooterGame =
    gameType === "pubg" || gameType === "cod" || gameType === "deltaforce";

  const getStatusBadge = (match: Match) => {
    if (match.status === "completed") {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#10b981" }]}>
          <Ionicons name="checkmark-circle" size={12} color="white" />
          <Text style={styles.statusBadgeText}>Completed</Text>
        </View>
      );
    }
    if (match.status === "disputed") {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#ef4444" }]}>
          <Ionicons name="alert-triangle" size={12} color="white" />
          <Text style={styles.statusBadgeText}>Disputed</Text>
        </View>
      );
    }
    if (match.status === "awaiting_confirmation") {
      const waitingFor =
        match.proposedBy === match.player1Id ? "Player 2" : "Player 1";
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#f59e0b" }]}>
          <Ionicons name="time" size={12} color="white" />
          <Text style={styles.statusBadgeText}>Awaiting {waitingFor}</Text>
        </View>
      );
    }
    if (match.status === "in_progress") {
      return (
        <View style={[styles.statusBadge, { backgroundColor: "#ef4444" }]}>
          <View style={styles.liveDot} />
          <Text style={styles.statusBadgeText}>LIVE</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: "#9ca3af" }]}>
        <Text style={styles.statusBadgeText}>Pending</Text>
      </View>
    );
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.container}>
        {roundNumbers.map((roundNum) => (
          <View key={roundNum} style={styles.roundColumn}>
            <View
              style={[styles.roundHeader, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.roundTitle}>
                {getRoundName(Number(roundNum), totalRounds)}
              </Text>
            </View>

            <View style={styles.matchesContainer}>
              {rounds[Number(roundNum)].map((match, index) => {
                const isPlayer1Winner = match.winnerId === match.player1Id;
                const isPlayer2Winner = match.winnerId === match.player2Id;
                const isCurrentUserInMatch =
                  currentUserId &&
                  (match.player1Id === currentUserId ||
                    match.player2Id === currentUserId);

                // Calculate K/D ratios for shooter games
                const player1KD =
                  match.player1Kills && match.player1Deaths
                    ? (
                        match.player1Kills / Math.max(match.player1Deaths, 1)
                      ).toFixed(2)
                    : null;
                const player2KD =
                  match.player2Kills && match.player2Deaths
                    ? (
                        match.player2Kills / Math.max(match.player2Deaths, 1)
                      ).toFixed(2)
                    : null;

                return (
                  <TouchableOpacity
                    key={match._id}
                    style={[
                      styles.matchCard,
                      { borderLeftColor: colors.primary },
                      match.status === "completed" && styles.completedMatch,
                      isCurrentUserInMatch && styles.userMatchCard,
                    ]}
                    onPress={() => onMatchPress?.(match)}
                    activeOpacity={0.7}
                  >
                    {/* Match Number */}
                    <View
                      style={[
                        styles.matchNumber,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <Text
                        style={[
                          styles.matchNumberText,
                          { color: colors.primary },
                        ]}
                      >
                        Match {match.matchNumber}
                      </Text>
                    </View>

                    {/* Status Badge */}
                    <View style={styles.statusContainer}>
                      {getStatusBadge(match)}
                    </View>

                    {/* Player 1 */}
                    <View
                      style={[
                        styles.playerRow,
                        isPlayer1Winner && [
                          styles.winnerRow,
                          { backgroundColor: colors.background },
                        ],
                      ]}
                    >
                      <View style={styles.playerInfo}>
                        <View style={styles.playerNameContainer}>
                          {isPlayer1Winner && (
                            <Ionicons
                              name="trophy"
                              size={14}
                              color={colors.primary}
                            />
                          )}
                          <Text
                            style={[
                              styles.playerName,
                              isPlayer1Winner && {
                                color: colors.primary,
                                fontWeight: "700",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {getPlayerName(match.player1Id)}
                          </Text>
                          {match.player1Id === currentUserId && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>You</Text>
                            </View>
                          )}
                        </View>

                        {/* Stats for shooter games */}
                        {match.status === "completed" &&
                          match.player1Id &&
                          isShooterGame && (
                            <View style={styles.statsContainer}>
                              {match.player1Kills !== undefined && (
                                <View
                                  style={[
                                    styles.statBadge,
                                    { backgroundColor: colors.accent + "20" },
                                  ]}
                                >
                                  <Ionicons
                                    name="skull"
                                    size={10}
                                    color={colors.primary}
                                  />
                                  <Text
                                    style={[
                                      styles.statText,
                                      { color: colors.primary },
                                    ]}
                                  >
                                    {match.player1Kills}K
                                  </Text>
                                </View>
                              )}
                              {match.player1Deaths !== undefined &&
                                match.player1Deaths > 0 && (
                                  <View
                                    style={[
                                      styles.statBadge,
                                      { backgroundColor: "#fee2e2" },
                                    ]}
                                  >
                                    <Ionicons
                                      name="heart-dislike"
                                      size={10}
                                      color="#ef4444"
                                    />
                                    <Text
                                      style={[
                                        styles.statText,
                                        { color: "#ef4444" },
                                      ]}
                                    >
                                      {match.player1Deaths}D
                                    </Text>
                                  </View>
                                )}
                              {match.player1Headshots !== undefined &&
                                match.player1Headshots > 0 && (
                                  <View
                                    style={[
                                      styles.statBadge,
                                      { backgroundColor: "#dbeafe" },
                                    ]}
                                  >
                                    <Ionicons
                                      name="eye"
                                      size={10}
                                      color="#3b82f6"
                                    />
                                    <Text
                                      style={[
                                        styles.statText,
                                        { color: "#3b82f6" },
                                      ]}
                                    >
                                      {match.player1Headshots}HS
                                    </Text>
                                  </View>
                                )}
                            </View>
                          )}

                        {/* Score for football games */}
                        {match.status === "completed" &&
                          !isShooterGame &&
                          match.player1Score !== undefined && (
                            <Text style={styles.scoreText}>
                              Score: {match.player1Score}
                            </Text>
                          )}

                        {/* Proposed score for pending confirmation */}
                        {match.status === "awaiting_confirmation" &&
                          match.proposedPlayer1Score && (
                            <Text style={styles.proposedScoreText}>
                              Proposed: {match.proposedPlayer1Score}
                            </Text>
                          )}
                      </View>

                      {/* K/D Ratio for shooter games */}
                      {match.status === "completed" &&
                        isShooterGame &&
                        player1KD && (
                          <View style={styles.kdContainer}>
                            <Text style={styles.kdText}>{player1KD} KD</Text>
                          </View>
                        )}

                      {/* Score for football games */}
                      {match.status === "completed" &&
                        !isShooterGame &&
                        match.player1Score !== undefined && (
                          <View
                            style={[
                              styles.scoreBadge,
                              { backgroundColor: colors.primary },
                            ]}
                          >
                            <Text style={styles.scoreText}>
                              {match.player1Score}
                            </Text>
                          </View>
                        )}
                    </View>

                    {/* VS Divider */}
                    <View style={styles.vsContainer}>
                      <View
                        style={[
                          styles.vsLine,
                          { backgroundColor: colors.accent + "40" },
                        ]}
                      />
                      <Text style={[styles.vsText, { color: colors.primary }]}>
                        VS
                      </Text>
                      <View
                        style={[
                          styles.vsLine,
                          { backgroundColor: colors.accent + "40" },
                        ]}
                      />
                    </View>

                    {/* Player 2 */}
                    <View
                      style={[
                        styles.playerRow,
                        isPlayer2Winner && [
                          styles.winnerRow,
                          { backgroundColor: colors.background },
                        ],
                      ]}
                    >
                      <View style={styles.playerInfo}>
                        <View style={styles.playerNameContainer}>
                          {isPlayer2Winner && (
                            <Ionicons
                              name="trophy"
                              size={14}
                              color={colors.primary}
                            />
                          )}
                          <Text
                            style={[
                              styles.playerName,
                              isPlayer2Winner && {
                                color: colors.primary,
                                fontWeight: "700",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {getPlayerName(match.player2Id)}
                          </Text>
                          {match.player2Id === currentUserId && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>You</Text>
                            </View>
                          )}
                        </View>

                        {/* Stats for shooter games */}
                        {match.status === "completed" &&
                          match.player2Id &&
                          isShooterGame && (
                            <View style={styles.statsContainer}>
                              {match.player2Kills !== undefined && (
                                <View
                                  style={[
                                    styles.statBadge,
                                    { backgroundColor: colors.accent + "20" },
                                  ]}
                                >
                                  <Ionicons
                                    name="skull"
                                    size={10}
                                    color={colors.primary}
                                  />
                                  <Text
                                    style={[
                                      styles.statText,
                                      { color: colors.primary },
                                    ]}
                                  >
                                    {match.player2Kills}K
                                  </Text>
                                </View>
                              )}
                              {match.player2Deaths !== undefined &&
                                match.player2Deaths > 0 && (
                                  <View
                                    style={[
                                      styles.statBadge,
                                      { backgroundColor: "#fee2e2" },
                                    ]}
                                  >
                                    <Ionicons
                                      name="heart-dislike"
                                      size={10}
                                      color="#ef4444"
                                    />
                                    <Text
                                      style={[
                                        styles.statText,
                                        { color: "#ef4444" },
                                      ]}
                                    >
                                      {match.player2Deaths}D
                                    </Text>
                                  </View>
                                )}
                              {match.player2Headshots !== undefined &&
                                match.player2Headshots > 0 && (
                                  <View
                                    style={[
                                      styles.statBadge,
                                      { backgroundColor: "#dbeafe" },
                                    ]}
                                  >
                                    <Ionicons
                                      name="eye"
                                      size={10}
                                      color="#3b82f6"
                                    />
                                    <Text
                                      style={[
                                        styles.statText,
                                        { color: "#3b82f6" },
                                      ]}
                                    >
                                      {match.player2Headshots}HS
                                    </Text>
                                  </View>
                                )}
                            </View>
                          )}

                        {/* Score for football games */}
                        {match.status === "completed" &&
                          !isShooterGame &&
                          match.player2Score !== undefined && (
                            <Text style={styles.scoreText}>
                              Score: {match.player2Score}
                            </Text>
                          )}

                        {/* Proposed score for pending confirmation */}
                        {match.status === "awaiting_confirmation" &&
                          match.proposedPlayer2Score && (
                            <Text style={styles.proposedScoreText}>
                              Proposed: {match.proposedPlayer2Score}
                            </Text>
                          )}
                      </View>

                      {/* K/D Ratio for shooter games */}
                      {match.status === "completed" &&
                        isShooterGame &&
                        player2KD && (
                          <View style={styles.kdContainer}>
                            <Text style={styles.kdText}>{player2KD} KD</Text>
                          </View>
                        )}

                      {/* Score for football games */}
                      {match.status === "completed" &&
                        !isShooterGame &&
                        match.player2Score !== undefined && (
                          <View
                            style={[
                              styles.scoreBadge,
                              { backgroundColor: colors.primary },
                            ]}
                          >
                            <Text style={styles.scoreText}>
                              {match.player2Score}
                            </Text>
                          </View>
                        )}
                    </View>

                    {/* Winner Method for shooter games */}
                    {match.status === "completed" &&
                      isShooterGame &&
                      match.winnerMethod && (
                        <View style={styles.winnerMethodContainer}>
                          <Ionicons
                            name="information-circle"
                            size={12}
                            color={colors.primary}
                          />
                          <Text
                            style={[
                              styles.winnerMethodText,
                              { color: colors.primary },
                            ]}
                          >
                            Winner by:{" "}
                            {match.winnerMethod === "kills"
                              ? "Most Kills"
                              : match.winnerMethod}
                          </Text>
                        </View>
                      )}

                    {/* Connection Lines */}
                    {index < rounds[Number(roundNum)].length - 1 && (
                      <View
                        style={[
                          styles.connector,
                          { backgroundColor: colors.accent + "20" },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    gap: 24,
  },
  roundColumn: {
    width: 280,
  },
  roundHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roundTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  matchesContainer: {
    gap: 20,
  },
  matchCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  userMatchCard: {
    borderWidth: 2,
    borderColor: "#6366f1",
    borderLeftWidth: 4,
  },
  completedMatch: {
    opacity: 0.9,
    backgroundColor: "#fafafa",
  },
  matchNumber: {
    position: "absolute",
    top: -8,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchNumberText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusContainer: {
    marginBottom: 10,
    alignItems: "flex-start",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontSize: 10,
    color: "white",
    fontWeight: "600",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginVertical: 2,
  },
  winnerRow: {
    borderRadius: 10,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
    flexWrap: "wrap",
  },
  playerName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    flex: 1,
  },
  youBadge: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  youBadgeText: {
    color: "white",
    fontSize: 8,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
    flexWrap: "wrap",
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  statText: {
    fontSize: 9,
    fontWeight: "600",
  },
  proposedScoreText: {
    fontSize: 10,
    color: "#f59e0b",
    fontWeight: "500",
    marginTop: 2,
  },
  kdContainer: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  kdText: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "500",
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 35,
    alignItems: "center",
  },
  scoreText: {
    fontSize: 11,
    color: "#6b7280",
  },
  vsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  vsLine: {
    flex: 1,
    height: 1,
  },
  vsText: {
    marginHorizontal: 10,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  winnerMethodContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 4,
  },
  winnerMethodText: {
    fontSize: 10,
    fontWeight: "500",
  },
  connector: {
    position: "absolute",
    bottom: -10,
    left: "50%",
    width: 2,
    height: 10,
    transform: [{ translateX: -1 }],
  },
});

export default TournamentBracket;
