import { RequestHandler } from "express";
import { database } from "../database";

// Register new user
export const registerUser: RequestHandler = async (req, res) => {
  try {
    const { username, name, password, type } = req.body;

    if (!username || !name || !password || !type || !['creator', 'coach'].includes(type)) {
      return res.status(400).json({
        error: 'Username, name, password, and valid type (creator/coach) are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if username already exists
    const existingUser = await database.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Username already exists' 
      });
    }

    const user = await database.createUser(username, name, password, type);
    
    // Don't return password in response
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
export const loginUser: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Get user by username
    const user = await database.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    // Verify password
    const isValidPassword = await database.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    // Don't return password in response
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user by ID
export const getUserById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await database.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't return password in response
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user profile
export const updateUserProfile: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, name, password, currentPassword } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get current user
    const currentUser = await database.getUserById(id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If updating password, verify current password
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to update password' });
      }

      const isValidCurrentPassword = await database.verifyPassword(currentPassword, currentUser.password);
      if (!isValidCurrentPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }
    }

    // Prepare updates object
    const updates: { username?: string; name?: string; password?: string } = {};

    if (username !== undefined && username.trim() !== currentUser.username) {
      updates.username = username.trim();
    }

    if (name !== undefined && name.trim() !== currentUser.name) {
      updates.name = name.trim();
    }

    if (password) {
      updates.password = password;
    }

    // Update user
    const updatedUser = await database.updateUser(id, updates);

    // Don't return password in response
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({ user: userWithoutPassword });
  } catch (error: any) {
    console.error('Update user error:', error);
    if (error.message === 'Username already exists') {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
