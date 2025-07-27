import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

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

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!, // Use service role key if available
  {
    auth: {
      persistSession: false // Important for server-side usage
    },
    db: {
      schema: 'public'
    }
  }
);

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Users table
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          password TEXT NOT NULL,
          type TEXT CHECK(type IN ('creator', 'coach')) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `
    });

    if (usersError) {
      console.log('Users table might already exist or need manual creation');
    }

    // Create index on username
    const { error: usernameIndexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_username ON users (username)`
    });

    // Reels table
    const { error: reelsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS reels (
          id TEXT PRIMARY KEY,
          url TEXT NOT NULL,
          creator_id TEXT NOT NULL,
          creator_name TEXT NOT NULL,
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (creator_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `
    });

    if (reelsError) {
      console.log('Reels table might already exist or need manual creation');
    }

    // Create indexes for reels
    const { error: creatorIndexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_creator_id ON reels (creator_id)`
    });

    const { error: submittedIndexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_submitted_at ON reels (submitted_at)`
    });

    // Feedback table
    const { error: feedbackError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS feedback (
          id TEXT PRIMARY KEY,
          reel_id TEXT NOT NULL,
          coach_id TEXT NOT NULL,
          coach_name TEXT NOT NULL,
          content TEXT NOT NULL,
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (reel_id) REFERENCES reels (id) ON DELETE CASCADE,
          FOREIGN KEY (coach_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE (reel_id)
        )
      `
    });

    if (feedbackError) {
      console.log('Feedback table might already exist or need manual creation');
    }

    // Create indexes for feedback
    const { error: reelIndexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_reel_id ON feedback (reel_id)`
    });

    const { error: coachIndexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_coach_id ON feedback (coach_id)`
    });

    const { error: feedbackSubmittedIndexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_feedback_submitted_at ON feedback (submitted_at)`
    });

    console.log("Supabase database initialized successfully");
  } catch (error) {
    console.error("Error initializing Supabase database:", error);
    // Don't throw error as tables might already exist
    console.log("Tables may need to be created manually in Supabase dashboard");
  }
}

// Database operations using Supabase client
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
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        id,
        username,
        name,
        password: hashedPassword,
        type
      })
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    return data;
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

    const updateData: any = {};
    if (updates.username !== undefined) {
      // Check if new username is already taken by another user
      const existingUser = await this.getUserByUsername(updates.username);
      if (existingUser && existingUser.id !== id) {
        throw new Error("Username already exists");
      }
      updateData.username = updates.username;
    }

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }

    if (updates.password !== undefined) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      updateData.password = hashedPassword;
    }

    if (Object.keys(updateData).length === 0) {
      return user;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Reel operations
  async createReel(
    url: string,
    creatorId: string,
    creatorName: string,
  ): Promise<Reel> {
    const id = Date.now().toString();

    const { data, error } = await supabase
      .from('reels')
      .insert({
        id,
        url,
        creator_id: creatorId,
        creator_name: creatorName
      })
      .select()
      .single();

    if (error) throw error;
    return data as Reel;
  },

  // Debug method to get all reels
  async getAllReels(): Promise<Reel[]> {
    console.log('Getting ALL reels...');
    
    const { data, error } = await supabase
      .from('reels')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Get all reels error:', error);
      throw error;
    }

    console.log('All reels in database:', data);
    return data || [];
  },

  async getReelsByCreator(creatorId: string): Promise<ReelWithFeedback[]> {
    console.log('Getting reels for creator:', creatorId);
    
    const { data, error } = await supabase
      .from('reels')
      .select(`
        *,
        feedback (*)
      `)
      .eq('creator_id', creatorId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Get reels by creator error:', error);
      throw error;
    }

    console.log('Raw data from getReelsByCreator:', data);
    
    const result = data?.map((row: any) => ({
      id: row.id,
      url: row.url,
      creator_id: row.creator_id,
      creator_name: row.creator_name,
      submitted_at: row.submitted_at,
      feedback: row.feedback || undefined, // Use the object directly, not array[0]
    })) || [];
    
    console.log('Processed reels for creator:', result);
    return result;
  },

  async getReelsWithoutFeedback(): Promise<Reel[]> {
    console.log('Getting reels without feedback...');
    
    // Get all reels and filter out those that have feedback
    const { data, error } = await supabase
      .from('reels')
      .select(`
        *,
        feedback (*)
      `)
      .order('submitted_at', { ascending: true });

    if (error) {
      console.error("Get reels without feedback error:", error);
      throw error;
    }

    console.log('Raw data from getReelsWithoutFeedback:', data);

    // Filter out reels that have feedback
    const result = (data || [])
      .filter((reel: any) => {
        // Check if feedback exists (Supabase returns object, not array for single relationships)
        const hasFeedback = reel.feedback && reel.feedback.id;
        console.log(`Reel ${reel.id} has feedback:`, hasFeedback, reel.feedback);
        return !hasFeedback;
      })
      .map((reel: any) => ({
        id: reel.id,
        url: reel.url,
        creator_id: reel.creator_id,
        creator_name: reel.creator_name,
        submitted_at: reel.submitted_at,
      }));
      
    console.log('Filtered reels without feedback:', result);
    return result;
  },

  async getReelsWithFeedback(): Promise<ReelWithFeedback[]> {
    console.log('Getting reels with feedback...');
    
    // Get all reels and filter those that have feedback
    const { data, error } = await supabase
      .from('reels')
      .select(`
        *,
        feedback (*)
      `)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error("Get reels with feedback error:", error);
      throw error;
    }

    console.log('Raw data from getReelsWithFeedback:', data);

    // Filter reels that have feedback and sort by feedback date
    const result = (data || [])
      .filter((reel: any) => {
        // Check if feedback exists (Supabase returns object, not array for single relationships)
        const hasFeedback = reel.feedback && reel.feedback.id;
        console.log(`Reel ${reel.id} has feedback:`, hasFeedback, reel.feedback);
        return hasFeedback;
      })
      .map((row: any) => ({
        id: row.id,
        url: row.url,
        creator_id: row.creator_id,
        creator_name: row.creator_name,
        submitted_at: row.submitted_at,
        feedback: row.feedback, // Use the object directly, not array[0]
      }))
      .sort((a, b) => {
        const aDate = a.feedback?.submitted_at || '';
        const bDate = b.feedback?.submitted_at || '';
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
      
    console.log('Filtered reels with feedback:', result);
    return result;
  },

  // Feedback operations
  async createFeedback(
    reelId: string,
    coachId: string,
    coachName: string,
    content: string,
  ): Promise<Feedback> {
    console.log('Creating feedback with:', { reelId, coachId, coachName, content });
    
    try {
      const id = Date.now().toString();
  
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          id,
          reel_id: reelId,
          coach_id: coachId,
          coach_name: coachName,
          content
        })
        .select()
        .single();
  
      if (error) {
        console.error('Feedback creation failed:', error);
        throw error;
      }
  
      console.log('Feedback created successfully:', data);
      
      // Add a small delay to ensure the transaction is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return data as Feedback;
    } catch (err) {
      console.error('Unexpected error in createFeedback:', err);
      throw err;
    }
  },

  async getFeedbackByReelId(reelId: string): Promise<Feedback | null> {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('reel_id', reelId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};