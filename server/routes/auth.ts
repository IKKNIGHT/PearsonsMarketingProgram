import { RequestHandler } from "express";
import { database } from "../database";

// Login/Register user
export const loginUser: RequestHandler = async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type || !['creator', 'coach'].includes(type)) {
      return res.status(400).json({ 
        error: 'Name and valid type (creator/coach) are required' 
      });
    }

    // Check if user already exists
    let user = await database.getUserByNameAndType(name, type);
    
    // If user doesn't exist, create new user
    if (!user) {
      user = await database.createUser(name, type);
    }

    res.json({ user });
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

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
