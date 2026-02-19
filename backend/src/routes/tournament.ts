import { ConvexHttpClient } from "convex/browser";
import express from "express";

const router = express.Router();
const CONVEX_URL =
  process.env.CONVEX_URL || "https://peaceful-aardvark-549.convex.cloud";
const convexClient = new ConvexHttpClient(CONVEX_URL);

// Get lobby data by tournament ID
router.get("/lobby/:tournamentId", async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { userId } = req.query;

    console.log("🎮 Fetching lobby for tournament:", tournamentId);

    // Get tournament details - use string path instead of api object
    const tournament = await convexClient.query(
      "tournaments:getTournamentById" as any,
      {
        tournamentId,
      },
    );

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: "Tournament not found",
      });
    }

    // Get all players for this tournament
    const players = await convexClient.query(
      "players:getByTournamentId" as any,
      {
        tournamentId,
      },
    );

    // Check if current user is registered
    let isUserRegistered = false;
    if (userId && players) {
      const isRegistered = players.some((p: any) => p.userId === userId);
      isUserRegistered = isRegistered;
    }

    res.json({
      success: true,
      tournament,
      players: players || [],
      isUserRegistered,
      totalPlayers: players?.length || 0,
    });
  } catch (error) {
    console.error("❌ Error fetching lobby data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch lobby data",
    });
  }
});

export default router;
