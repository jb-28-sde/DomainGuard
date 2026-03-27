import mongoose from "mongoose";
import config from "../config/config.js";

const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log("Database Connected successfully");
  } catch (error) {
    console.log("Database error", error.message);
  }
};
export default connectDB;
