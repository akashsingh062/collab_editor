import express from "express";
import bcrypt from "bcryptjs";
import { Room } from "../models/Room.js";

const router = express.Router();

// List all active rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.getRooms();
    const result = rooms.map((r) => ({
      roomId: r.roomId,
      hasPassword: !!r.passwordHash,
      isLocked: r.isLocked,
      owner: r.owner,
      activeCount: r.onlineUsers ? r.onlineUsers.length : 0,
      users: r.onlineUsers || [],
      members: r.members || []
    }));
    res.status(200).json({ rooms: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create room
router.post("/", async (req, res) => {
  try {
    const { roomId, password, owner } = req.body;
    if (!roomId) {
      return res.status(400).json({ error: "Room ID is required" });
    }
    if (!owner) {
      return res.status(400).json({ error: "Room owner is required" });
    }

    const existing = await Room.findRoom(roomId);
    if (existing) {
      return res.status(400).json({ error: "Room already exists" });
    }

    await Room.createRoom(roomId, password, owner);
    res.status(201).json({ message: "Room created successfully", roomId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Authorize user to join room
router.post("/join", async (req, res) => {
  try {
    const { roomId, password, userName } = req.body;
    if (!roomId || !userName) {
      return res.status(400).json({ error: "Room ID and Username are required" });
    }

    const room = await Room.findRoom(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if room is locked
    if (room.isLocked) {
      return res.status(403).json({ error: "This room is locked by the Host" });
    }

    // Check password
    if (room.passwordHash) {
      if (!password) {
        return res.status(401).json({ error: "Password required for this room", passwordRequired: true });
      }
      const match = await bcrypt.compare(password, room.passwordHash);
      if (!match) {
        return res.status(401).json({ error: "Incorrect password" });
      }
    }

    // Add user to the members array in database (if they are authorized)
    await Room.addUserToMembers(roomId, userName);

    res.status(200).json({ success: true, message: "Authorized to join" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete room (restricted to Owner)
router.delete("/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const username = req.headers["x-username"] || req.query.username;

    if (!username) {
      return res.status(400).json({ error: "Requester username is required to verify ownership" });
    }

    const room = await Room.findRoom(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check ownership
    if (room.owner.toLowerCase() !== username.toLowerCase()) {
      return res.status(403).json({ error: "Only the room owner can delete this room" });
    }

    await Room.deleteRoom(roomId);

    // Eject all sockets inside the namespace of this room
    if (req.io) {
      const nsp = req.io.of(`yjs|${roomId}`);
      nsp.emit("room-deleted");
      nsp.disconnectSockets(true);
    }

    res.status(200).json({ message: "Room deleted and clients ejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
