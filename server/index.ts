import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { initializeDatabase } from "./database";
import {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
} from "./routes/auth";
import {
  createReel,
  getReelsByCreator,
  getReelsWithoutFeedback,
  getReelsWithFeedback,
} from "./routes/reels";
import { createFeedback, getFeedbackByReelId } from "./routes/feedback";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://*.netlify.app', 'https://*.netlify.com']
      : ['http://localhost:8080', 'http://localhost:3000'],
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize database lazily for serverless environments
  let dbInitialized = false;
  const ensureDbInitialized = async () => {
    if (!dbInitialized) {
      try {
        await initializeDatabase();
        dbInitialized = true;
      } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
      }
    }
  };

  // Middleware to ensure database is initialized before handling requests
  app.use(async (req, res, next) => {
    try {
      await ensureDbInitialized();
      next();
    } catch (error) {
      console.error('Database initialization failed:', error);
      res.status(500).json({ error: 'Database unavailable' });
    }
  });

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
  app.put("/api/auth/user/:id", updateUserProfile);

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
