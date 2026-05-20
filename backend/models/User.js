import mongoose, { getMongoConnectionStatus } from "../config/db.js";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MongoUser = mongoose.model("User", userSchema);

// In-Memory Storage Fallback
let inMemoryUsers = [];

export const User = {
  async findOne({ username }) {
    if (!username) return null;
    const isMongo = getMongoConnectionStatus();
    const queryName = username.toLowerCase().trim();
    if (isMongo) {
      return await MongoUser.findOne({ username: queryName });
    }
    return inMemoryUsers.find((u) => u.username === queryName);
  },

  async create({ username, passwordHash }) {
    const isMongo = getMongoConnectionStatus();
    const cleanName = username.toLowerCase().trim();
    if (isMongo) {
      const newUser = new MongoUser({ username: cleanName, passwordHash });
      return await newUser.save();
    } else {
      const newUser = { username: cleanName, passwordHash, createdAt: new Date() };
      inMemoryUsers.push(newUser);
      return newUser;
    }
  },

  async updateUsername(oldUsername, newUsername) {
    const isMongo = getMongoConnectionStatus();
    const cleanOld = oldUsername.toLowerCase().trim();
    const cleanNew = newUsername.toLowerCase().trim();
    if (isMongo) {
      return await MongoUser.updateOne({ username: cleanOld }, { username: cleanNew });
    } else {
      const user = inMemoryUsers.find((u) => u.username === cleanOld);
      if (user) {
        user.username = cleanNew;
        return user;
      }
      return null;
    }
  }
};
