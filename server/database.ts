import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

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

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'marketing_program',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database tables
export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Create database if it doesn't exist
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      await connection.execute(`USE ${dbConfig.database}`);

      // Users table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          type ENUM('creator', 'coach') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_username (username)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Reels table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS reels (
          id VARCHAR(255) PRIMARY KEY,
          url TEXT NOT NULL,
          creator_id VARCHAR(255) NOT NULL,
          creator_name VARCHAR(255) NOT NULL,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_creator_id (creator_id),
          INDEX idx_submitted_at (submitted_at),
          FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Feedback table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS feedback (
          id VARCHAR(255) PRIMARY KEY,
          reel_id VARCHAR(255) NOT NULL,
          coach_id VARCHAR(255) NOT NULL,
          coach_name VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_reel_id (reel_id),
          INDEX idx_coach_id (coach_id),
          INDEX idx_submitted_at (submitted_at),
          FOREIGN KEY (reel_id) REFERENCES reels (id) ON DELETE CASCADE,
          FOREIGN KEY (coach_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE KEY unique_reel_feedback (reel_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log("MySQL database initialized successfully");
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error initializing MySQL database:", error);
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
    const connection = await pool.getConnection();
    
    try {
      const id = Date.now().toString();
      const hashedPassword = await bcrypt.hash(password, 10);

      await connection.execute(
        "INSERT INTO users (id, username, name, password, type) VALUES (?, ?, ?, ?, ?)",
        [id, username, name, hashedPassword, type],
      );

      const [rows] = await connection.execute(
        "SELECT id, username, name, password, type, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.%fZ') as created_at FROM users WHERE id = ?",
        [id]
      ) as [any[], any];

      return rows[0] as User;
    } finally {
      connection.release();
    }
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        "SELECT id, username, name, password, type, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.%fZ') as created_at FROM users WHERE username = ?",
        [username]
      ) as [any[], any];

      return rows.length > 0 ? rows[0] as User : null;
    } finally {
      connection.release();
    }
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
    const connection = await pool.getConnection();
    
    try {
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

      await connection.execute(sql, updateValues);

      // Return updated user
      const updatedUser = await this.getUserById(id);
      if (!updatedUser) {
        throw new Error("Failed to retrieve updated user");
      }

      return updatedUser;
    } finally {
      connection.release();
    }
  },

  async getUserById(id: string): Promise<User | null> {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        "SELECT id, username, name, password, type, DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s.%fZ') as created_at FROM users WHERE id = ?",
        [id]
      ) as [any[], any];

      return rows.length > 0 ? rows[0] as User : null;
    } finally {
      connection.release();
    }
  },

  // Reel operations
  async createReel(
    url: string,
    creatorId: string,
    creatorName: string,
  ): Promise<Reel> {
    const connection = await pool.getConnection();
    
    try {
      const id = Date.now().toString();

      await connection.execute(
        "INSERT INTO reels (id, url, creator_id, creator_name) VALUES (?, ?, ?, ?)",
        [id, url, creatorId, creatorName],
      );

      const [rows] = await connection.execute(
        "SELECT id, url, creator_id, creator_name, DATE_FORMAT(submitted_at, '%Y-%m-%dT%H:%i:%s.%fZ') as submitted_at FROM reels WHERE id = ?",
        [id]
      ) as [any[], any];

      return rows[0] as Reel;
    } finally {
      connection.release();
    }
  },

  async getReelsByCreator(creatorId: string): Promise<ReelWithFeedback[]> {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        `SELECT 
          r.id, r.url, r.creator_id, r.creator_name,
          DATE_FORMAT(r.submitted_at, '%Y-%m-%dT%H:%i:%s.%fZ') as submitted_at,
          f.id as feedback_id, f.coach_id, f.coach_name, f.content as feedback_content,
          DATE_FORMAT(f.submitted_at, '%Y-%m-%dT%H:%i:%s.%fZ') as feedback_submitted_at
         FROM reels r
         LEFT JOIN feedback f ON r.id = f.reel_id
         WHERE r.creator_id = ?
         ORDER BY r.submitted_at DESC`,
        [creatorId],
      ) as [any[], any];

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
    } finally {
      connection.release();
    }
  },

  async getReelsWithoutFeedback(): Promise<Reel[]> {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        `SELECT r.id, r.url, r.creator_id, r.creator_name,
                DATE_FORMAT(r.submitted_at, '%Y-%m-%dT%H:%i:%s.%fZ') as submitted_at
         FROM reels r
         LEFT JOIN feedback f ON r.id = f.reel_id
         WHERE f.id IS NULL
         ORDER BY r.submitted_at ASC`,
      ) as [any[], any];

      return rows as Reel[];
    } finally {
      connection.release();
    }
  },

  async getReelsWithFeedback(): Promise<ReelWithFeedback[]> {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        `SELECT 
          r.id, r.url, r.creator_id, r.creator_name,
          DATE_FORMAT(r.submitted_at, '%Y-%m-%dT%H:%i:%s.%fZ') as submitted_at,
          f.id as feedback_id, f.coach_id, f.coach_name, f.content as feedback_content,
          DATE_FORMAT(f.submitted_at, '%Y-%m-%dT%H:%i:%s.%fZ') as feedback_submitted_at
         FROM reels r
         INNER JOIN feedback f ON r.id = f.reel_id
         ORDER BY f.submitted_at DESC`,
      ) as [any[], any];

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
    } finally {
      connection.release();
    }
  },

  // Feedback operations
  async createFeedback(
    reelId: string,
    coachId: string,
    coachName: string,
    content: string,
  ): Promise<Feedback> {
    const connection = await pool.getConnection();
    
    try {
      const id = Date.now().toString();

      await connection.execute(
        "INSERT INTO feedback (id, reel_id, coach_id, coach_name, content) VALUES (?, ?, ?, ?, ?)",
        [id, reelId, coachId, coachName, content],
      );

      const [rows] = await connection.execute(
        "SELECT id, reel_id, coach_id, coach_name, content, DATE_FORMAT(submitted_at, '%Y-%m-%dT%H:%i:%s.%fZ') as submitted_at FROM feedback WHERE id = ?",
        [id]
      ) as [any[], any];

      return rows[0] as Feedback;
    } finally {
      connection.release();
    }
  },

  async getFeedbackByReelId(reelId: string): Promise<Feedback | null> {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute(
        "SELECT id, reel_id, coach_id, coach_name, content, DATE_FORMAT(submitted_at, '%Y-%m-%dT%H:%i:%s.%fZ') as submitted_at FROM feedback WHERE reel_id = ?",
        [reelId]
      ) as [any[], any];

      return rows.length > 0 ? rows[0] as Feedback : null;
    } finally {
      connection.release();
    }
  },
};