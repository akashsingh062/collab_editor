import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

const router = express.Router();

// User Signup
router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and Password are required" });
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters long" });
    }

    // Check if user already exists
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Save user
    await User.create({ username: cleanUsername, passwordHash });

    res.status(201).json({ message: "Registration successful", username: cleanUsername.toLowerCase() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and Password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Username
router.post("/update-username", async (req, res) => {
  try {
    const { oldUsername, newUsername } = req.body;
    if (!oldUsername || !newUsername) {
      return res.status(400).json({ error: "Old and New usernames are required" });
    }

    const cleanNewUsername = newUsername.trim().toLowerCase();
    const cleanOldUsername = oldUsername.trim().toLowerCase();

    if (newUsername.trim().length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters long" });
    }

    if (!/^[a-zA-Z_]+$/.test(newUsername.trim())) {
      return res.status(400).json({ error: "Username can only contain letters and underscores" });
    }

    // Check if new username is already taken (excluding self check)
    if (cleanNewUsername !== cleanOldUsername) {
      const existing = await User.findOne({ username: cleanNewUsername });
      if (existing) {
        return res.status(400).json({ error: "Username is already taken" });
      }
    }

    // Update in User model
    await User.updateUsername(oldUsername, newUsername);

    // Update in Room model (propagate changes to owner, members, online, and chat messages)
    const { Room } = await import("../models/Room.js");
    await Room.renameUserInRooms(oldUsername, newUsername);

    res.status(200).json({ message: "Username updated successfully", username: newUsername.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
