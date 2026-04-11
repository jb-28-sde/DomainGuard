import express from "express";
import { FullScan, getScanResult } from "../Controllers/scanController.js";

const router = express.Router();

// 🚀 Start scan
router.post("/scan", FullScan);

// 🔍 Get result
router.get("/scan/:domain", getScanResult);

export default router;