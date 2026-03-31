import express from "express";
import {FullScan} from "../Controllers/ScanController.js";

const router = express.Router();

router.post("/fullscan", FullScan);
export default router;
