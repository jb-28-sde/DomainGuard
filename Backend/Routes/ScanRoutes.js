<<<<<<< Updated upstream
import express from "express";
import { createScan } from "../Controllers/ScanController.js";

const router = express.Router();

router.post("/scan", createScan);
export default router;
=======
const express = require('express');
const router = express.Router();
const scanController = require('../Controllers/ScanController');

//Final route → /api/scan
router.post('/scan', scanController.scanDomain);

module.exports = router;
>>>>>>> Stashed changes
