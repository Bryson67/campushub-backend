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
exports.getByTournamentId = exports.addPlayer = exports.listAllPlayers = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
// List all players
exports.listAllPlayers = (0, server_1.query)({
    args: {},
    handler: (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const players = yield ctx.db.query("players").collect();
        console.log("📋 Found players:", players.length);
        return players;
    }),
});
// Add player mutation
exports.addPlayer = (0, server_1.mutation)({
    args: {
        userId: values_1.v.string(),
        name: values_1.v.string(),
        tournamentId: values_1.v.string(),
        phoneNumber: values_1.v.string(),
        amount: values_1.v.number(),
        mpesaReceipt: values_1.v.string(),
        createdAt: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const playerId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        yield ctx.db.insert("players", {
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
    }),
});
// Get players by tournament ID
exports.getByTournamentId = (0, server_1.query)({
    args: {
        tournamentId: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("🔍 Looking for players with tournamentId:", args.tournamentId);
        const players = yield ctx.db
            .query("players")
            .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
            .collect();
        console.log(`✅ Found ${players.length} players`);
        return players;
    }),
});
