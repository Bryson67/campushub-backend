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
const server_1 = require("convex/server");
const api_1 = require("./_generated/api");
const server_2 = require("./_generated/server");
const http = (0, server_1.httpRouter)();
http.route({
    path: "/add-player",
    method: "POST",
    handler: (0, server_2.httpAction)((ctx, request) => __awaiter(void 0, void 0, void 0, function* () {
        const { userId, tournamentId, username, phoneNumber, amount, mpesaReceipt, } = yield request.json();
        yield ctx.runMutation(api_1.api.players.addPlayer, {
            userId,
            tournamentId,
            name: username,
            phoneNumber,
            amount: Number(amount),
            mpesaReceipt,
            createdAt: new Date().toISOString(),
        });
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    })),
});
exports.default = http;
