import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all tournaments - use this for the tournaments page
export const getAllTournaments = query({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").collect();
    return tournaments;
  },
});

// Get tournament by ID
export const getTournamentById = query({
  args: {
    tournamentId: v.string(),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db
      .query("tournaments")
      .filter((q) => q.eq(q.field("_id"), args.tournamentId))
      .first();

    return tournament;
  },
});

// Create a new tournament
export const createTournament = mutation({
  args: {
    name: v.string(),
    game: v.string(),
    date: v.string(),
    fee: v.number(),
  },
  handler: async (ctx, args) => {
    const tournamentId = await ctx.db.insert("tournaments", {
      name: args.name,
      game: args.game,
      date: args.date,
      fee: args.fee,
      status: "",
      bracketType: "",
      maxPlayers: 0,
    });

    return {
      success: true,
      tournamentId,
    };
  },
});

// Generate knockout bracket
export const generateBracket = mutation({
  args: {
    tournamentId: v.string(),
  },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();

    if (players.length < 2) {
      throw new Error("Need at least 2 players to generate bracket");
    }

    // Shuffle players randomly
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const numPlayers = shuffled.length;

    // Calculate number of rounds (for 16 players, 4 rounds)
    const rounds = Math.ceil(Math.log2(numPlayers));
    const matches = [];

    // Generate first round matches
    for (let i = 0; i < Math.floor(numPlayers / 2); i++) {
      const matchId = await ctx.db.insert("matches", {
        tournamentId: args.tournamentId,
        round: 1,
        matchNumber: i + 1,
        player1Id: shuffled[i * 2]?.userId,
        player2Id: shuffled[i * 2 + 1]?.userId,
        status: "pending",
      });
      matches.push(matchId);
    }

    // Generate subsequent rounds
    let currentRoundMatches = matches;
    for (let round = 2; round <= rounds; round++) {
      const nextRoundMatches = [];
      for (let i = 0; i < currentRoundMatches.length / 2; i++) {
        const matchId = await ctx.db.insert("matches", {
          tournamentId: args.tournamentId,
          round: round,
          matchNumber: i + 1,
          status: "pending",
        });
        nextRoundMatches.push(matchId);

        // Connect previous matches to this one
        if (currentRoundMatches[i * 2]) {
          await ctx.db.patch(currentRoundMatches[i * 2], {
            nextMatchId: matchId,
          });
        }
        if (currentRoundMatches[i * 2 + 1]) {
          await ctx.db.patch(currentRoundMatches[i * 2 + 1], {
            nextMatchId: matchId,
          });
        }
      }
      currentRoundMatches = nextRoundMatches;
    }

    return { success: true };
  },
});

// Get tournament bracket
export const getTournamentBracket = query({
  args: {
    tournamentId: v.string(),
  },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();

    // Group matches by round
    const bracket: { [key: number]: any[] } = {};
    matches.forEach((match) => {
      if (!bracket[match.round]) bracket[match.round] = [];
      bracket[match.round].push(match);
    });

    return bracket;
  },
});

// =============== WINNERS QUERIES ===============

// Get ALL winners from ALL tournaments (no filters)
export const getAllWinners = query({
  args: {},
  handler: async (ctx) => {
    const winners = await ctx.db.query("winners").order("desc").collect();

    console.log(`📊 Retrieved ${winners.length} total winners`);
    return winners;
  },
});

// Get winners with optional filters
export const getWinners = query({
  args: {
    game: v.optional(v.string()),
    limit: v.optional(v.number()),
    tournamentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("winners");

    if (args.game) {
      query = query.filter((q) => q.eq(q.field("game"), args.game));
    }

    if (args.tournamentId) {
      query = query.filter((q) =>
        q.eq(q.field("tournamentId"), args.tournamentId),
      );
    }

    const winners = await query.order("desc").take(args.limit || 100);
    console.log(`📊 Retrieved ${winners.length} winners with filters`);
    return winners;
  },
});

// Get winners by position (1st, 2nd, 3rd)
export const getWinnersByPosition = query({
  args: {
    position: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const winners = await ctx.db
      .query("winners")
      .filter((q) => q.eq(q.field("position"), args.position))
      .order("desc")
      .take(args.limit || 50);

    return winners;
  },
});

// Get top winners by prize money
export const getTopWinners = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const winners = await ctx.db
      .query("winners")
      .order("desc")
      .take(args.limit || 20);

    // Sort by prize money (highest first)
    return winners.sort((a, b) => b.prize - a.prize);
  },
});

// Get winners by game
export const getWinnersByGame = query({
  args: {
    game: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const winners = await ctx.db
      .query("winners")
      .filter((q) => q.eq(q.field("game"), args.game))
      .order("desc")
      .take(args.limit || 50);

    return winners;
  },
});

// Get recent winners
export const getRecentWinners = query({
  args: {
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const winners = await ctx.db
      .query("winners")
      .order("desc")
      .take(args.limit || 50);

    // Optional: filter by date
    if (args.days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - args.days);
      return winners.filter((w) => new Date(w.date) >= cutoffDate);
    }

    return winners;
  },
});

// =============== TOURNAMENT COMPLETION ===============

// Complete tournament and record ALL winners (1st, 2nd, 3rd)
export const completeTournamentWithPlacements = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    console.log("🏆 Completing tournament:", tournament.name);

    // Get all matches
    const matches = await ctx.db
      .query("matches")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();

    // Find all players in the tournament
    const allPlayers = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();

    // Calculate total prize pool
    const totalPrize = allPlayers.length * tournament.fee;

    // Prize distribution (adjust percentages as needed)
    const prizeDistribution = {
      1: Math.round(totalPrize * 0.5), // 50% to winner
      2: Math.round(totalPrize * 0.3), // 30% to runner-up
      3: Math.round(totalPrize * 0.2), // 20% to third place
    };

    // Find final match (highest round)
    const finalRound = Math.max(...matches.map((m) => m.round));
    const finalMatch = matches.find((m) => m.round === finalRound);

    if (!finalMatch || !finalMatch.winnerId) {
      throw new Error("Cannot determine tournament winner");
    }

    // Determine 1st and 2nd place
    const firstPlace = finalMatch.winnerId;
    const secondPlace =
      finalMatch.player1Id === firstPlace
        ? finalMatch.player2Id
        : finalMatch.player1Id;

    // Find 3rd place (semi-final losers)
    const semiFinalRound = finalRound - 1;
    const semiFinals = matches.filter((m) => m.round === semiFinalRound);

    let thirdPlace = null;
    if (semiFinals.length >= 2) {
      // Get the losers of both semi-finals
      const semiFinalLosers = semiFinals.map((m) =>
        m.player1Id === m.winnerId ? m.player2Id : m.player1Id,
      );

      // Pick the first one as 3rd place (or you could have them play a 3rd place match)
      thirdPlace = semiFinalLosers[0];
    }

    const placements = [
      { position: 1, playerId: firstPlace, prize: prizeDistribution[1] },
      { position: 2, playerId: secondPlace, prize: prizeDistribution[2] },
      { position: 3, playerId: thirdPlace, prize: prizeDistribution[3] },
    ];

    console.log("🏆 Placements:", placements);

    // Record each placement
    for (const placement of placements) {
      if (!placement.playerId) continue;

      // Get player details
      const player = await ctx.db
        .query("players")
        .filter((q) => q.eq(q.field("userId"), placement.playerId))
        .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
        .first();

      if (!player) continue;

      // Count matches played by this player
      const playerMatches = matches.filter(
        (m) =>
          m.player1Id === placement.playerId ||
          m.player2Id === placement.playerId,
      ).length;

      // Update tournament with winner info
      if (placement.position === 1) {
        await ctx.db.patch(args.tournamentId, {
          winnerId: placement.playerId,
          winnerName: player.name,
          winnerPrize: placement.prize,
          completedAt: Date.now(),
          status: "completed",
        });
      }

      // Update player stats
      await ctx.db.patch(player._id, {
        wins: (player.wins || 0) + (placement.position === 1 ? 1 : 0),
        totalEarnings: (player.totalEarnings || 0) + placement.prize,
        tournamentsPlayed: (player.tournamentsPlayed || 0) + 1,
      });

      // Update user balance
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("_id"), placement.playerId))
        .first();

      if (user) {
        await ctx.db.patch(user._id, {
          balance: (user.balance || 0) + placement.prize,
          totalEarnings: (user.totalEarnings || 0) + placement.prize,
        });
      }

      // Record in winners table
      await ctx.db.insert("winners", {
        tournamentId: args.tournamentId,
        tournamentName: tournament.name,
        game: tournament.game,
        winnerId: placement.playerId,
        winnerName: player.name,
        prize: placement.prize,
        date: new Date().toISOString(),
        matchesPlayed: playerMatches,
        position: placement.position,
      });
    }

    return {
      success: true,
      winners: placements
        .filter((p) => p.playerId)
        .map((p) => ({
          position: p.position,
          playerId: p.playerId,
          prize: p.prize,
        })),
    };
  },
});

// Get all tournaments a user has paid for
// Get all tournaments a user has paid for
export const getUserTournaments = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("🔍 Getting tournaments for user:", args.userId);

    // Find all players entries for this user
    const playerEntries = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    console.log(`📊 Found ${playerEntries.length} player entries for user`);

    if (playerEntries.length === 0) return [];

    // Get tournament details for each entry
    const tournaments = await Promise.all(
      playerEntries.map(async (entry) => {
        const tournament = await ctx.db
          .query("tournaments")
          .filter((q) => q.eq(q.field("_id"), entry.tournamentId))
          .first();

        if (!tournament) return null;

        // Check if user won this tournament
        const isWinner = tournament.winnerId === args.userId;

        // Determine status based on date and winner
        const tournamentDate = new Date(tournament.date);
        const now = new Date();

        let status = "pending";
        if (tournament.winnerId) {
          status = "completed";
        } else if (tournamentDate <= now) {
          status = "in_progress";
        } else {
          status = "upcoming";
        }

        return {
          ...tournament,
          isWinner,
          status, // Add computed status
          registeredAt: entry.createdAt,
        };
      }),
    );

    // Filter out null values and sort by date (newest first)
    const validTournaments = tournaments
      .filter((t) => t !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`✅ Returning ${validTournaments.length} tournaments for user`);

    return validTournaments;
  },
});

// ... rest of your existing functions (proposeScore, confirmScore, etc.) remain the same
