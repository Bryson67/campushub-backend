import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Get all tournaments - use this for the tournaments page

// Get tournament by ID

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

// Get tournament bracket

// Update match score
export const updateMatchScore = mutation({
  args: {
    matchId: v.id("matches"),
    player1Score: v.number(),
    player2Score: v.number(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    const winnerId =
      args.player1Score > args.player2Score ? match.player1Id : match.player2Id;

    await ctx.db.patch(args.matchId, {
      player1Score: args.player1Score,
      player2Score: args.player2Score,
      winnerId,
      status: "completed",
    });

    // If there's a next match, advance the winner
    if (match.nextMatchId) {
      const nextMatch = (await ctx.db.get(
        match.nextMatchId as Id<"matches">,
      )) as Doc<"matches">;
      if (nextMatch) {
        if (!nextMatch.player1Id) {
          await ctx.db.patch(match.nextMatchId as Id<"matches">, {
            player1Id: winnerId,
          });
        } else {
          await ctx.db.patch(match.nextMatchId as Id<"matches">, {
            player2Id: winnerId,
          });
        }
      }
    }

    return { success: true };
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

// Get all tournaments
export const getAllTournaments = query({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").collect();
    return tournaments;
  },
});

// Get winners list
export const getWinners = query({
  args: {
    game: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("winners");

    if (args.game) {
      query = query.filter((q) => q.eq(q.field("game"), args.game));
    }

    const winners = await query.order("desc").take(args.limit || 50);
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
      .take(args.limit || 10);

    // Sort by prize money
    return winners.sort((a, b) => b.prize - a.prize);
  },
});

// Complete tournament and record winner
// Complete tournament and record winner
export const completeTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new Error("Tournament not found");

    // Find the final match
    const matches = await ctx.db
      .query("matches")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();

    const finalRound = Math.max(...matches.map((m) => m.round));
    const finalMatch = matches.find((m) => m.round === finalRound);

    if (!finalMatch || !finalMatch.winnerId) {
      throw new Error("Tournament winner not determined");
    }

    // Get winner details
    const winner = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("userId"), finalMatch.winnerId))
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .first();

    if (!winner) throw new Error("Winner not found in players");

    // Calculate prize money
    const allPlayers = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();

    const totalPrize = allPlayers.length * tournament.fee;

    // Update tournament
    await ctx.db.patch(args.tournamentId, {
      winnerId: finalMatch.winnerId,
      winnerName: winner.name,
      winnerPrize: totalPrize,
      completedAt: Date.now(),
      status: "completed",
    });

    // Update winner's balance in users table
    // Update winner's balance in users table
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), finalMatch.winnerId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        balance: (user.balance || 0) + totalPrize,
        wins: (user.wins || 0) + 1,
        totalEarnings: ((user as any).totalEarnings || 0) + totalPrize, // Use type assertion
      });
    }

    // Record in winners table
    // ... rest of your existing code ...
  },
});
