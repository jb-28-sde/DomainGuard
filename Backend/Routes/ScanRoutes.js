import express from "express";
import { createScan, generateDomainVariants, checkDomainDNS , generatePhishingDomains , checkTLD, FullScan} from "../Controllers/ScanController.js";


const router = express.Router();

router.post("/scan", createScan);
router.post("/generate", generateDomainVariants)
router.post("/check-dns", checkDomainDNS)
router.post("/phishing-domains", generatePhishingDomains)
router.post("/check-tld", checkTLD);
router.post("/fullscan", FullScan);
export default router;
