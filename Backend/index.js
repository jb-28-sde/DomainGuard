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
  .then(() => console.log("Database Connected successfully"))
  .catch((err) => console.log(err));

// Test route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});


// 🔥 Dummy Scanner Function (replace with your real logic)
async function runYourScanner(domain) {
  return [
    {
      domain: domain,
      similarity: 100,
      dns: true,
      registrar: "GoDaddy",
      createdAt: "2024-01-01",
      ageInDays: 400,
      ageRisk: "LOW",
      isPrivacyProtected: false,

      // ✅ FIX
      tld: "." + domain.split(".").pop(),

      tldRisk: "LOW",
      risk_level: "Low",
    },
    {
      domain: "fake-" + domain,
      similarity: 90,
      dns: false,
      registrar: null,
      createdAt: null,
      ageInDays: null,
      ageRisk: "HIGH",
      isPrivacyProtected: true,
      tld: ".xyz",
      tldRisk: "HIGH",
      risk_level: "High",
    },
  ];
}


// ✅ 🔹 FULL SCAN API
app.post("/api/fullscan", async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({ message: "Domain required" });
    }

    // 🔥 run scan
    const results = await runYourScanner(domain);

    // ✅ SAVE FULL SCAN (IMPORTANT)
    await Scan.create({
      brandName: domain,
      totalDomains: results.length,
      results: results,
    });

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Scan failed" });
  }
});


// ✅ 🔹 GET ALL HISTORY
app.get("/api/history", async (req, res) => {
  try {
    const data = await Scan.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
});


// ✅ 🔹 GET SINGLE SCAN
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
  console.log(`Server running on ${PORT}`);
});