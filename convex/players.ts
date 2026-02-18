import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all players
export const listAllPlayers = query({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("players").collect();
    console.log("📋 Found players:", players.length);
    return players;
  },
});

// Add player mutation
export const addPlayer = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    tournamentId: v.string(),
    phoneNumber: v.string(),
    amount: v.number(),
    mpesaReceipt: v.string(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const playerId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await ctx.db.insert("players", {
      id: playerId,
      userId: args.userId,
      name: args.name,
      tournamentId: args.tournamentId,
      phoneNumber: args.phoneNumber,
      amount: args.amount,
      mpesaReceipt: args.mpesaReceipt,
      createdAt: args.createdAt,
    });

    return { success: true, playerId };
  },
});

// Get players by tournament ID
export const getByTournamentId = query({
  args: {
    tournamentId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("🔍 Looking for players with tournamentId:", args.tournamentId);

    const players = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();

    console.log(`✅ Found ${players.length} players`);
    return players;
  },
});
