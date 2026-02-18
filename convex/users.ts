import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Hash password with SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------------- REGISTER ---------------- */

export const register = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) throw new Error("EMAIL_ALREADY_EXISTS");

    const hashedPassword = await hashPassword(args.password);

    await ctx.db.insert("users", {
      username: args.username, // ✅ REQUIRED
      email: args.email,
      password: hashedPassword,
      createdAt: Date.now(),

      balance: 0,
      wins: 0,
      tournamentsPlayed: 0,
      games: [],
      gamerTag: args.username,
    });
  },
});

/* ---------------- LOGIN ---------------- */

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) throw new Error("INVALID_CREDENTIALS");

    const hashed = await hashPassword(args.password);
    if (hashed !== user.password) throw new Error("INVALID_CREDENTIALS");

    return {
      _id: user._id,
      email: user.email,
      username: user.username,
    };
  },
});

/* ---------------- GET USER ---------------- */

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

/* ---------------- UPDATE PROFILE IMAGE ---------------- */

// Get user profile with all stats and tournament history
export const getUserProfile = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) return null;

    // Get all tournaments the user has participated in
    const participations = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    // Get tournament details for each participation
    const tournamentIds = participations.map((p) => p.tournamentId);
    const tournaments = await Promise.all(
      tournamentIds.map(async (id) => {
        const tournament = await ctx.db
          .query("tournaments")
          .filter((q) => q.eq(q.field("_id"), id))
          .first();

        // Find if user won this tournament
        const isWinner = tournament?.winnerId === args.userId;

        return {
          ...tournament,
          participation: participations.find((p) => p.tournamentId === id),
          isWinner,
        };
      }),
    );

    // Get match history
    const matches = await ctx.db
      .query("matches")
      .filter((q) =>
        q.or(
          q.eq(q.field("player1Id"), args.userId),
          q.eq(q.field("player2Id"), args.userId),
        ),
      )
      .collect();

    // Calculate win rate
    const totalMatches = matches.length;
    const wins = matches.filter((m) => m.winnerId === args.userId).length;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    return {
      ...user,
      tournaments: tournaments.filter((t) => t !== null),
      matches: matches,
      stats: {
        totalMatches,
        wins,
        losses: totalMatches - wins,
        winRate: Math.round(winRate),
      },
    };
  },
});

// Update user balance
export const updateUserBalance = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      balance: (user.balance || 0) + args.amount,
      wins: (user.wins || 0) + 1,
      totalEarnings: ((user as any).totalEarnings || 0) + args.amount,
    });

    return { success: true };
  },
});

// Update profile photo (fixed version)
// Update profile photo
export const updateProfilePhoto = mutation({
  args: {
    userId: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    console.log("📸 Updating profile photo for user:", args.userId);
    console.log("📸 Storage ID:", args.storageId);

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) {
      console.error("❌ User not found:", args.userId);
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      profileImage: args.storageId,
    });

    console.log("✅ Profile photo updated successfully");
    return { success: true };
  },
});

// Toggle selected games
export const toggleGame = mutation({
  args: {
    userId: v.string(),
    game: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) throw new Error("User not found");

    const currentGames = user.selectedGames || [];
    const newGames = currentGames.includes(args.game)
      ? currentGames.filter((g) => g !== args.game)
      : [...currentGames, args.game];

    await ctx.db.patch(user._id, {
      selectedGames: newGames,
    });

    return { success: true };
  },
});
