import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Helper function to complete tournament
async function completeTournament(ctx: any, tournamentId: string) {
  console.log("🏆 Completing tournament:", tournamentId);

  const tournament = await ctx.db.get(tournamentId);
  if (!tournament) {
    console.log("❌ Tournament not found");
    return;
  }

  const matches = await ctx.db
    .query("matches")
    .filter((q: any) => q.eq(q.field("tournamentId"), tournamentId))
    .collect();

  const allPlayers = await ctx.db
    .query("players")
    .filter((q: any) => q.eq(q.field("tournamentId"), tournamentId))
    .collect();

  const totalPrize = allPlayers.length * tournament.fee;

  // Prize distribution (70/20/10)
  const prizes = {
    1: Math.round(totalPrize * 0.7),
    2: Math.round(totalPrize * 0.2),
    3: Math.round(totalPrize * 0.1),
  };

  // Find final match (highest round)
  const finalRound = Math.max(...matches.map((m: any) => m.round));
  const finalMatch = matches.find((m: any) => m.round === finalRound);

  if (!finalMatch || !finalMatch.winnerId) {
    console.log("❌ No final match winner found");
    return;
  }

  // Determine 1st, 2nd, and 3rd place
  const firstPlace = finalMatch.winnerId;
  const secondPlace =
    finalMatch.player1Id === firstPlace
      ? finalMatch.player2Id
      : finalMatch.player1Id;

  // Find semi-final losers for 3rd place
  const semiFinalRound = finalRound - 1;
  const semiFinals = matches.filter((m: any) => m.round === semiFinalRound);

  let thirdPlace = null;
  if (semiFinals.length >= 2) {
    const semiFinalLosers = semiFinals.map((m: any) =>
      m.player1Id === m.winnerId ? m.player2Id : m.player1Id,
    );
    thirdPlace = semiFinalLosers[0];
  }

  const placements = [
    { position: 1, playerId: firstPlace, prize: prizes[1] },
    { position: 2, playerId: secondPlace, prize: prizes[2] },
    { position: 3, playerId: thirdPlace, prize: prizes[3] },
  ];

  console.log("🏆 Placements:", placements);

  // Record each placement
  for (const p of placements) {
    if (!p.playerId) continue;

    const player = allPlayers.find((pl: any) => pl.userId === p.playerId);
    if (!player) continue;

    const playerMatches = matches.filter(
      (m: any) => m.player1Id === p.playerId || m.player2Id === p.playerId,
    ).length;

    // Record in winners table
    await ctx.db.insert("winners", {
      tournamentId: tournamentId,
      tournamentName: tournament.name,
      game: tournament.game,
      winnerId: p.playerId,
      winnerName: player.name,
      prize: p.prize,
      date: new Date().toISOString(),
      matchesPlayed: playerMatches,
      position: p.position,
    });

    // Update user balance
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("_id"), p.playerId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        balance: (user.balance || 0) + p.prize,
        totalEarnings: (user.totalEarnings || 0) + p.prize,
      });
      console.log(`💰 Updated balance for ${player.name}: +${p.prize}`);
    }

    // Update player stats
    await ctx.db.patch(player._id, {
      totalEarnings: (player.totalEarnings || 0) + p.prize,
    });
  }

  // Update tournament
  await ctx.db.patch(tournamentId, {
    winnerId: firstPlace,
    winnerName: allPlayers.find((p: any) => p.userId === firstPlace)?.name,
    winnerPrize: prizes[1],
    completedAt: Date.now(),
    status: "completed",
  });

  console.log("✅ Tournament completed successfully");
}

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
    proposedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    console.log("📝 Proposing score:", {
      matchId: args.matchId,
      proposedBy: args.proposedBy,
      player1Score: args.player1Score,
      player2Score: args.player2Score,
    });

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

    console.log("✅ Score proposed successfully for match:", args.matchId);

    return {
      success: true,
      message: "Score proposed. Waiting for opponent confirmation.",
    };
  },
});

// Opponent confirms or disputes the score
// Opponent confirms or disputes the score

export const confirmScore = mutation({
  args: {
    matchId: v.id("matches"),
    player1Score: v.number(),
    player2Score: v.number(),
    confirmedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    console.log("🔍 Confirm score - full match data:", {
      matchId: args.matchId,
      proposedPlayer1Score: match.proposedPlayer1Score,
      proposedPlayer2Score: match.proposedPlayer2Score,
      proposedBy: match.proposedBy,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      confirmedBy: args.confirmedBy,
      argsPlayer1Score: args.player1Score,
      argsPlayer2Score: args.player2Score,
      status: match.status,
    });

    // Check if the confirmer is actually in this match
    if (
      match.player1Id !== args.confirmedBy &&
      match.player2Id !== args.confirmedBy
    ) {
      throw new Error("Only players in this match can confirm scores");
    }

    // FIX: Check if proposed scores exist (allow 0 as valid score)
    const hasProposedScore =
      match.proposedPlayer1Score !== undefined &&
      match.proposedPlayer1Score !== null &&
      match.proposedPlayer2Score !== undefined &&
      match.proposedPlayer2Score !== null;

    if (!hasProposedScore) {
      console.error("❌ No proposed score found for match:", {
        matchId: args.matchId,
        proposedPlayer1Score: match.proposedPlayer1Score,
        proposedPlayer2Score: match.proposedPlayer2Score,
      });
      throw new Error("No score has been proposed yet");
    }

    // Check if the proposed scores match what the opponent is confirming
    const scoresMatch =
      match.proposedPlayer1Score === args.player1Score &&
      match.proposedPlayer2Score === args.player2Score;

    console.log("🔍 Score comparison:", {
      proposedPlayer1Score: match.proposedPlayer1Score,
      argsPlayer1Score: args.player1Score,
      proposedPlayer2Score: match.proposedPlayer2Score,
      argsPlayer2Score: args.player2Score,
      scoresMatch,
    });

    if (!scoresMatch) {
      // Scores don't match - check if a dispute already exists
      console.log("⚠️ Score mismatch, checking for existing dispute");

      // Check if a dispute already exists for this match
      const existingDispute = await ctx.db
        .query("disputes")
        .filter((q) => q.eq(q.field("matchId"), args.matchId))
        .first();

      if (existingDispute) {
        console.log("⚠️ Dispute already exists for this match");
        return {
          success: false,
          message: "A dispute for this match has already been submitted.",
          disputed: true,
        };
      }

      // Update match status
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

    console.log("✅ Scores match, winner:", winnerId);

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

    // Check if this is the final match
    const tournamentMatches = await ctx.db
      .query("matches")
      .filter((q) => q.eq(q.field("tournamentId"), match.tournamentId))
      .collect();

    const finalRound = Math.max(...tournamentMatches.map((m: any) => m.round));

    // If this is the final match, complete the tournament
    if (match.round === finalRound) {
      console.log("🏆 Final match completed, completing tournament");
      await completeTournament(ctx, match.tournamentId);
    }

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
    resolvedBy: v.string(),
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

    // Check if this is the final match
    const tournamentMatches = await ctx.db
      .query("matches")
      .filter((q) => q.eq(q.field("tournamentId"), match.tournamentId))
      .collect();

    const finalRound = Math.max(...tournamentMatches.map((m: any) => m.round));

    // If this is the final match, complete the tournament
    if (match.round === finalRound) {
      await completeTournament(ctx, match.tournamentId);
    }

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

  // FIX: Check for proposed scores properly (allow 0)
  const hasProposedScore =
    match.proposedPlayer1Score !== undefined &&
    match.proposedPlayer1Score !== null &&
    match.proposedPlayer2Score !== undefined &&
    match.proposedPlayer2Score !== null;

  if (hasProposedScore) {
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

    console.log("🎯 Proposing shooter stats:", {
      matchId: args.matchId,
      proposedBy: args.proposedBy,
      player1Kills: args.player1Kills,
      player2Kills: args.player2Kills,
    });

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

    console.log(
      "✅ Shooter stats proposed successfully for match:",
      args.matchId,
    );

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

    console.log("🔍 Confirm shooter stats - full match data:", {
      matchId: args.matchId,
      proposedPlayer1Kills: match.proposedPlayer1Kills,
      proposedPlayer2Kills: match.proposedPlayer2Kills,
      proposedBy: match.proposedBy,
      confirmedBy: args.confirmedBy,
      argsPlayer1Kills: args.player1Kills,
      argsPlayer2Kills: args.player2Kills,
    });

    // Check if the confirmer is actually in this match
    if (
      match.player1Id !== args.confirmedBy &&
      match.player2Id !== args.confirmedBy
    ) {
      throw new Error("Only players in this match can confirm stats");
    }

    // Check if there are proposed stats (allow 0)
    const hasProposedStats =
      match.proposedPlayer1Kills !== undefined &&
      match.proposedPlayer1Kills !== null &&
      match.proposedPlayer2Kills !== undefined &&
      match.proposedPlayer2Kills !== null;

    if (!hasProposedStats) {
      console.error("❌ No proposed stats found for match:", args.matchId);
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

    console.log("🔍 Stats comparison:", {
      killsMatch,
      deathsMatch,
      headshotsMatch,
      proposedKills: `${match.proposedPlayer1Kills}-${match.proposedPlayer2Kills}`,
      argsKills: `${args.player1Kills}-${args.player2Kills}`,
    });

    // In your confirmShooterStats function, replace the dispute creation part with:

    if (!killsMatch || !deathsMatch || !headshotsMatch) {
      // Stats don't match - check if a dispute already exists
      console.log("⚠️ Stats mismatch, checking for existing dispute");

      // Check if a dispute already exists for this match
      const existingDispute = await ctx.db
        .query("disputes")
        .filter((q) => q.eq(q.field("matchId"), args.matchId))
        .first(); // Get any dispute, not just pending

      if (existingDispute) {
        console.log("⚠️ Dispute already exists for this match");
        return {
          success: false,
          message:
            "A dispute for this match has already been submitted and is pending review.",
          disputed: true,
        };
      }

      // Update match status
      await ctx.db.patch(args.matchId, {
        status: "disputed",
        disputeReason: "Stats mismatch between players",
      });

      // Create a new dispute
      await ctx.db.insert("disputes", {
        matchId: args.matchId,
        initiatedBy: args.confirmedBy,
        reason: "Stats mismatch",
        disputedScore: {
          player1Score: args.player1Kills,
          player2Score: args.player2Kills,
        },
        evidence: [],
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

    console.log("✅ Stats match, winner:", winnerId);

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

    // Check if this is the final match
    const tournamentMatches = await ctx.db
      .query("matches")
      .filter((q) => q.eq(q.field("tournamentId"), match.tournamentId))
      .collect();

    const finalRound = Math.max(...tournamentMatches.map((m: any) => m.round));

    // If this is the final match, complete the tournament
    if (match.round === finalRound) {
      console.log("🏆 Final match completed, completing tournament");
      await completeTournament(ctx, match.tournamentId);
    }

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
