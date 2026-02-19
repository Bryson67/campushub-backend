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
// convex/functions/tournaments/getAll.ts
const server_1 = require("./_generated/server");
exports.default = (0, server_1.query)((_a) => __awaiter(void 0, [_a], void 0, function* ({ db }) {
    const tournaments = yield db.query("tournaments").collect();
    return tournaments.map(t => ({
        id: t._id.toString(),
        name: t.name,
        game: t.game,
        date: t.date,
        fee: t.fee,
    }));
}));
