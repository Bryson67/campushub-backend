import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Request a withdrawal
export const requestWithdrawal = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    amount: v.number(),
    phoneNumber: v.string(),
    paymentMethod: v.string(),
    tournamentId: v.optional(v.string()),
    tournamentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user has sufficient balance
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) throw new Error("User not found");

    if ((user.balance || 0) < args.amount) {
      throw new Error("Insufficient balance");
    }

    // Create withdrawal request
    const withdrawalId = await ctx.db.insert("withdrawals", {
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
  },
});

// Get user's withdrawal history
export const getUserWithdrawals = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const withdrawals = await ctx.db
      .query("withdrawals")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();

    return withdrawals;
  },
});

// Admin: Get all pending withdrawals
export const getPendingWithdrawals = query({
  args: {},
  handler: async (ctx) => {
    const withdrawals = await ctx.db
      .query("withdrawals")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .collect();

    return withdrawals;
  },
});

// Admin: Approve withdrawal
export const approveWithdrawal = mutation({
  args: {
    withdrawalId: v.id("withdrawals"),
    processedBy: v.string(),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const withdrawal = await ctx.db.get(args.withdrawalId);
    if (!withdrawal) throw new Error("Withdrawal not found");

    // Get user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), withdrawal.userId))
      .first();

    if (!user) throw new Error("User not found");

    // Deduct from balance
    await ctx.db.patch(user._id, {
      balance: (user.balance || 0) - withdrawal.amount,
    });

    // Update withdrawal status
    await ctx.db.patch(args.withdrawalId, {
      status: "approved",
      processedAt: Date.now(),
      processedBy: args.processedBy,
      transactionId: args.transactionId,
    });

    // Here you would integrate with M-Pesa to send money
    // await sendMpesaPayment(withdrawal.phoneNumber, withdrawal.amount);

    return { success: true };
  },
});

// Admin: Reject withdrawal
export const rejectWithdrawal = mutation({
  args: {
    withdrawalId: v.id("withdrawals"),
    processedBy: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.withdrawalId, {
      status: "rejected",
      processedAt: Date.now(),
      processedBy: args.processedBy,
      notes: args.notes,
    });

    return { success: true };
  },
});
