import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    username: v.string(),
    gamerTag: v.string(),
    balance: v.number(),
    wins: v.number(),
    tournamentsPlayed: v.number(),
    games: v.array(v.string()),
    profileImage: v.optional(v.id("_storage")),
    selectedGames: v.optional(v.array(v.string())),
    createdAt: v.number(),
    totalEarnings: v.optional(v.number()), // Add this line
    bestGame: v.optional(v.string()),
    winRate: v.optional(v.number()),
  }).index("by_email", ["email"]),

  tournaments: defineTable({
    name: v.string(),
    game: v.string(),
    date: v.string(),
    fee: v.number(),
    status: v.optional(v.string()),
    bracketType: v.optional(v.string()),
    maxPlayers: v.optional(v.number()),
    allowSpectators: v.optional(v.boolean()),
    maxSpectators: v.optional(v.number()),
    // Winner tracking fields
    winnerId: v.optional(v.string()),
    winnerName: v.optional(v.string()),
    winnerPrize: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }),

  players: defineTable({
    id: v.string(),
    userId: v.string(),
    name: v.string(),
    tournamentId: v.string(),
    phoneNumber: v.string(),
    amount: v.number(),
    mpesaReceipt: v.string(),
    createdAt: v.string(),
    allowSpectate: v.optional(v.boolean()),
    // Stats tracking fields
    wins: v.optional(v.number()),
    totalEarnings: v.optional(v.number()),
    tournamentsPlayed: v.optional(v.number()),
  }),

  matches: defineTable({
    tournamentId: v.string(),
    round: v.number(),
    matchNumber: v.number(),
    player1Id: v.optional(v.string()),
    player2Id: v.optional(v.string()),
    player1Score: v.optional(v.number()),
    player2Score: v.optional(v.number()),
    player1Kills: v.optional(v.number()),
    player2Kills: v.optional(v.number()),
    player1Deaths: v.optional(v.number()),
    player2Deaths: v.optional(v.number()),
    player1Headshots: v.optional(v.number()),
    player2Headshots: v.optional(v.number()),
    winnerId: v.optional(v.string()),
    winnerMethod: v.optional(v.string()),
    status: v.string(),
    nextMatchId: v.optional(v.id("matches")),
    scheduledTime: v.optional(v.string()),
    gameServerId: v.optional(v.string()),
    streamUrl: v.optional(v.string()),

    // Dual confirmation fields
    player1Confirmed: v.optional(v.boolean()),
    player2Confirmed: v.optional(v.boolean()),
    player1ConfirmedAt: v.optional(v.number()),
    player2ConfirmedAt: v.optional(v.number()),
    proposedPlayer1Score: v.optional(v.number()),
    proposedPlayer2Score: v.optional(v.number()),
    proposedBy: v.optional(v.string()),
    disputeReason: v.optional(v.string()),

    // Proposed stats for shooter games
    proposedPlayer1Kills: v.optional(v.number()),
    proposedPlayer2Kills: v.optional(v.number()),
    proposedPlayer1Deaths: v.optional(v.number()),
    proposedPlayer2Deaths: v.optional(v.number()),
    proposedPlayer1Headshots: v.optional(v.number()),
    proposedPlayer2Headshots: v.optional(v.number()),

    // Match completion fields
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
  }).index("by_tournament", ["tournamentId", "round"]),

  spectators: defineTable({
    matchId: v.id("matches"),
    userId: v.string(),
    joinedAt: v.string(),
    isActive: v.boolean(),
  }).index("by_match", ["matchId"]),

  gameServers: defineTable({
    name: v.string(),
    game: v.string(),
    serverAddress: v.string(),
    apiKey: v.string(),
    maxSpectators: v.number(),
    currentSpectators: v.number(),
    status: v.string(),
  }),

  disputes: defineTable({
    matchId: v.id("matches"),
    reason: v.string(),
    evidence: v.array(v.string()),
    disputedScore: v.object({
      player1Score: v.number(),
      player2Score: v.number(),
    }),
    status: v.string(),
    createdAt: v.number(),
    resolvedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    resolution: v.optional(v.string()),
  }),

  winners: defineTable({
    tournamentId: v.string(),
    tournamentName: v.string(),
    game: v.string(),
    winnerId: v.string(),
    winnerName: v.string(),
    prize: v.number(),
    date: v.string(),
    matchesPlayed: v.number(),
    kills: v.optional(v.number()),
    deaths: v.optional(v.number()),
    headshots: v.optional(v.number()),
    averageScore: v.optional(v.number()),
    winStreak: v.optional(v.number()),
  })
    .index("by_date", ["date"])
    .index("by_game", ["game"]),

  withdrawals: defineTable({
    userId: v.string(),
    userName: v.string(),
    amount: v.number(),
    phoneNumber: v.string(), // M-Pesa phone number
    paymentMethod: v.string(), // 'mpesa', 'bank', etc.
    status: v.string(), // 'pending', 'approved', 'rejected', 'completed'
    tournamentId: v.optional(v.string()),
    tournamentName: v.optional(v.string()),
    requestedAt: v.number(),
    processedAt: v.optional(v.number()),
    processedBy: v.optional(v.string()),
    transactionId: v.optional(v.string()), // M-Pesa transaction ID
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});
