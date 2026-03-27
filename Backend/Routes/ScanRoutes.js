import express from "express";
import { createScan } from "../Controllers/ScanController.js";
import generateVariants from "../Domain-analysis/DomainvariantGenerator.js";

const router = express.Router();

router.post("/scan", createScan);
router.post("/generate", (req, res) => {
  const { domain } = req.body;
  if (!domain) {
    return res.status(400).json({ message: "Domain is required" });
  }
  const variants = generateVariants(domain);
  res.json({
    original: domain,
    total: variants.length,
    variants,
  });
});
export default router;
