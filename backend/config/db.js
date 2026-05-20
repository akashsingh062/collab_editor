import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isMongoConnected = false;
const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("Connected to MongoDB successfully");
      isMongoConnected = true;
    })
    .catch((err) => {
      console.error("MongoDB connection failed, falling back to in-memory store:", err.message);
    });
} else {
  console.log("MONGO_URI not specified in .env, using in-memory store.");
}

export const getMongoConnectionStatus = () => isMongoConnected;
export default mongoose;
