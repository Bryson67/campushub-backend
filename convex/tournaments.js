"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeTournament = exports.getTopWinners = exports.getWinners = exports.getAllTournaments = exports.getTournamentById = exports.getTournamentBracket = exports.generateBracket = exports.updateMatchScore = exports.createTournament = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
// Get all tournaments - use this for the tournaments page
// Get tournament by ID
// Create a new tournament
exports.createTournament = (0, server_1.mutation)({
    args: {
        name: values_1.v.string(),
        game: values_1.v.string(),
        date: values_1.v.string(),
        fee: values_1.v.number(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const tournamentId = yield ctx.db.insert("tournaments", {
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
    }),
});
// Get tournament bracket
// Update match score
exports.updateMatchScore = (0, server_1.mutation)({
    args: {
        matchId: values_1.v.id("matches"),
        player1Score: values_1.v.number(),
        player2Score: values_1.v.number(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const match = yield ctx.db.get(args.matchId);
        if (!match)
            throw new Error("Match not found");
        const winnerId = args.player1Score > args.player2Score ? match.player1Id : match.player2Id;
        yield ctx.db.patch(args.matchId, {
            player1Score: args.player1Score,
            player2Score: args.player2Score,
            winnerId,
            status: "completed",
        });
        // If there's a next match, advance the winner
        if (match.nextMatchId) {
            const nextMatch = (yield ctx.db.get(match.nextMatchId));
            if (nextMatch) {
                if (!nextMatch.player1Id) {
                    yield ctx.db.patch(match.nextMatchId, {
                        player1Id: winnerId,
                    });
                }
                else {
                    yield ctx.db.patch(match.nextMatchId, {
                        player2Id: winnerId,
                    });
                }
            }
        }
        return { success: true };
    }),
});
// Generate knockout bracket
exports.generateBracket = (0, server_1.mutation)({
    args: {
        tournamentId: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const players = yield ctx.db
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
            const matchId = yield ctx.db.insert("matches", {
                tournamentId: args.tournamentId,
                round: 1,
                matchNumber: i + 1,
                player1Id: (_a = shuffled[i * 2]) === null || _a === void 0 ? void 0 : _a.userId,
                player2Id: (_b = shuffled[i * 2 + 1]) === null || _b === void 0 ? void 0 : _b.userId,
                status: "pending",
            });
            matches.push(matchId);
        }
        // Generate subsequent rounds
        let currentRoundMatches = matches;
        for (let round = 2; round <= rounds; round++) {
            const nextRoundMatches = [];
            for (let i = 0; i < currentRoundMatches.length / 2; i++) {
                const matchId = yield ctx.db.insert("matches", {
                    tournamentId: args.tournamentId,
                    round: round,
                    matchNumber: i + 1,
                    status: "pending",
                });
                nextRoundMatches.push(matchId);
                // Connect previous matches to this one
                if (currentRoundMatches[i * 2]) {
                    yield ctx.db.patch(currentRoundMatches[i * 2], {
                        nextMatchId: matchId,
                    });
                }
                if (currentRoundMatches[i * 2 + 1]) {
                    yield ctx.db.patch(currentRoundMatches[i * 2 + 1], {
                        nextMatchId: matchId,
                    });
                }
            }
            currentRoundMatches = nextRoundMatches;
        }
        return { success: true };
    }),
});
// Get tournament bracket
exports.getTournamentBracket = (0, server_1.query)({
    args: {
        tournamentId: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const matches = yield ctx.db
            .query("matches")
            .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
            .collect();
        // Group matches by round
        const bracket = {};
        matches.forEach((match) => {
            if (!bracket[match.round])
                bracket[match.round] = [];
            bracket[match.round].push(match);
        });
        return bracket;
    }),
});
// Get tournament by ID
exports.getTournamentById = (0, server_1.query)({
    args: {
        tournamentId: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const tournament = yield ctx.db
            .query("tournaments")
            .filter((q) => q.eq(q.field("_id"), args.tournamentId))
            .first();
        return tournament;
    }),
});
// Get all tournaments
exports.getAllTournaments = (0, server_1.query)({
    args: {},
    handler: (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const tournaments = yield ctx.db.query("tournaments").collect();
        return tournaments;
    }),
});
// Get winners list
exports.getWinners = (0, server_1.query)({
    args: {
        game: values_1.v.optional(values_1.v.string()),
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        let query = ctx.db.query("winners");
        if (args.game) {
            query = query.filter((q) => q.eq(q.field("game"), args.game));
        }
        const winners = yield query.order("desc").take(args.limit || 50);
        return winners;
    }),
});
// Get top winners by prize money
exports.getTopWinners = (0, server_1.query)({
    args: {
        limit: values_1.v.optional(values_1.v.number()),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const winners = yield ctx.db
            .query("winners")
            .order("desc")
            .take(args.limit || 10);
        // Sort by prize money
        return winners.sort((a, b) => b.prize - a.prize);
    }),
});
// Complete tournament and record winner
// Complete tournament and record winner
exports.completeTournament = (0, server_1.mutation)({
    args: {
        tournamentId: values_1.v.id("tournaments"),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const tournament = yield ctx.db.get(args.tournamentId);
        if (!tournament)
            throw new Error("Tournament not found");
        // Find the final match
        const matches = yield ctx.db
            .query("matches")
            .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
            .collect();
        const finalRound = Math.max(...matches.map((m) => m.round));
        const finalMatch = matches.find((m) => m.round === finalRound);
        if (!finalMatch || !finalMatch.winnerId) {
            throw new Error("Tournament winner not determined");
        }
        // Get winner details
        const winner = yield ctx.db
            .query("players")
            .filter((q) => q.eq(q.field("userId"), finalMatch.winnerId))
            .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
            .first();
        if (!winner)
            throw new Error("Winner not found in players");
        // Calculate prize money
        const allPlayers = yield ctx.db
            .query("players")
            .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
            .collect();
        const totalPrize = allPlayers.length * tournament.fee;
        // Update tournament
        yield ctx.db.patch(args.tournamentId, {
            winnerId: finalMatch.winnerId,
            winnerName: winner.name,
            winnerPrize: totalPrize,
            completedAt: Date.now(),
            status: "completed",
        });
        // Update winner's balance in users table
        // Update winner's balance in users table
        const user = yield ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), finalMatch.winnerId))
            .first();
        if (user) {
            yield ctx.db.patch(user._id, {
                balance: (user.balance || 0) + totalPrize,
                wins: (user.wins || 0) + 1,
                totalEarnings: (user.totalEarnings || 0) + totalPrize, // Use type assertion
            });
        }
        // Record in winners table
        // ... rest of your existing code ...
    }),
});
