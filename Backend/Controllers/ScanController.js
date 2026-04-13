import { scanQueue } from "../queue/scanQueue.js";
import Scan from "../Models/ScanModel.js";
import logger from "../Middlewares/Logger.js";
import { generatePdfReport } from "../utils/reportGenerator.js";
import { getRecommendations } from "../utils/recommendationEngine.js";

// Start scan (only queue trigger)
export const fullScan = async (req, res) => {
  try {
    const { domain: inputDomain } = req.body;

    if (!inputDomain) {
      return res.status(400).json({ message: "Domain is required" });
    }

    let domain = inputDomain
      .toLowerCase()
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "");

    if (domain.includes("/")) {
      domain = domain.split("/")[0];
    }

    const job = await scanQueue.add("scan-job", { domain });

    logger.info(`SCAN STARTED: ${domain}`);

    return res.json({
      message: "Scan started",
      jobId: job.id,
      domain,
    });
  } catch (error) {
    logger.error(`SCAN FAILED: ${error.message}`);
    res.status(500).json({ message: "Error starting scan" });
  }
};

// Pdf + Recommendation controller
export const generateScanReport = async (req, res) => {
  try {
    const scanResult = {
      brand: "amazon.com",
      scanDate: new Date().toISOString(),
      domains: [
        {
          domain: "amazpn.com",
          score: 78,
          risk_level: "High",
          isPrivacyProtected: true,
          ageInDays: 10,
        },
      ],
    };

    // ✅ add recommendations
    scanResult.domains = scanResult.domains.map((d) => ({
      ...d,
      recommendations: getRecommendations(d),
    }));

    // ✅ generate PDF
    const pdfPath = await generatePdfReport(scanResult);

    return res.json({
      success: true,
      data: scanResult,
      report: pdfPath,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// 📊 Get scan result from DB
export const getScanResult = async (req, res) => {
  try {
    const { domain } = req.params;

    const result = await Scan.findOne({ original_domain: domain });

    if (!result) {
      return res.json({
        status: "processing",
      });
    }

    return res.json({
      status: "completed",
      data: result,
    });
  } catch (error) {
    logger.error(error.message);
    res.status(500).json({ message: "Error fetching result" });
  }
};

// 📄 Get scan report summary
export const getScanReport = async (req, res) => {
  try {
    const { scan_id } = req.params;

    const domains = await Scan.find({
      scan_id,
      generated_domain: { $ne: null },
    });

    const report = {
      total: domains.length,
      high: domains.filter((d) => d.risk_level === "High").length,
      medium: domains.filter((d) => d.risk_level === "Medium").length,
      low: domains.filter((d) => d.risk_level === "Low").length,
      critical: domains.filter((d) => d.risk_level === "Critical").length,
    };

    return res.json(report);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 📚 Get all scans
export const getAllScans = async (req, res) => {
  try {
    const scans = await Scan.find().sort({ createdAt: -1 });
    return res.json(scans);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// 📈 Get scan progress
export const getScanProgress = async (req, res) => {
  try {
    const { scan_id } = req.params;

    const scan = await Scan.findOne({ scan_id });

    if (!scan) {
      return res.status(404).json({ message: "Scan not found" });
    }

    return res.json({
      progress: scan.progress,
      status: scan.status,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
