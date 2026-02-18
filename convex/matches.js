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
exports.confirmShooterStats = exports.proposeShooterStats = exports.getMatchWithStatus = exports.resolveDispute = exports.confirmScore = exports.proposeScore = exports.getTournamentMatches = exports.getMatchDetails = exports.updateMatchScore = exports.updateShooterMatch = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
// Update match with kill stats for shooter games
exports.updateShooterMatch = (0, server_1.mutation)({
    args: {
        matchId: values_1.v.id("matches"),
        player1Kills: values_1.v.optional(values_1.v.number()),
        player2Kills: values_1.v.optional(values_1.v.number()),
        player1Deaths: values_1.v.optional(values_1.v.number()),
        player2Deaths: values_1.v.optional(values_1.v.number()),
        player1Headshots: values_1.v.optional(values_1.v.number()),
        player2Headshots: values_1.v.optional(values_1.v.number()),
        winnerMethod: values_1.v.optional(values_1.v.string()),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const match = yield ctx.db.get(args.matchId);
        if (!match)
            throw new Error("Match not found");
        // Calculate winner based on kills (for shooter games)
        const player1Kills = (_b = (_a = args.player1Kills) !== null && _a !== void 0 ? _a : match.player1Kills) !== null && _b !== void 0 ? _b : 0;
        const player2Kills = (_d = (_c = args.player2Kills) !== null && _c !== void 0 ? _c : match.player2Kills) !== null && _d !== void 0 ? _d : 0;
        let winnerId = undefined;
        let winnerMethod = args.winnerMethod || "kills";
        if (winnerMethod === "kills") {
            if (player1Kills > player2Kills)
                winnerId = match.player1Id;
            else if (player2Kills > player1Kills)
                winnerId = match.player2Id;
        }
        else if (winnerMethod === "position") {
            // For battle royale, winner is last standing
            winnerId = match.player1Id; // Placeholder - actual logic depends on game
        }
        // Update match with all stats
        yield ctx.db.patch(args.matchId, {
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
            const nextMatch = yield ctx.db.get(match.nextMatchId);
            if (nextMatch) {
                // Check if player1 slot is empty
                if (!nextMatch.player1Id) {
                    yield ctx.db.patch(match.nextMatchId, {
                        player1Id: winnerId,
                    });
                }
                // Check if player2 slot is empty
                else if (!nextMatch.player2Id) {
                    yield ctx.db.patch(match.nextMatchId, {
                        player2Id: winnerId,
                    });
                }
            }
        }
        return { success: true, winnerId };
    }),
});
// Update regular match with scores (for FIFA, etc.)
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
        if (match.nextMatchId && winnerId) {
            const nextMatch = yield ctx.db.get(match.nextMatchId);
            if (nextMatch) {
                if (!nextMatch.player1Id) {
                    yield ctx.db.patch(match.nextMatchId, {
                        player1Id: winnerId,
                    });
                }
                else if (!nextMatch.player2Id) {
                    yield ctx.db.patch(match.nextMatchId, {
                        player2Id: winnerId,
                    });
                }
            }
        }
        return { success: true };
    }),
});
// Get match details with stats
exports.getMatchDetails = (0, server_1.query)({
    args: {
        matchId: values_1.v.id("matches"),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const match = yield ctx.db.get(args.matchId);
        if (!match)
            return null;
        // Get player details
        const player1 = match.player1Id
            ? yield ctx.db
                .query("players")
                .filter((q) => q.eq(q.field("userId"), match.player1Id))
                .first()
            : null;
        const player2 = match.player2Id
            ? yield ctx.db
                .query("players")
                .filter((q) => q.eq(q.field("userId"), match.player2Id))
                .first()
            : null;
        return Object.assign(Object.assign({}, match), { player1Name: player1 === null || player1 === void 0 ? void 0 : player1.name, player2Name: player2 === null || player2 === void 0 ? void 0 : player2.name });
    }),
});
// Get all matches for a tournament
exports.getTournamentMatches = (0, server_1.query)({
    args: {
        tournamentId: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const matches = yield ctx.db
            .query("matches")
            .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
            .collect();
        return matches;
    }),
});
// Player proposes a score
exports.proposeScore = (0, server_1.mutation)({
    args: {
        matchId: values_1.v.id("matches"),
        player1Score: values_1.v.number(),
        player2Score: values_1.v.number(),
        proposedBy: values_1.v.string(), // User ID of player proposing
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const match = yield ctx.db.get(args.matchId);
        if (!match)
            throw new Error("Match not found");
        // Check if the proposer is actually in this match
        if (match.player1Id !== args.proposedBy &&
            match.player2Id !== args.proposedBy) {
            throw new Error("Only players in this match can propose scores");
        }
        // Update match with proposed score
        yield ctx.db.patch(args.matchId, {
            proposedPlayer1Score: args.player1Score,
            proposedPlayer2Score: args.player2Score,
            proposedBy: args.proposedBy,
            status: "awaiting_confirmation",
        });
        return {
            success: true,
            message: "Score proposed. Waiting for opponent confirmation.",
        };
    }),
});
// Opponent confirms or disputes the score
exports.confirmScore = (0, server_1.mutation)({
    args: {
        matchId: values_1.v.id("matches"),
        player1Score: values_1.v.number(),
        player2Score: values_1.v.number(),
        confirmedBy: values_1.v.string(), // User ID of player confirming
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const match = yield ctx.db.get(args.matchId);
        if (!match)
            throw new Error("Match not found");
        // Check if the confirmer is actually in this match
        if (match.player1Id !== args.confirmedBy &&
            match.player2Id !== args.confirmedBy) {
            throw new Error("Only players in this match can confirm scores");
        }
        // Check if there's a proposed score
        if (!match.proposedPlayer1Score || !match.proposedPlayer2Score) {
            throw new Error("No score has been proposed yet");
        }
        // Check if the proposed scores match what the opponent is confirming
        const scoresMatch = match.proposedPlayer1Score === args.player1Score &&
            match.proposedPlayer2Score === args.player2Score;
        if (!scoresMatch) {
            // Scores don't match - create dispute
            yield ctx.db.patch(args.matchId, {
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
        const winnerId = args.player1Score > args.player2Score ? match.player1Id : match.player2Id;
        // Update match with final scores
        yield ctx.db.patch(args.matchId, {
            player1Score: args.player1Score,
            player2Score: args.player2Score,
            player1Confirmed: match.proposedBy === match.player1Id,
            player2Confirmed: match.proposedBy === match.player2Id,
            player1ConfirmedAt: match.proposedBy === match.player1Id ? Date.now() : undefined,
            player2ConfirmedAt: match.proposedBy === match.player2Id ? Date.now() : undefined,
            winnerId,
            status: "completed",
        });
        // Advance winner to next round if applicable
        if (match.nextMatchId && winnerId) {
            const nextMatch = yield ctx.db.get(match.nextMatchId);
            if (nextMatch) {
                if (!nextMatch.player1Id) {
                    yield ctx.db.patch(match.nextMatchId, {
                        player1Id: winnerId,
                    });
                }
                else if (!nextMatch.player2Id) {
                    yield ctx.db.patch(match.nextMatchId, {
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
    }),
});
// Admin resolves a dispute
exports.resolveDispute = (0, server_1.mutation)({
    args: {
        matchId: values_1.v.id("matches"),
        finalPlayer1Score: values_1.v.number(),
        finalPlayer2Score: values_1.v.number(),
        resolvedBy: values_1.v.string(), // Admin user ID
        resolution: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const match = yield ctx.db.get(args.matchId);
        if (!match)
            throw new Error("Match not found");
        const winnerId = args.finalPlayer1Score > args.finalPlayer2Score
            ? match.player1Id
            : match.player2Id;
        yield ctx.db.patch(args.matchId, {
            player1Score: args.finalPlayer1Score,
            player2Score: args.finalPlayer2Score,
            winnerId,
            status: "completed",
            disputeReason: args.resolution,
        });
        // Advance winner
        if (match.nextMatchId && winnerId) {
            const nextMatch = yield ctx.db.get(match.nextMatchId);
            if (nextMatch) {
                if (!nextMatch.player1Id) {
                    yield ctx.db.patch(match.nextMatchId, {
                        player1Id: winnerId,
                    });
                }
                else if (!nextMatch.player2Id) {
                    yield ctx.db.patch(match.nextMatchId, {
                        player2Id: winnerId,
                    });
                }
            }
        }
        return { success: true };
    }),
});
// Get match with confirmation status
exports.getMatchWithStatus = (0, server_1.query)({
    args: {
        matchId: values_1.v.id("matches"),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const match = yield ctx.db.get(args.matchId);
        if (!match)
            return null;
        // Get player names
        const player1 = match.player1Id
            ? yield ctx.db
                .query("players")
                .filter((q) => q.eq(q.field("userId"), match.player1Id))
                .first()
            : null;
        const player2 = match.player2Id
            ? yield ctx.db
                .query("players")
                .filter((q) => q.eq(q.field("userId"), match.player2Id))
                .first()
            : null;
        return Object.assign(Object.assign({}, match), { player1Name: player1 === null || player1 === void 0 ? void 0 : player1.name, player2Name: player2 === null || player2 === void 0 ? void 0 : player2.name, confirmationStatus: getConfirmationStatus(match) });
    }),
});
function getConfirmationStatus(match) {
    if (match.status === "completed")
        return "COMPLETED";
    if (match.status === "disputed")
        return "DISPUTED";
    if (match.proposedPlayer1Score && match.proposedPlayer2Score) {
        if (match.proposedBy === match.player1Id) {
            return "AWAITING_PLAYER2_CONFIRMATION";
        }
        else {
            return "AWAITING_PLAYER1_CONFIRMATION";
        }
    }
    return "AWAITING_SCORE";
}
// Player proposes kill counts for shooter games
exports.proposeShooterStats = (0, server_1.mutation)({
    args: {
        matchId: values_1.v.id("matches"),
        player1Kills: values_1.v.number(),
        player2Kills: values_1.v.number(),
        player1Deaths: values_1.v.optional(values_1.v.number()),
        player2Deaths: values_1.v.optional(values_1.v.number()),
        player1Headshots: values_1.v.optional(values_1.v.number()),
        player2Headshots: values_1.v.optional(values_1.v.number()),
        proposedBy: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const match = yield ctx.db.get(args.matchId);
        if (!match)
            throw new Error("Match not found");
        // Check if the proposer is actually in this match
        if (match.player1Id !== args.proposedBy &&
            match.player2Id !== args.proposedBy) {
            throw new Error("Only players in this match can propose stats");
        }
        // Update match with proposed stats
        yield ctx.db.patch(args.matchId, {
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
    }),
});
// Opponent confirms or disputes shooter stats
exports.confirmShooterStats = (0, server_1.mutation)({
    args: {
        matchId: values_1.v.id("matches"),
        player1Kills: values_1.v.number(),
        player2Kills: values_1.v.number(),
        player1Deaths: values_1.v.optional(values_1.v.number()),
        player2Deaths: values_1.v.optional(values_1.v.number()),
        player1Headshots: values_1.v.optional(values_1.v.number()),
        player2Headshots: values_1.v.optional(values_1.v.number()),
        confirmedBy: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const match = yield ctx.db.get(args.matchId);
        if (!match)
            throw new Error("Match not found");
        // Check if the confirmer is actually in this match
        if (match.player1Id !== args.confirmedBy &&
            match.player2Id !== args.confirmedBy) {
            throw new Error("Only players in this match can confirm stats");
        }
        // Check if there are proposed stats
        if (match.proposedPlayer1Kills === undefined ||
            match.proposedPlayer2Kills === undefined) {
            throw new Error("No stats have been proposed yet");
        }
        // Check if the proposed stats match what the opponent is confirming
        const killsMatch = match.proposedPlayer1Kills === args.player1Kills &&
            match.proposedPlayer2Kills === args.player2Kills;
        const deathsMatch = (match.proposedPlayer1Deaths || 0) === (args.player1Deaths || 0) &&
            (match.proposedPlayer2Deaths || 0) === (args.player2Deaths || 0);
        const headshotsMatch = (match.proposedPlayer1Headshots || 0) === (args.player1Headshots || 0) &&
            (match.proposedPlayer2Headshots || 0) === (args.player2Headshots || 0);
        if (!killsMatch || !deathsMatch || !headshotsMatch) {
            // Stats don't match - create dispute
            yield ctx.db.patch(args.matchId, {
                status: "disputed",
                disputeReason: "Stats mismatch between players",
            });
            // Create a dispute record
            yield ctx.db.insert("disputes", {
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
        const winnerId = args.player1Kills > args.player2Kills ? match.player1Id : match.player2Id;
        // Update match with final stats
        yield ctx.db.patch(args.matchId, {
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
            const nextMatch = yield ctx.db.get(match.nextMatchId);
            if (nextMatch) {
                if (!nextMatch.player1Id) {
                    yield ctx.db.patch(match.nextMatchId, {
                        player1Id: winnerId,
                    });
                }
                else if (!nextMatch.player2Id) {
                    yield ctx.db.patch(match.nextMatchId, {
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
    }),
});
