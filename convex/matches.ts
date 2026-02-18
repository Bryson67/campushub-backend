import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Update match with kill stats for shooter games
export const updateShooterMatch = mutation({
  args: {
    matchId: v.id("matches"),
    player1Kills: v.optional(v.number()),
    player2Kills: v.optional(v.number()),
    player1Deaths: v.optional(v.number()),
    player2Deaths: v.optional(v.number()),
    player1Headshots: v.optional(v.number()),
    player2Headshots: v.optional(v.number()),
    winnerMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    // Calculate winner based on kills (for shooter games)
    const player1Kills = args.player1Kills ?? match.player1Kills ?? 0;
    const player2Kills = args.player2Kills ?? match.player2Kills ?? 0;

    let winnerId: string | undefined = undefined;
    let winnerMethod = args.winnerMethod || "kills";

    if (winnerMethod === "kills") {
      if (player1Kills > player2Kills) winnerId = match.player1Id;
      else if (player2Kills > player1Kills) winnerId = match.player2Id;
    } else if (winnerMethod === "position") {
      // For battle royale, winner is last standing
      winnerId = match.player1Id; // Placeholder - actual logic depends on game
    }

    // Update match with all stats
    await ctx.db.patch(args.matchId, {
      player1Kills: args.player1Kills,
      player2Kills: args.player2Kills,
      player1Deaths: args.player1Deaths,
      player2Deaths: args.player2Deaths,
      player1Headshots: args.player1Headshots,
      player2Headshots: args.player2Headshots,
      winnerId,
      winnerMethod,
      status: "completed",
    });

    // If there's a next match, advance the winner
    if (match.nextMatchId && winnerId) {
      const nextMatch = await ctx.db.get(match.nextMatchId as Id<"matches">);
      if (nextMatch) {
        // Check if player1 slot is empty
        if (!nextMatch.player1Id) {
          await ctx.db.patch(match.nextMatchId as Id<"matches">, {
            player1Id: winnerId,
          });
        }
        // Check if player2 slot is empty
        else if (!nextMatch.player2Id) {
          await ctx.db.patch(match.nextMatchId as Id<"matches">, {
            player2Id: winnerId,
          });
        }
      }
    }

    return { success: true, winnerId };
  },
});

// Update regular match with scores (for FIFA, etc.)
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
    if (match.nextMatchId && winnerId) {
      const nextMatch = await ctx.db.get(match.nextMatchId as Id<"matches">);
      if (nextMatch) {
        if (!nextMatch.player1Id) {
          await ctx.db.patch(match.nextMatchId as Id<"matches">, {
            player1Id: winnerId,
          });
        } else if (!nextMatch.player2Id) {
          await ctx.db.patch(match.nextMatchId as Id<"matches">, {
            player2Id: winnerId,
          });
        }
      }
    }

    return { success: true };
  },
});

// Get match details with stats
export const getMatchDetails = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;

    // Get player details
    const player1 = match.player1Id
      ? await ctx.db
          .query("players")
          .filter((q) => q.eq(q.field("userId"), match.player1Id))
          .first()
      : null;

    const player2 = match.player2Id
      ? await ctx.db
          .query("players")
          .filter((q) => q.eq(q.field("userId"), match.player2Id))
          .first()
      : null;

    return {
      ...match,
      player1Name: player1?.name,
      player2Name: player2?.name,
    };
  },
});

// Get all matches for a tournament
export const getTournamentMatches = query({
  args: {
    tournamentId: v.string(),
  },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();

    return matches;
  },
});

// Player proposes a score
export const proposeScore = mutation({
  args: {
    matchId: v.id("matches"),
    player1Score: v.number(),
    player2Score: v.number(),
    proposedBy: v.string(), // User ID of player proposing
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    // Check if the proposer is actually in this match
    if (
      match.player1Id !== args.proposedBy &&
      match.player2Id !== args.proposedBy
    ) {
      throw new Error("Only players in this match can propose scores");
    }

    // Update match with proposed score
    await ctx.db.patch(args.matchId, {
      proposedPlayer1Score: args.player1Score,
      proposedPlayer2Score: args.player2Score,
      proposedBy: args.proposedBy,
      status: "awaiting_confirmation",
    });

    return {
      success: true,
      message: "Score proposed. Waiting for opponent confirmation.",
    };
  },
});

// Opponent confirms or disputes the score
export const confirmScore = mutation({
  args: {
    matchId: v.id("matches"),
    player1Score: v.number(),
    player2Score: v.number(),
    confirmedBy: v.string(), // User ID of player confirming
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    // Check if the confirmer is actually in this match
    if (
      match.player1Id !== args.confirmedBy &&
      match.player2Id !== args.confirmedBy
    ) {
      throw new Error("Only players in this match can confirm scores");
    }

    // Check if there's a proposed score
    if (!match.proposedPlayer1Score || !match.proposedPlayer2Score) {
      throw new Error("No score has been proposed yet");
    }

    // Check if the proposed scores match what the opponent is confirming
    const scoresMatch =
      match.proposedPlayer1Score === args.player1Score &&
      match.proposedPlayer2Score === args.player2Score;

    if (!scoresMatch) {
      // Scores don't match - create dispute
      await ctx.db.patch(args.matchId, {
        status: "disputed",
        disputeReason: "Score mismatch between players",
      });

      return {
        success: false,
        message: "Score mismatch! Match has been flagged for admin review.",
        disputed: true,
      };
    }

    // Scores match - determine winner
    const winnerId =
      args.player1Score > args.player2Score ? match.player1Id : match.player2Id;

    // Update match with final scores
    await ctx.db.patch(args.matchId, {
      player1Score: args.player1Score,
      player2Score: args.player2Score,
      player1Confirmed: match.proposedBy === match.player1Id,
      player2Confirmed: match.proposedBy === match.player2Id,
      player1ConfirmedAt:
        match.proposedBy === match.player1Id ? Date.now() : undefined,
      player2ConfirmedAt:
        match.proposedBy === match.player2Id ? Date.now() : undefined,
      winnerId,
      status: "completed",
    });

    // Advance winner to next round if applicable
    if (match.nextMatchId && winnerId) {
      const nextMatch = await ctx.db.get(match.nextMatchId as Id<"matches">);
      if (nextMatch) {
        if (!nextMatch.player1Id) {
          await ctx.db.patch(match.nextMatchId as Id<"matches">, {
            player1Id: winnerId,
          });
        } else if (!nextMatch.player2Id) {
          await ctx.db.patch(match.nextMatchId as Id<"matches">, {
            player2Id: winnerId,
          });
        }
      }
    }

    return {
      success: true,
      message: "Score confirmed! Match completed.",
      winnerId,
    };
  },
});

// Admin resolves a dispute
export const resolveDispute = mutation({
  args: {
    matchId: v.id("matches"),
    finalPlayer1Score: v.number(),
    finalPlayer2Score: v.number(),
    resolvedBy: v.string(), // Admin user ID
    resolution: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    const winnerId =
      args.finalPlayer1Score > args.finalPlayer2Score
        ? match.player1Id
        : match.player2Id;

    await ctx.db.patch(args.matchId, {
      player1Score: args.finalPlayer1Score,
      player2Score: args.finalPlayer2Score,
      winnerId,
      status: "completed",
      disputeReason: args.resolution,
    });

    // Advance winner
    if (match.nextMatchId && winnerId) {
      const nextMatch = await ctx.db.get(match.nextMatchId as Id<"matches">);
      if (nextMatch) {
        if (!nextMatch.player1Id) {
          await ctx.db.patch(match.nextMatchId as Id<"matches">, {
            player1Id: winnerId,
          });
        } else if (!nextMatch.player2Id) {
          await ctx.db.patch(match.nextMatchId as Id<"matches">, {
            player2Id: winnerId,
          });
        }
      }
    }

    return { success: true };
  },
});

// Get match with confirmation status
export const getMatchWithStatus = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;

    // Get player names
    const player1 = match.player1Id
      ? await ctx.db
          .query("players")
          .filter((q) => q.eq(q.field("userId"), match.player1Id))
          .first()
      : null;

    const player2 = match.player2Id
      ? await ctx.db
          .query("players")
          .filter((q) => q.eq(q.field("userId"), match.player2Id))
          .first()
      : null;

    return {
      ...match,
      player1Name: player1?.name,
      player2Name: player2?.name,
      confirmationStatus: getConfirmationStatus(match),
    };
  },
});

function getConfirmationStatus(match: any) {
  if (match.status === "completed") return "COMPLETED";
  if (match.status === "disputed") return "DISPUTED";
  if (match.proposedPlayer1Score && match.proposedPlayer2Score) {
    if (match.proposedBy === match.player1Id) {
      return "AWAITING_PLAYER2_CONFIRMATION";
    } else {
      return "AWAITING_PLAYER1_CONFIRMATION";
    }
  }
  return "AWAITING_SCORE";
}
// Player proposes kill counts for shooter games
export const proposeShooterStats = mutation({
  args: {
    matchId: v.id("matches"),
    player1Kills: v.number(),
    player2Kills: v.number(),
    player1Deaths: v.optional(v.number()),
    player2Deaths: v.optional(v.number()),
    player1Headshots: v.optional(v.number()),
    player2Headshots: v.optional(v.number()),
    proposedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    // Check if the proposer is actually in this match
    if (
      match.player1Id !== args.proposedBy &&
      match.player2Id !== args.proposedBy
    ) {
      throw new Error("Only players in this match can propose stats");
    }

    // Update match with proposed stats
    await ctx.db.patch(args.matchId, {
      proposedPlayer1Kills: args.player1Kills,
      proposedPlayer2Kills: args.player2Kills,
      proposedPlayer1Deaths: args.player1Deaths,
      proposedPlayer2Deaths: args.player2Deaths,
      proposedPlayer1Headshots: args.player1Headshots,
      proposedPlayer2Headshots: args.player2Headshots,
      proposedBy: args.proposedBy,
      status: "awaiting_confirmation",
    });

    return {
      success: true,
      message: "Stats proposed. Waiting for opponent confirmation.",
    };
  },
});

// Opponent confirms or disputes shooter stats
export const confirmShooterStats = mutation({
  args: {
    matchId: v.id("matches"),
    player1Kills: v.number(),
    player2Kills: v.number(),
    player1Deaths: v.optional(v.number()),
    player2Deaths: v.optional(v.number()),
    player1Headshots: v.optional(v.number()),
    player2Headshots: v.optional(v.number()),
    confirmedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    // Check if the confirmer is actually in this match
    if (
      match.player1Id !== args.confirmedBy &&
      match.player2Id !== args.confirmedBy
    ) {
      throw new Error("Only players in this match can confirm stats");
    }

    // Check if there are proposed stats
    if (
      match.proposedPlayer1Kills === undefined ||
      match.proposedPlayer2Kills === undefined
    ) {
      throw new Error("No stats have been proposed yet");
    }

    // Check if the proposed stats match what the opponent is confirming
    const killsMatch =
      match.proposedPlayer1Kills === args.player1Kills &&
      match.proposedPlayer2Kills === args.player2Kills;

    const deathsMatch =
      (match.proposedPlayer1Deaths || 0) === (args.player1Deaths || 0) &&
      (match.proposedPlayer2Deaths || 0) === (args.player2Deaths || 0);

    const headshotsMatch =
      (match.proposedPlayer1Headshots || 0) === (args.player1Headshots || 0) &&
      (match.proposedPlayer2Headshots || 0) === (args.player2Headshots || 0);

    if (!killsMatch || !deathsMatch || !headshotsMatch) {
      // Stats don't match - create dispute
      await ctx.db.patch(args.matchId, {
        status: "disputed",
        disputeReason: "Stats mismatch between players",
      });

      // Create a dispute record
      await ctx.db.insert("disputes", {
        matchId: args.matchId,
        reason: "Stats mismatch",
        evidence: [],
        disputedScore: {
          player1Score: args.player1Kills,
          player2Score: args.player2Kills,
        },
        status: "pending",
        createdAt: Date.now(),
      });

      return {
        success: false,
        message: "Stats mismatch! Match has been flagged for admin review.",
        disputed: true,
      };
    }

    // Stats match - determine winner based on kills
    const winnerId =
      args.player1Kills > args.player2Kills ? match.player1Id : match.player2Id;

    // Update match with final stats
    await ctx.db.patch(args.matchId, {
      player1Kills: args.player1Kills,
      player2Kills: args.player2Kills,
      player1Deaths: args.player1Deaths,
      player2Deaths: args.player2Deaths,
      player1Headshots: args.player1Headshots,
      player2Headshots: args.player2Headshots,
      winnerId,
      winnerMethod: "kills",
      status: "completed",
    });

    // Advance winner to next round if applicable
    if (match.nextMatchId && winnerId) {
      const nextMatch = await ctx.db.get(match.nextMatchId as Id<"matches">);
      if (nextMatch) {
        if (!nextMatch.player1Id) {
          await ctx.db.patch(match.nextMatchId as Id<"matches">, {
            player1Id: winnerId,
          });
        } else if (!nextMatch.player2Id) {
          await ctx.db.patch(match.nextMatchId as Id<"matches">, {
            player2Id: winnerId,
          });
        }
      }
    }

    return {
      success: true,
      message: "Stats confirmed! Match completed.",
      winnerId,
    };
  },
});
