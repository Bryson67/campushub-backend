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
exports.rejectWithdrawal = exports.approveWithdrawal = exports.getPendingWithdrawals = exports.getUserWithdrawals = exports.requestWithdrawal = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
// Request a withdrawal
exports.requestWithdrawal = (0, server_1.mutation)({
    args: {
        userId: values_1.v.string(),
        userName: values_1.v.string(),
        amount: values_1.v.number(),
        phoneNumber: values_1.v.string(),
        paymentMethod: values_1.v.string(),
        tournamentId: values_1.v.optional(values_1.v.string()),
        tournamentName: values_1.v.optional(values_1.v.string()),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        // Check if user has sufficient balance
        const user = yield ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), args.userId))
            .first();
        if (!user)
            throw new Error("User not found");
        if ((user.balance || 0) < args.amount) {
            throw new Error("Insufficient balance");
        }
        // Create withdrawal request
        const withdrawalId = yield ctx.db.insert("withdrawals", {
            userId: args.userId,
            userName: args.userName,
            amount: args.amount,
            phoneNumber: args.phoneNumber,
            paymentMethod: args.paymentMethod,
            tournamentId: args.tournamentId,
            tournamentName: args.tournamentName,
            status: "pending",
            requestedAt: Date.now(),
        });
        // Optional: Deduct from balance immediately or keep until approved
        // await ctx.db.patch(user._id, {
        //   balance: (user.balance || 0) - args.amount,
        // });
        return {
            success: true,
            withdrawalId,
            message: "Withdrawal request submitted successfully",
        };
    }),
});
// Get user's withdrawal history
exports.getUserWithdrawals = (0, server_1.query)({
    args: {
        userId: values_1.v.string(),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const withdrawals = yield ctx.db
            .query("withdrawals")
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .order("desc")
            .collect();
        return withdrawals;
    }),
});
// Admin: Get all pending withdrawals
exports.getPendingWithdrawals = (0, server_1.query)({
    args: {},
    handler: (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const withdrawals = yield ctx.db
            .query("withdrawals")
            .filter((q) => q.eq(q.field("status"), "pending"))
            .order("desc")
            .collect();
        return withdrawals;
    }),
});
// Admin: Approve withdrawal
exports.approveWithdrawal = (0, server_1.mutation)({
    args: {
        withdrawalId: values_1.v.id("withdrawals"),
        processedBy: values_1.v.string(),
        transactionId: values_1.v.optional(values_1.v.string()),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        const withdrawal = yield ctx.db.get(args.withdrawalId);
        if (!withdrawal)
            throw new Error("Withdrawal not found");
        // Get user
        const user = yield ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("_id"), withdrawal.userId))
            .first();
        if (!user)
            throw new Error("User not found");
        // Deduct from balance
        yield ctx.db.patch(user._id, {
            balance: (user.balance || 0) - withdrawal.amount,
        });
        // Update withdrawal status
        yield ctx.db.patch(args.withdrawalId, {
            status: "approved",
            processedAt: Date.now(),
            processedBy: args.processedBy,
            transactionId: args.transactionId,
        });
        // Here you would integrate with M-Pesa to send money
        // await sendMpesaPayment(withdrawal.phoneNumber, withdrawal.amount);
        return { success: true };
    }),
});
// Admin: Reject withdrawal
exports.rejectWithdrawal = (0, server_1.mutation)({
    args: {
        withdrawalId: values_1.v.id("withdrawals"),
        processedBy: values_1.v.string(),
        notes: values_1.v.optional(values_1.v.string()),
    },
    handler: (ctx, args) => __awaiter(void 0, void 0, void 0, function* () {
        yield ctx.db.patch(args.withdrawalId, {
            status: "rejected",
            processedAt: Date.now(),
            processedBy: args.processedBy,
            notes: args.notes,
        });
        return { success: true };
    }),
});
