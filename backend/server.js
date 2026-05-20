import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";
import dotenv from "dotenv";
import "./config/db.js"; // Initialize DB connection
import authRouter from "./routes/auth.js";
import roomsRouter from "./routes/rooms.js";
import { Room } from "./models/Room.js";

dotenv.config();

const app = express();
app.use(express.json());

// Manual CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Username");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"]
  }
});

// Mount socket.io instance to req so routers can access it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routers
app.use("/auth", authRouter);
app.use("/rooms", roomsRouter);

app.get("/", (req, res) => {
  res.status(200).json("Collaborative Editor Backend is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ message: "ok", success: true });
});

// Initialize YSocketIO for Yjs CRDT doc syncing
const ySocketIO = new YSocketIO(io);
ySocketIO.initialize();

// Socket.io room presence tracking registered on ySocketIO namespace
ySocketIO.nsp.on("connection", (socket) => {
  const namespaceName = socket.nsp.name;
  const roomId = namespaceName.split("|")[1];
  let joinedUserName = null;

  console.log(`[Socket] Client connected to namespace: ${namespaceName}, Room ID: ${roomId}`);

  socket.on("join-metadata", async ({ userName }) => {
    joinedUserName = userName;
    console.log(`[Socket] User ${userName} joined room ${roomId}`);

    // Set user online in MongoDB / memory
    const room = await Room.setUserOnline(roomId, userName);
    if (room) {
      // Broadcast updated presence to all clients in this namespace
      socket.nsp.emit("room-presence-updated", {
        members: room.members || [],
        onlineUsers: room.onlineUsers || [],
        owner: room.owner
      });
    }

    // Mark existing messages as delivered to this user
    const history = await Room.getChatHistory(roomId);
    let historyChanged = false;
    for (const msg of history) {
      if (msg.sender !== userName && (!msg.deliveredTo || !msg.deliveredTo.includes(userName))) {
        await Room.markMessageStatus(roomId, msg.id, userName, "delivered");
        historyChanged = true;
      }
    }

    // Emit chat history to current socket
    const finalHistory = historyChanged ? await Room.getChatHistory(roomId) : history;
    socket.emit("chat-history", finalHistory);

    if (historyChanged) {
      socket.broadcast.emit("chat-history-updated", finalHistory);
    }

    // Broadcast room status changes globally
    io.emit("rooms-updated");
  });

  socket.on("send-chat-message", async (msgData) => {
    const message = {
      id: msgData.id,
      sender: msgData.sender,
      text: msgData.text || "",
      type: msgData.type || "text",
      image: msgData.image || null,
      timestamp: msgData.timestamp || Date.now(),
      deliveredTo: [msgData.sender],
      readBy: [msgData.sender],
      isDeleted: false
    };

    const room = await Room.findRoom(roomId);
    if (room) {
      const activeUsers = room.onlineUsers || [];
      activeUsers.forEach(user => {
        if (user !== msgData.sender && !message.deliveredTo.includes(user)) {
          message.deliveredTo.push(user);
        }
      });
    }

    await Room.saveChatMessage(roomId, message);
    socket.nsp.emit("chat-message-received", message);
  });

  socket.on("delete-chat-message", async ({ messageId, userName }) => {
    const room = await Room.findRoom(roomId);
    if (room) {
      const history = room.messages || [];
      const msg = history.find(m => m.id === messageId);
      if (msg) {
        const isOwner = room.owner.toLowerCase() === userName.toLowerCase();
        const isSender = msg.sender.toLowerCase() === userName.toLowerCase();
        if (isOwner || isSender) {
          await Room.deleteChatMessage(roomId, messageId);
          socket.nsp.emit("chat-message-deleted", { messageId });
        }
      }
    }
  });

  socket.on("mark-message-read", async ({ messageId, userName }) => {
    await Room.markMessageStatus(roomId, messageId, userName, "read");
    const updatedHistory = await Room.getChatHistory(roomId);
    const updatedMsg = updatedHistory.find(m => m.id === messageId);
    if (updatedMsg) {
      socket.nsp.emit("chat-message-status-updated", {
        messageId,
        deliveredTo: updatedMsg.deliveredTo,
        readBy: updatedMsg.readBy
      });
    }
  });

  socket.on("mark-all-read", async ({ userName }) => {
    await Room.markAllMessagesRead(roomId, userName);
    const finalHistory = await Room.getChatHistory(roomId);
    socket.nsp.emit("chat-history-updated", finalHistory);
  });

  socket.on("disconnect", async () => {
    if (roomId && joinedUserName) {
      console.log(`[Socket] User ${joinedUserName} disconnected from room ${roomId}`);
      const room = await Room.setUserOffline(roomId, joinedUserName);
      if (room) {
        socket.nsp.emit("room-presence-updated", {
          members: room.members || [],
          onlineUsers: room.onlineUsers || [],
          owner: room.owner
        });
      }
      io.emit("rooms-updated");
    }
  });

  socket.on("toggle-room-lock", async ({ isLocked, userName }) => {
    const room = await Room.findRoom(roomId);
    if (room && room.owner.toLowerCase() === userName.toLowerCase()) {
      await Room.setRoomLock(roomId, isLocked);
      io.emit("rooms-updated");
      socket.nsp.emit("room-lock-changed", { isLocked });
    }
  });
}); 

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
