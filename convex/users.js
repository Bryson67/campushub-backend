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
exports.toggleGame = exports.updateProfilePhoto = exports.updateUserBalance = exports.getUserProfile = exports.getUserByEmail = exports.login = exports.register = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
// Hash password with SHA-256
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = yield crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    });
}
/* ---------------- REGISTER ---------------- */
exports.register = (0, server_1.mutation)({
    args: {
        username: values_1.v.string(),
        email: values_1.v.string(),
        password: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const existing = yield ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
        if (existing)
            throw new Error("EMAIL_ALREADY_EXISTS");
        const hashedPassword = yield hashPassword(args.password);
        yield ctx.db.insert("users", {
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
    }),
});
/* ---------------- LOGIN ---------------- */
exports.login = (0, server_1.mutation)({
    args: {
        email: values_1.v.string(),
        password: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();
        if (!user)
            throw new Error("INVALID_CREDENTIALS");
        const hashed = yield hashPassword(args.password);
        if (hashed !== user.password)
            throw new Error("INVALID_CREDENTIALS");
        return {
            _id: user._id,
            email: user.email,
            username: user.username,
        };
    }),
});
/* ---------------- GET USER ---------------- */
exports.getUserByEmail = (0, server_1.query)({
    args: { email: values_1.v.string() },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        return ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
    }),
});
/* ---------------- UPDATE PROFILE IMAGE ---------------- */
// Get user profile with all stats and tournament history
exports.getUserProfile = (0, server_1.query)({
    args: {
        userId: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), args.userId))
            .first();
        if (!user)
            return null;
        // Get all tournaments the user has participated in
        const participations = yield ctx.db
            .query("players")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .collect();
        // Get tournament details for each participation
        const tournamentIds = participations.map((p) => p.tournamentId);
        const tournaments = yield Promise.all(tournamentIds.map((id) => __awaiter(void 0, void 0, void 0, function* () {
            const tournament = yield ctx.db
                .query("tournaments")
                .filter((q) => q.eq(q.field("_id"), id))
                .first();
            // Find if user won this tournament
            const isWinner = (tournament === null || tournament === void 0 ? void 0 : tournament.winnerId) === args.userId;
            return Object.assign(Object.assign({}, tournament), { participation: participations.find((p) => p.tournamentId === id), isWinner });
        })));
        // Get match history
        const matches = yield ctx.db
            .query("matches")
            .filter((q) => q.or(q.eq(q.field("player1Id"), args.userId), q.eq(q.field("player2Id"), args.userId)))
            .collect();
        // Calculate win rate
        const totalMatches = matches.length;
        const wins = matches.filter((m) => m.winnerId === args.userId).length;
        const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
        return Object.assign(Object.assign({}, user), { tournaments: tournaments.filter((t) => t !== null), matches: matches, stats: {
                totalMatches,
                wins,
                losses: totalMatches - wins,
                winRate: Math.round(winRate),
            } });
    }),
});
// Update user balance
exports.updateUserBalance = (0, server_1.mutation)({
    args: {
        userId: values_1.v.string(),
        amount: values_1.v.number(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), args.userId))
            .first();
        if (!user)
            throw new Error("User not found");
        yield ctx.db.patch(user._id, {
            balance: (user.balance || 0) + args.amount,
            wins: (user.wins || 0) + 1,
            totalEarnings: (user.totalEarnings || 0) + args.amount,
        });
        return { success: true };
    }),
});
// Update profile photo (fixed version)
// Update profile photo
exports.updateProfilePhoto = (0, server_1.mutation)({
    args: {
        userId: values_1.v.string(),
        storageId: values_1.v.id("_storage"),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("📸 Updating profile photo for user:", args.userId);
        console.log("📸 Storage ID:", args.storageId);
        const user = yield ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), args.userId))
            .first();
        if (!user) {
            console.error("❌ User not found:", args.userId);
            throw new Error("User not found");
        }
        yield ctx.db.patch(user._id, {
            profileImage: args.storageId,
        });
        console.log("✅ Profile photo updated successfully");
        return { success: true };
    }),
});
// Toggle selected games
exports.toggleGame = (0, server_1.mutation)({
    args: {
        userId: values_1.v.string(),
        game: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const user = yield ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), args.userId))
            .first();
        if (!user)
            throw new Error("User not found");
        const currentGames = user.selectedGames || [];
        const newGames = currentGames.includes(args.game)
            ? currentGames.filter((g) => g !== args.game)
            : [...currentGames, args.game];
        yield ctx.db.patch(user._id, {
            selectedGames: newGames,
        });
        return { success: true };
    }),
});
