import express from "express";
import {
  fullScan,
  getScanProgress,
  getScanReport,
  getAllScans,
  generateScanReport,
} from "../Controllers/ScanController.js";
import logger from "../Middlewares/Logger.js";

const router = express.Router();

// Start full scan
router.post("/fullscan", (req, res, next) => {
  logger.info(`USER EVENT: Manual scan requested from IP: ${req.ip}`);
  fullScan(req, res, next);
});

// Get scan progress
router.get("/progress/:scan_id", getScanProgress);

// Get scan report
router.get("/report/:scan_id", getScanReport);

// Get all scans
router.get("/scans", getAllScans);

// Generate PDF Report with Recommendations
router.post("/generate-report", (req, res, next) => {
  logger.info(`USER EVENT: PDF report generation requested`);
  generateScanReport(req, res, next);
});

export default router;