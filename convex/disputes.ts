import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createDispute = mutation({
  args: {
    matchId: v.id("matches"),
    initiatedBy: v.string(),
    reason: v.string(),
    player1Screenshot: v.optional(v.id("_storage")),
    player2Screenshot: v.optional(v.id("_storage")),
    disputedScore: v.object({
      player1Score: v.number(),
      player2Score: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Match not found");

    // Check if ANY dispute already exists for this match (not just pending)
    const existingDispute = await ctx.db
      .query("disputes")
      .filter((q) => q.eq(q.field("matchId"), args.matchId))
      .first();

    if (existingDispute) {
      return {
        success: false,
        message: "A dispute for this match is already pending review.",
        disputeId: existingDispute._id,
      };
    }

    // Create the dispute
    const disputeId = await ctx.db.insert("disputes", {
      matchId: args.matchId,
      initiatedBy: args.initiatedBy,
      reason: args.reason,
      disputedScore: args.disputedScore,
      evidence: [],
      status: "pending",
      createdAt: Date.now(),
      player1Screenshot: args.player1Screenshot,
      player2Screenshot: args.player2Screenshot,
    });

    return { success: true, disputeId };
  },
});

// Get dispute by match ID
export const getDisputeByMatch = query({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db
      .query("disputes")
      .filter((q) => q.eq(q.field("matchId"), args.matchId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    return dispute;
  },
});

// Get all pending disputes (for admin)
export const getPendingDisputes = query({
  args: {},
  handler: async (ctx) => {
    const disputes = await ctx.db
      .query("disputes")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .collect();

    return disputes;
  },
});

// Resolve dispute (admin only)
export const resolveDispute = mutation({
  args: {
    disputeId: v.id("disputes"),
    resolution: v.string(),
    finalPlayer1Score: v.number(),
    finalPlayer2Score: v.number(),
    resolvedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute not found");

    const match = await ctx.db.get(dispute.matchId);
    if (!match) throw new Error("Match not found");

    const winnerId =
      args.finalPlayer1Score > args.finalPlayer2Score
        ? match.player1Id
        : match.player2Id;

    // Update match with final scores
    await ctx.db.patch(dispute.matchId, {
      player1Score: args.finalPlayer1Score,
      player2Score: args.finalPlayer2Score,
      winnerId,
      status: "completed",
      disputeReason: args.resolution,
    });

    // Update dispute
    await ctx.db.patch(args.disputeId, {
      status: "resolved",
      resolvedAt: Date.now(),
      resolvedBy: args.resolvedBy,
      resolution: args.resolution,
    });

    return { success: true };
  },
});
// Get dispute with screenshot URL
export const getDisputeWithScreenshot = query({
  args: {
    disputeId: v.id("disputes"),
  },
  handler: async (ctx, args) => {
    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) return null;

    // Get screenshot URL if it exists
    let screenshotUrl = null;
    if (dispute.player1Screenshot) {
      screenshotUrl = await ctx.storage.getUrl(dispute.player1Screenshot);
    } else if (dispute.player2Screenshot) {
      screenshotUrl = await ctx.storage.getUrl(dispute.player2Screenshot);
    }

    return {
      ...dispute,
      screenshotUrl,
    };
  },
});

// Get all pending disputes with screenshots (for admin)
export const getPendingDisputesWithScreenshots = query({
  args: {},
  handler: async (ctx) => {
    const disputes = await ctx.db
      .query("disputes")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .collect();

    // Get screenshot URLs for each dispute
    const disputesWithUrls = await Promise.all(
      disputes.map(async (dispute) => {
        let screenshotUrl = null;
        if (dispute.player1Screenshot) {
          screenshotUrl = await ctx.storage.getUrl(dispute.player1Screenshot);
        } else if (dispute.player2Screenshot) {
          screenshotUrl = await ctx.storage.getUrl(dispute.player2Screenshot);
        }

        return {
          ...dispute,
          screenshotUrl,
        };
      }),
    );

    return disputesWithUrls;
  },
});
// Add this at the bottom of your convex/disputes.ts file

// Verify storage - helps debug if images are actually stored
export const verifyStorage = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    try {
      const url = await ctx.storage.getUrl(args.storageId);
      console.log("🔍 Storage URL for", args.storageId, ":", url);
      return {
        exists: !!url,
        url,
        storageId: args.storageId,
      };
    } catch (error) {
      console.error("Error getting storage URL:", error);
      return {
        exists: false,
        error: String(error),
        storageId: args.storageId,
      };
    }
  },
});

// Get image URL from storage ID

export const getImageUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    try {
      const url = await ctx.storage.getUrl(args.storageId);
      console.log("🔍 Generated image URL:", url);
      return {
        success: true,
        url,
        storageId: args.storageId,
      };
    } catch (error) {
      console.error("❌ Error getting image URL:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  },
});
// Add this to your convex/disputes.ts

// List all files in storage with their metadata
export const listAllFiles = query({
  args: {},
  handler: async (ctx) => {
    // Query the system table that stores all file metadata [citation:3]
    const files = await ctx.db.system.query("_storage").collect();

    // For each file, generate a viewable URL
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const url = await ctx.storage.getUrl(file._id);
        return {
          ...file,
          url, // Add the viewable URL
        };
      }),
    );

    console.log(`📁 Found ${filesWithUrls.length} files in storage`);
    return filesWithUrls;
  },
});

// Get a specific file's metadata and URL
export const getFileInfo = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.system.get("_storage", args.storageId);
    if (!file) return null;

    const url = await ctx.storage.getUrl(args.storageId);
    return {
      ...file,
      url,
    };
  },
});
