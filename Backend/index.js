import { scanQueue } from "./queue/scanQueue.js"; // ✅ FIXED IMPORT
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Scan from "./models/ScanModel.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database Connected successfully"))
  .catch((err) => console.log(err));

// Test route
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

    // ✅ Clean domain
    domain = domain
      .toLowerCase()
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "");

    if (domain.includes("/")) {
      domain = domain.split("/")[0];
    }

    // ✅ Add job to queue
    const job = await scanQueue.add("scan-job", { domain });

    // ✅ Return jobId (IMPORTANT)
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