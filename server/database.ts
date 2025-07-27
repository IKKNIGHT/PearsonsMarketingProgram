import Database from 'better-sqlite3';
import bcrypt from "bcryptjs";
import path from 'path';

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

// Database connection
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        type TEXT CHECK(type IN ('creator', 'coach')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on username
    db.exec(`CREATE INDEX IF NOT EXISTS idx_username ON users (username)`);

    // Reels table
    db.exec(`
      CREATE TABLE IF NOT EXISTS reels (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        creator_id TEXT NOT NULL,
        creator_name TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create indexes for reels
    db.exec(`CREATE INDEX IF NOT EXISTS idx_creator_id ON reels (creator_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_submitted_at ON reels (submitted_at)`);

    // Feedback table
    db.exec(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        reel_id TEXT NOT NULL,
        coach_id TEXT NOT NULL,
        coach_name TEXT NOT NULL,
        content TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reel_id) REFERENCES reels (id) ON DELETE CASCADE,
        FOREIGN KEY (coach_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE (reel_id)
      )
    `);

    // Create indexes for feedback
    db.exec(`CREATE INDEX IF NOT EXISTS idx_reel_id ON feedback (reel_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_coach_id ON feedback (coach_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_feedback_submitted_at ON feedback (submitted_at)`);

    console.log("SQLite database initialized successfully");
  } catch (error) {
    console.error("Error initializing SQLite database:", error);
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
    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(
      "INSERT INTO users (id, username, name, password, type) VALUES (?, ?, ?, ?, ?)"
    );
    stmt.run(id, username, name, hashedPassword, type);

    const getUserStmt = db.prepare(
      "SELECT id, username, name, password, type, datetime(created_at) as created_at FROM users WHERE id = ?"
    );
    const user = getUserStmt.get(id) as User;

    return user;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const stmt = db.prepare(
      "SELECT id, username, name, password, type, datetime(created_at) as created_at FROM users WHERE username = ?"
    );
    const user = stmt.get(username) as User | undefined;

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
    const stmt = db.prepare(sql);
    stmt.run(...updateValues);

    // Return updated user
    const updatedUser = await this.getUserById(id);
    if (!updatedUser) {
      throw new Error("Failed to retrieve updated user");
    }

    return updatedUser;
  },

  async getUserById(id: string): Promise<User | null> {
    const stmt = db.prepare(
      "SELECT id, username, name, password, type, datetime(created_at) as created_at FROM users WHERE id = ?"
    );
    const user = stmt.get(id) as User | undefined;

    return user || null;
  },

  // Reel operations
  async createReel(
    url: string,
    creatorId: string,
    creatorName: string,
  ): Promise<Reel> {
    const id = Date.now().toString();

    const stmt = db.prepare(
      "INSERT INTO reels (id, url, creator_id, creator_name) VALUES (?, ?, ?, ?)"
    );
    stmt.run(id, url, creatorId, creatorName);

    const getReelStmt = db.prepare(
      "SELECT id, url, creator_id, creator_name, datetime(submitted_at) as submitted_at FROM reels WHERE id = ?"
    );
    const reel = getReelStmt.get(id) as Reel;

    return reel;
  },

  async getReelsByCreator(creatorId: string): Promise<ReelWithFeedback[]> {
    const stmt = db.prepare(`
      SELECT 
        r.id, r.url, r.creator_id, r.creator_name,
        datetime(r.submitted_at) as submitted_at,
        f.id as feedback_id, f.coach_id, f.coach_name, f.content as feedback_content,
        datetime(f.submitted_at) as feedback_submitted_at
       FROM reels r
       LEFT JOIN feedback f ON r.id = f.reel_id
       WHERE r.creator_id = ?
       ORDER BY r.submitted_at DESC
    `);
    
    const rows = stmt.all(creatorId) as any[];

    return rows.map((row: any) => ({
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
    const stmt = db.prepare(`
      SELECT r.id, r.url, r.creator_id, r.creator_name,
             datetime(r.submitted_at) as submitted_at
       FROM reels r
       LEFT JOIN feedback f ON r.id = f.reel_id
       WHERE f.id IS NULL
       ORDER BY r.submitted_at ASC
    `);
    
    const rows = stmt.all() as any[];

    return rows as Reel[];
  },

  async getReelsWithFeedback(): Promise<ReelWithFeedback[]> {
    const stmt = db.prepare(`
      SELECT 
        r.id, r.url, r.creator_id, r.creator_name,
        datetime(r.submitted_at) as submitted_at,
        f.id as feedback_id, f.coach_id, f.coach_name, f.content as feedback_content,
        datetime(f.submitted_at) as feedback_submitted_at
       FROM reels r
       INNER JOIN feedback f ON r.id = f.reel_id
       ORDER BY f.submitted_at DESC
    `);
    
    const rows = stmt.all() as any[];

    return rows.map((row: any) => ({
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

    const stmt = db.prepare(
      "INSERT INTO feedback (id, reel_id, coach_id, coach_name, content) VALUES (?, ?, ?, ?, ?)"
    );
    stmt.run(id, reelId, coachId, coachName, content);

    const getFeedbackStmt = db.prepare(
      "SELECT id, reel_id, coach_id, coach_name, content, datetime(submitted_at) as submitted_at FROM feedback WHERE id = ?"
    );
    const feedback = getFeedbackStmt.get(id) as Feedback;

    return feedback;
  },

  async getFeedbackByReelId(reelId: string): Promise<Feedback | null> {
    const stmt = db.prepare(
      "SELECT id, reel_id, coach_id, coach_name, content, datetime(submitted_at) as submitted_at FROM feedback WHERE reel_id = ?"
    );
    const feedback = stmt.get(reelId) as Feedback | undefined;

    return feedback || null;
  },
};