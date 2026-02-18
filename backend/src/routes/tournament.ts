import { ConvexHttpClient } from "convex/browser";
import express from "express";
import { api } from "../../../convex/_generated/api";

const router = express.Router();
const CONVEX_URL = "https://peaceful-aardvark-549.convex.cloud";
const convexClient = new ConvexHttpClient(CONVEX_URL);

// Get lobby data by tournament ID
router.get("/lobby/:tournamentId", async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { userId } = req.query;

    console.log("🎮 Fetching lobby for tournament:", tournamentId);

    // Get tournament details
    const tournament = await convexClient.query(
      api.tournaments.getTournamentById,
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
    const players = await convexClient.query(api.players.getByTournamentId, {
      tournamentId,
    });

    // Check if current user is registered
    let isUserRegistered = false;
    if (userId && players) {
      isUserRegistered = players.some((p) => p.userId === userId);
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
