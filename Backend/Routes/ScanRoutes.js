import express from "express";
import { fullScan } from "../Controllers/ScanController.js";
import logger from "../Middlewares/Logger.js";

const router = express.Router();

router.post("/fullscan", (req, res, next) => {
  logger.info(`USER EVENT: Manual scan requested from IP: ${req.ip}`);
  fullScan(req, res, next);
});

export default router;