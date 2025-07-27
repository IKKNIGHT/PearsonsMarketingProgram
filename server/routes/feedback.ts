import { RequestHandler } from "express";
import { database } from "../database";

// Create feedback for a reel
export const createFeedback: RequestHandler = async (req, res) => {
  try {
    const { reelId, coachId, coachName, content } = req.body;

    if (!reelId || !coachId || !coachName || !content) {
      return res.status(400).json({
        error: "Reel ID, coach ID, coach name, and content are required",
      });
    }

    // Check if feedback already exists for this reel
    const existingFeedback = await database.getFeedbackByReelId(reelId);
    if (existingFeedback) {
      return res.status(409).json({
        error: "Feedback already exists for this reel",
      });
    }

    const feedback = await database.createFeedback(
      reelId,
      coachId,
      coachName,
      content,
    );
    res.json({ feedback });
  } catch (error) {
    console.error("Create feedback error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get feedback by reel ID
export const getFeedbackByReelId: RequestHandler = async (req, res) => {
  try {
    const { reelId } = req.params;

    if (!reelId) {
      return res.status(400).json({ error: "Reel ID is required" });
    }

    const feedback = await database.getFeedbackByReelId(reelId);
    res.json({ feedback });
  } catch (error) {
    console.error("Get feedback error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
