import express from "express";
import {
  FullScan,
  getScanProgress,
  getScanReport,
} from "../Controllers/ScanController.js";

const router = express.Router();


router.post("/fullscan", FullScan);


router.get("/progress/:scan_id", getScanProgress);


router.get("/report/:scan_id", getScanReport);

export default router;