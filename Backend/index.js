import { scanQueue } from "./queue/scanQueue.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Scan from "./Models/ScanModel.js";
import connectDB from "./config/database.js";
import cron from "node-cron";
import logger from "./Middlewares/Logger.js"; 
import scanRoutes from "./Routes/ScanRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

// __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// Apply middleware (only once)
app.use(cors());
app.use(express.json());

// Serve reports folder for PDF downloads
app.use("/reports", express.static(path.join(__dirname, "reports")));

// Connect to database (only once)
connectDB();
logger.info("DATABASE: Connection attempt initiated.");

// Register routes
app.use('/api', scanRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Queue-based scan API
app.post("/api/fullscan", async (req, res) => {
  try {
    let { domain } = req.body;

    // Validate input
    if (!domain) {
      return res.status(400).json({ message: "Domain required" });
    }

    // Normalize domain
    domain = domain
      .toLowerCase()
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "");

    if (domain.includes("/")) {
      domain = domain.split("/")[0];
    }

    // Add job to queue
    const job = await scanQueue.add("scan-job", { domain });

    res.json({
      message: "Scan started",
      jobId: job.id,
      domain,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error starting scan" });
  }
});

// Get all scan history
app.get("/api/history", async (req, res) => {
  try {
    const data = await Scan.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

// Get scan result by domain
app.get("/api/result/:domain", async (req, res) => {
  try {
    const { domain } = req.params;

    const data = await Scan.findOne({ original_domain: domain });

    if (!data) {
      return res.json({ status: "processing" });
    }

     if (data.status !== "Completed") {
      return res.json({ status: "processing" });
    }

    res.json({
      status: "completed",
      data,
    });

  } catch (err) {
    res.status(500).json({ message: "Error fetching result" });
  }
});

// Get scan by ID
app.get("/api/history/:id", async (req, res) => {
  try {
    const data = await Scan.findById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching scan" });
  }
});

// Cron job for periodic logging
cron.schedule('* * * * *', () => {
  logger.info("CRON EVENT: Automated system check performed.");
});

// Define single port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  logger.info(`SERVER: Running on port ${PORT}`);
});
