import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Scan API
app.get("/api/scan", (req, res) => {
  const domain = req.query.domain;

  if (!domain) {
    return res.status(400).json({ message: "Domain is required" });
  }

  // Dummy response
  res.json({
    domain: domain,
    status: "Safe",
    message: "No threats detected",
  });
});

// Start server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});