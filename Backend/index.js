import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
dotenv.config();
const app = express();
app.use(cors());
//middleware
app.use(express.json());

//database connection
connectDB();

//server start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server connected on ${PORT}`));
