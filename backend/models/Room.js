import mongoose, { getMongoConnectionStatus } from "../config/db.js";
import bcrypt from "bcryptjs";

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  passwordHash: { type: String, default: null },
  isLocked: { type: Boolean, default: false },
  owner: { type: String, required: true },
  members: [{ type: String }],
  onlineUsers: [{ type: String }],
  messages: [{
    id: { type: String, required: true },
    sender: { type: String, required: true },
    text: { type: String },
    type: { type: String, enum: ["text", "image"], default: "text" },
    image: { type: String },
    timestamp: { type: Number, required: true },
    deliveredTo: [{ type: String }],
    readBy: [{ type: String }],
    isDeleted: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now }
});

const MongoRoom = mongoose.model("Room", roomSchema);

// In-Memory Storage Fallback
let inMemoryRooms = [];

export const Room = {
  async getRooms() {
    const isMongo = getMongoConnectionStatus();
    if (isMongo) {
      return await MongoRoom.find({});
    }
    return inMemoryRooms;
  },

  async findRoom(roomId) {
    const isMongo = getMongoConnectionStatus();
    if (isMongo) {
      return await MongoRoom.findOne({ roomId });
    }
    return inMemoryRooms.find((r) => r.roomId === roomId);
  },

  async createRoom(roomId, password, owner) {
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const isMongo = getMongoConnectionStatus();
    if (isMongo) {
      const newRoom = new MongoRoom({
        roomId,
        passwordHash,
        isLocked: false,
        owner,
        members: [owner],
        onlineUsers: []
      });
      return await newRoom.save();
    } else {
      const newRoom = {
        roomId,
        passwordHash,
        isLocked: false,
        owner,
        members: [owner],
        onlineUsers: [],
        createdAt: new Date()
      };
      inMemoryRooms.push(newRoom);
      return newRoom;
    }
  },

  async deleteRoom(roomId) {
    const isMongo = getMongoConnectionStatus();
    if (isMongo) {
      return await MongoRoom.deleteOne({ roomId });
    } else {
      const initialLength = inMemoryRooms.length;
      inMemoryRooms = inMemoryRooms.filter((r) => r.roomId !== roomId);
      return { deletedCount: initialLength - inMemoryRooms.length };
    }
  },

  async setRoomLock(roomId, isLocked) {
    const isMongo = getMongoConnectionStatus();
    if (isMongo) {
      return await MongoRoom.updateOne({ roomId }, { isLocked });
    } else {
      const room = inMemoryRooms.find((r) => r.roomId === roomId);
      if (room) {
        room.isLocked = isLocked;
      }
    }
  },

  async addUserToMembers(roomId, username) {
    const isMongo = getMongoConnectionStatus();
    if (isMongo) {
      return await MongoRoom.findOneAndUpdate(
        { roomId },
        { $addToSet: { members: username } },
        { new: true }
      );
    } else {
      const room = inMemoryRooms.find((r) => r.roomId === roomId);
      if (room) {
        if (!room.members.includes(username)) {
          room.members.push(username);
        }
        return room;
      }
    }
    return null;
  },

  async setUserOnline(roomId, username) {
    const isMongo = getMongoConnectionStatus();
    if (isMongo) {
      let room = await MongoRoom.findOneAndUpdate(
        { roomId },
        { 
          $addToSet: { 
            onlineUsers: username,
            members: username
          } 
        },
        { new: true }
      );
      if (!room) {
        room = new MongoRoom({
          roomId,
          owner: username,
          members: [username],
          onlineUsers: [username]
        });
        await room.save();
      }
      return room;
    } else {
      let room = inMemoryRooms.find((r) => r.roomId === roomId);
      if (!room) {
        room = {
          roomId,
          owner: username,
          members: [username],
          onlineUsers: [username],
          createdAt: new Date()
        };
        inMemoryRooms.push(room);
        return room;
      }
      if (!room.onlineUsers.includes(username)) {
        room.onlineUsers.push(username);
      }
      if (!room.members.includes(username)) {
        room.members.push(username);
      }
      return room;
    }
  },

  async setUserOffline(roomId, username) {
    const isMongo = getMongoConnectionStatus();
    if (isMongo) {
      return await MongoRoom.findOneAndUpdate(
        { roomId },
        { $pull: { onlineUsers: username } },
        { new: true }
      );
    } else {
      const room = inMemoryRooms.find((r) => r.roomId === roomId);
      if (room) {
        room.onlineUsers = room.onlineUsers.filter((u) => u !== username);
        return room;
      }
    }
    return null;
  },

  async saveChatMessage(roomId, message) {
    const isMongo = getMongoConnectionStatus();
    if (isMongo) {
      return await MongoRoom.findOneAndUpdate(
        { roomId },
        { $push: { messages: message } },
        { new: true }
      );
    } else {
      const room = inMemoryRooms.find((r) => r.roomId === roomId);
      if (room) {
        if (!room.messages) room.messages = [];
        room.messages.push(message);
        return room;
      }
    }
    return null;
  },

  async deleteChatMessage(roomId, messageId) {
    const isMongo = getMongoConnectionStatus();
    if (isMongo) {
      return await MongoRoom.findOneAndUpdate(
        { roomId, "messages.id": messageId },
        { $set: { "messages.$.isDeleted": true } },
        { new: true }
      );
    } else {
      const room = inMemoryRooms.find((r) => r.roomId === roomId);
      if (room && room.messages) {
        const msg = room.messages.find((m) => m.id === messageId);
        if (msg) {
          msg.isDeleted = true;
          return room;
        }
      }
    }
    return null;
  },

  async markMessageStatus(roomId, messageId, username, statusType) {
    const isMongo = getMongoConnectionStatus();
    const updateField = statusType === "read" ? "readBy" : "deliveredTo";
    if (isMongo) {
      return await MongoRoom.findOneAndUpdate(
        { roomId, "messages.id": messageId },
        { $addToSet: { [`messages.$.${updateField}`]: username } },
        { new: true }
      );
    } else {
      const room = inMemoryRooms.find((r) => r.roomId === roomId);
      if (room && room.messages) {
        const msg = room.messages.find((m) => m.id === messageId);
        if (msg) {
          if (!msg[updateField]) msg[updateField] = [];
          if (!msg[updateField].includes(username)) {
            msg[updateField].push(username);
          }
          return room;
        }
      }
    }
    return null;
  },

  async markAllMessagesRead(roomId, username) {
    const isMongo = getMongoConnectionStatus();
    if (isMongo) {
      return await MongoRoom.findOneAndUpdate(
        { roomId },
        { $addToSet: { "messages.$[elem].readBy": username } },
        { 
          arrayFilters: [{ "elem.sender": { $ne: username } }],
          new: true
        }
      );
    } else {
      const room = inMemoryRooms.find((r) => r.roomId === roomId);
      if (room && room.messages) {
        room.messages.forEach((msg) => {
          if (msg.sender !== username) {
            if (!msg.readBy) msg.readBy = [];
            if (!msg.readBy.includes(username)) {
              msg.readBy.push(username);
            }
          }
        });
        return room;
      }
    }
    return null;
  },

  async getChatHistory(roomId) {
    const room = await this.findRoom(roomId);
    return room ? (room.messages || []) : [];
  },

  async renameUserInRooms(oldUsername, newUsername) {
    const isMongo = getMongoConnectionStatus();
    const cleanOld = oldUsername.toLowerCase().trim();
    const newNameClean = newUsername.trim();

    if (isMongo) {
      const rooms = await MongoRoom.find({});
      for (const room of rooms) {
        let changed = false;
        
        if (room.owner && room.owner.toLowerCase() === cleanOld) {
          room.owner = newNameClean;
          changed = true;
        }
        
        if (room.members) {
          const idx = room.members.findIndex(m => m.toLowerCase() === cleanOld);
          if (idx !== -1) {
            room.members[idx] = newNameClean;
            room.markModified("members");
            changed = true;
          }
        }
        
        if (room.onlineUsers) {
          const idx = room.onlineUsers.findIndex(m => m.toLowerCase() === cleanOld);
          if (idx !== -1) {
            room.onlineUsers[idx] = newNameClean;
            room.markModified("onlineUsers");
            changed = true;
          }
        }

        if (room.messages) {
          room.messages.forEach(msg => {
            if (msg.sender.toLowerCase() === cleanOld) {
              msg.sender = newNameClean;
              changed = true;
            }
            if (msg.deliveredTo) {
              const idx = msg.deliveredTo.findIndex(u => u.toLowerCase() === cleanOld);
              if (idx !== -1) {
                msg.deliveredTo[idx] = newNameClean;
              }
            }
            if (msg.readBy) {
              const idx = msg.readBy.findIndex(u => u.toLowerCase() === cleanOld);
              if (idx !== -1) {
                msg.readBy[idx] = newNameClean;
              }
            }
          });
          room.markModified("messages");
        }

        if (changed) {
          await room.save();
        }
      }
    } else {
      // In-Memory
      for (const room of inMemoryRooms) {
        let changed = false;
        if (room.owner && room.owner.toLowerCase() === cleanOld) {
          room.owner = newNameClean;
          changed = true;
        }
        if (room.members) {
          const idx = room.members.findIndex(m => m.toLowerCase() === cleanOld);
          if (idx !== -1) {
            room.members[idx] = newNameClean;
            changed = true;
          }
        }
        if (room.onlineUsers) {
          const idx = room.onlineUsers.findIndex(m => m.toLowerCase() === cleanOld);
          if (idx !== -1) {
            room.onlineUsers[idx] = newNameClean;
            changed = true;
          }
        }
        if (room.messages) {
          room.messages.forEach(msg => {
            if (msg.sender.toLowerCase() === cleanOld) {
              msg.sender = newNameClean;
            }
            if (msg.deliveredTo) {
              const idx = msg.deliveredTo.findIndex(u => u.toLowerCase() === cleanOld);
              if (idx !== -1) {
                msg.deliveredTo[idx] = newNameClean;
              }
            }
            if (msg.readBy) {
              const idx = msg.readBy.findIndex(u => u.toLowerCase() === cleanOld);
              if (idx !== -1) {
                msg.readBy[idx] = newNameClean;
              }
            }
          });
        }
      }
    }
  }
};
