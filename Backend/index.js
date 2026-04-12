import { scanQueue } from "./queue/scanQueue.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Scan from "./models/ScanModel.js";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import cron from "node-cron";
import cors from "cors";
// 1. IMPORT THE LOGGER AT THE TOP
import logger from "./Middlewares/Logger.js"; 
import scanRoutes from "./Routes/ScanRoutes.js";

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database Connected successfully"))
  .catch((err) => console.log(err));


app.get("/", (req, res) => {
  res.send("🚀 Server is running");
});


// 🚀 QUEUE-BASED SCAN API (FIXED)
app.post("/api/fullscan", async (req, res) => {
  try {
    let { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ message: "Domain required" });
    }


    
    domain = domain
      .toLowerCase()
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "");

    if (domain.includes("/")) {
      domain = domain.split("/")[0];
    }

    
    const job = await scanQueue.add("scan-job", { domain });

    
    res.json({
      message: "Scan started 🚀",
      jobId: job.id,
      domain: domain,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error starting scan" });
  }
});


// 📊 GET ALL HISTORY
app.get("/api/history", async (req, res) => {
  try {
    const data = await Scan.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
});


// 🔍 GET SINGLE SCAN BY DOMAIN (NEW ADD)
app.get("/api/result/:domain", async (req, res) => {
  try {
    const { domain } = req.params;

    const data = await Scan.findOne({ original_domain: domain });

    if (!data) {
      return res.json({
        status: "processing",
      });
    }

    res.json({
      status: "completed",
      data,
    });

  } catch (err) {
    res.status(500).json({ message: "Error fetching result" });
  }
});


// 🔍 GET SINGLE SCAN BY ID (OLD)
app.get("/api/history/:id", async (req, res) => {
  try {
    const data = await Scan.findById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching scan" });
  }
});


// Server start
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
app.use(express.json());
app.use(cors({origin: 'http://127.0.0.1:5500'}));
app.use('/api',scanRoutes);


// 2. LOG THE DATABASE CONNECTION
connectDB();
logger.info("DATABASE: Connection attempt initiated.");

const PORT = process.env.PORT || 4001;

// 3. UPDATE THE SERVER START TO USE LOGGER
app.listen(PORT, () => {
    logger.info(`SERVER: System successfully started on port ${PORT}`);
});

// 4. ADD A TEST TRIGGER FOR THE CRON LOG (Milestone 36)
cron.schedule('* * * * *', () => {
    logger.info("CRON EVENT: Automated system check performed.");
});
//server start
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server connected on ${PORT}`));
