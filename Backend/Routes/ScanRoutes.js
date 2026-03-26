import express from "express";
import { createScan } from "../Controllers/ScanController.js";

const router = express.Router();

router.post("/scan", createScan);
export default router;
