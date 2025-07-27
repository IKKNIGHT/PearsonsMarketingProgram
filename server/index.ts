import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { initializeDatabase } from "./database";
import { registerUser, loginUser, getUserById } from "./routes/auth";
import { createReel, getReelsByCreator, getReelsWithoutFeedback, getReelsWithFeedback } from "./routes/reels";
import { createFeedback, getFeedbackByReelId } from "./routes/feedback";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize database
  initializeDatabase().catch(console.error);

  // Existing API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/register", registerUser);
  app.post("/api/auth/login", loginUser);
  app.get("/api/auth/user/:id", getUserById);

  // Reel routes
  app.post("/api/reels", createReel);
  app.get("/api/reels/creator/:creatorId", getReelsByCreator);
  app.get("/api/reels/pending", getReelsWithoutFeedback);
  app.get("/api/reels/reviewed", getReelsWithFeedback);

  // Feedback routes
  app.post("/api/feedback", createFeedback);
  app.get("/api/feedback/reel/:reelId", getFeedbackByReelId);

  return app;
}
