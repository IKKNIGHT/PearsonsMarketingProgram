import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";

// Enable verbose mode for development
const sqlite = sqlite3.verbose();

// Database connection - use /tmp directory for serverless environments like Netlify
const dbPath =
  process.env.NODE_ENV === "production"
    ? "/tmp/database.sqlite"
    : "./database.sqlite";
const db = new sqlite.Database(dbPath);

// Database interfaces
export interface User {
  id: string;
  username: string;
  name: string;
  password: string;
  type: "creator" | "coach";
  created_at: string;
}

export interface Reel {
  id: string;
  url: string;
  creator_id: string;
  creator_name: string;
  submitted_at: string;
}

export interface Feedback {
  id: string;
  reel_id: string;
  coach_id: string;
  coach_name: string;
  content: string;
  submitted_at: string;
}

export interface ReelWithFeedback extends Reel {
  feedback?: Feedback;
}

// Helper function to promisify database methods
function dbRun(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function dbGet(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    console.log("Initializing database at path:", dbPath);

    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('creator', 'coach')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reels table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS reels (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        creator_name TEXT NOT NULL,
        submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users (id)
      )
    `);

    // Feedback table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        reel_id TEXT NOT NULL,
        coach_id TEXT NOT NULL,
        coach_name TEXT NOT NULL,
        content TEXT NOT NULL,
        submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reel_id) REFERENCES reels (id),
        FOREIGN KEY (coach_id) REFERENCES users (id)
      )
    `);

    console.log("Database initialized successfully at:", dbPath);
  } catch (error) {
    console.error("Error initializing database:", error);
    console.error("Database path was:", dbPath);
    throw error;
  }
}

// Database operations
export const database = {
  // User operations
  async createUser(
    username: string,
    name: string,
    password: string,
    type: "creator" | "coach",
  ): Promise<User> {
    const id = Date.now().toString();
    const created_at = new Date().toISOString();
    const hashedPassword = await bcrypt.hash(password, 10);

    await dbRun(
      "INSERT INTO users (id, username, name, password, type, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, username, name, hashedPassword, type, created_at],
    );

    return { id, username, name, password: hashedPassword, type, created_at };
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const user = (await dbGet("SELECT * FROM users WHERE username = ?", [
      username,
    ])) as User | undefined;

    return user || null;
  },

  async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  },

  async updateUser(
    id: string,
    updates: { username?: string; name?: string; password?: string },
  ): Promise<User> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error("User not found");
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.username !== undefined) {
      // Check if new username is already taken by another user
      const existingUser = await this.getUserByUsername(updates.username);
      if (existingUser && existingUser.id !== id) {
        throw new Error("Username already exists");
      }
      updateFields.push("username = ?");
      updateValues.push(updates.username);
    }

    if (updates.name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(updates.name);
    }

    if (updates.password !== undefined) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      updateFields.push("password = ?");
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return user;
    }

    updateValues.push(id);
    const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;

    await dbRun(sql, updateValues);

    // Return updated user
    const updatedUser = await this.getUserById(id);
    if (!updatedUser) {
      throw new Error("Failed to retrieve updated user");
    }

    return updatedUser;
  },

  async getUserById(id: string): Promise<User | null> {
    const user = (await dbGet("SELECT * FROM users WHERE id = ?", [id])) as
      | User
      | undefined;

    return user || null;
  },

  // Reel operations
  async createReel(
    url: string,
    creatorId: string,
    creatorName: string,
  ): Promise<Reel> {
    const id = Date.now().toString();
    const submitted_at = new Date().toISOString();

    await dbRun(
      "INSERT INTO reels (id, url, creator_id, creator_name, submitted_at) VALUES (?, ?, ?, ?, ?)",
      [id, url, creatorId, creatorName, submitted_at],
    );

    return {
      id,
      url,
      creator_id: creatorId,
      creator_name: creatorName,
      submitted_at,
    };
  },

  async getReelsByCreator(creatorId: string): Promise<ReelWithFeedback[]> {
    const reels = (await dbAll(
      `SELECT r.*, f.id as feedback_id, f.coach_id, f.coach_name, f.content as feedback_content, f.submitted_at as feedback_submitted_at
       FROM reels r
       LEFT JOIN feedback f ON r.id = f.reel_id
       WHERE r.creator_id = ?
       ORDER BY r.submitted_at DESC`,
      [creatorId],
    )) as any[];

    return reels.map((row) => ({
      id: row.id,
      url: row.url,
      creator_id: row.creator_id,
      creator_name: row.creator_name,
      submitted_at: row.submitted_at,
      feedback: row.feedback_id
        ? {
            id: row.feedback_id,
            reel_id: row.id,
            coach_id: row.coach_id,
            coach_name: row.coach_name,
            content: row.feedback_content,
            submitted_at: row.feedback_submitted_at,
          }
        : undefined,
    }));
  },

  async getReelsWithoutFeedback(): Promise<Reel[]> {
    const reels = (await dbAll(
      `SELECT r.* FROM reels r
       LEFT JOIN feedback f ON r.id = f.reel_id
       WHERE f.id IS NULL
       ORDER BY r.submitted_at ASC`,
    )) as Reel[];

    return reels;
  },

  async getReelsWithFeedback(): Promise<ReelWithFeedback[]> {
    const reels = (await dbAll(
      `SELECT r.*, f.id as feedback_id, f.coach_id, f.coach_name, f.content as feedback_content, f.submitted_at as feedback_submitted_at
       FROM reels r
       INNER JOIN feedback f ON r.id = f.reel_id
       ORDER BY f.submitted_at DESC`,
    )) as any[];

    return reels.map((row) => ({
      id: row.id,
      url: row.url,
      creator_id: row.creator_id,
      creator_name: row.creator_name,
      submitted_at: row.submitted_at,
      feedback: {
        id: row.feedback_id,
        reel_id: row.id,
        coach_id: row.coach_id,
        coach_name: row.coach_name,
        content: row.feedback_content,
        submitted_at: row.feedback_submitted_at,
      },
    }));
  },

  // Feedback operations
  async createFeedback(
    reelId: string,
    coachId: string,
    coachName: string,
    content: string,
  ): Promise<Feedback> {
    const id = Date.now().toString();
    const submitted_at = new Date().toISOString();

    await dbRun(
      "INSERT INTO feedback (id, reel_id, coach_id, coach_name, content, submitted_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, reelId, coachId, coachName, content, submitted_at],
    );

    return {
      id,
      reel_id: reelId,
      coach_id: coachId,
      coach_name: coachName,
      content,
      submitted_at,
    };
  },

  async getFeedbackByReelId(reelId: string): Promise<Feedback | null> {
    const feedback = (await dbGet("SELECT * FROM feedback WHERE reel_id = ?", [
      reelId,
    ])) as Feedback | undefined;

    return feedback || null;
  },
};
