import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import scanRoutes from "./Routes/ScanRoutes.js";
dotenv.config();
const app = express();

//middleware
app.use(express.json());
app.use(cors());
app.use("/api", scanRoutes);

//database connection
connectDB();

//server start
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Server connected on ${PORT}`));
