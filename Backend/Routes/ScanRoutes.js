import express from "express";
import { createScan, generateDomainVariants, checkDomainDNS } from "../Controllers/ScanController.js";

const router = express.Router();

router.post("/scan", createScan);
router.post("/generate", generateDomainVariants)  
router.post("/check-dns", checkDomainDNS)
export default router;
