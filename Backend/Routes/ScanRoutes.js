import express from "express";
import { createScan, generateDomainVariants } from "../Controllers/ScanController.js";

const router = express.Router();

router.post("/scan", createScan);
router.post("/generate", generateDomainVariants)  
export default router;
