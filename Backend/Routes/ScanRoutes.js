import express from "express";
import {
  FullScan,
  getScanProgress,
  getScanReport,
  getAllScans,
} from "../Controllers/ScanController.js";

const router = express.Router();

// Run full scan
router.post("/fullscan", FullScan);

// Get scan progress
router.get("/progress/:scan_id", getScanProgress);

// Get scan report
router.get("/report/:scan_id", getScanReport);

// Get all scans (from main branch)
router.get("/scans", getAllScans);

export default router;