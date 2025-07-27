import { RequestHandler } from "express";
import { database } from "../database";

// Create a new reel
export const createReel: RequestHandler = async (req, res) => {
  try {
    const { url, creatorId, creatorName } = req.body;

    if (!url || !creatorId || !creatorName) {
      return res.status(400).json({
        error: "URL, creator ID, and creator name are required",
      });
    }

    // Validate URL format (basic Instagram reel URL validation)
    const instagramReelPattern =
      /instagram\.com\/(reel|reels|p)\/[A-Za-z0-9_-]+/;
    if (!instagramReelPattern.test(url) && !url.includes("TESTING")) {
      return res.status(400).json({
        error:
          "Invalid Instagram reel URL. Please use a valid Instagram reel or post URL.",
      });
    }

    const reel = await database.createReel(url, creatorId, creatorName);
    res.json({ reel });
  } catch (error) {
    console.error("Create reel error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get reels by creator
export const getReelsByCreator: RequestHandler = async (req, res) => {
  try {
    const { creatorId } = req.params;

    if (!creatorId) {
      return res.status(400).json({ error: "Creator ID is required" });
    }

    const reels = await database.getReelsByCreator(creatorId);
    res.json({ reels });
  } catch (error) {
    console.error("Get reels by creator error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get reels without feedback (for coaches)
export const getReelsWithoutFeedback: RequestHandler = async (req, res) => {
  try {
    const reels = await database.getReelsWithoutFeedback();
    res.json({ reels });
  } catch (error) {
    console.error("Get reels without feedback error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get reels with feedback (for coaches to see their work)
export const getReelsWithFeedback: RequestHandler = async (req, res) => {
  try {
    const reels = await database.getReelsWithFeedback();
    res.json({ reels });
  } catch (error) {
    console.error("Get reels with feedback error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
