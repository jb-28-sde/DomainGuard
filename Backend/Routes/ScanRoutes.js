import express from "express";
import { FullScan, getAllScans } from "../Controllers/ScanController.js";

const router = express.Router();


router.post("/fullscan", FullScan);


router.get("/scans", getAllScans);

export default router;