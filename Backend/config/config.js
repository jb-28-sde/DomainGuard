import dotenv from "dotenv";
dotenv.config();
const config = { MONGODB_URI: process.env.MONGO_URI };

export default config;
