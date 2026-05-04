import Scan from "../Models/ScanModel.js";
import logger from "../Middlewares/Logger.js";
import { generatePdfReport } from "../utils/reportGenerator.js";
import { getRecommendations } from "../utils/recommendationEngine.js";
import generateVariants from "../Domain-analysis/DomainvariantGenerator.js";
import { calculateSimilarityForVariants } from "../Domain-analysis/SimilarityCalculator.js";
import { getDNSRecords } from "../Domain-analysis/DnsChecker.js";
import { getWhoisData } from "../Domain-analysis/whoisService.js";
import { analyzeDomainAge } from "../Domain-analysis/domainAgeService.js";
import { checkPrivacy } from "../Domain-analysis/privacyCheckService.js";
import { checkSuspiciousTLD } from "../Domain-analysis/TldChecker.js";
import {
  calculateRiskScore,
  getRiskLevel,
} from "../Domain-analysis/riskScoring.js";


const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), ms),
  );

const processScanInBackground = async (domain) => {
  try {
    const variants = generateVariants(domain);
    const similarityData = calculateSimilarityForVariants(domain, variants);

    const results = await Promise.all(
      similarityData.map(async (item) => {
        try {
          const { tld, isSuspicious } = checkSuspiciousTLD(item.variant);
          const tldRisk = isSuspicious ? "HIGH" : "LOW";

          const dns = await Promise.race([
            getDNSRecords(item.variant),
            timeout(15000),
          ]);

          const dnsExists = dns?.exists || false;
          const whoisData = await Promise.race([
            getWhoisData(item.variant),
            timeout(10000),
          ]);

          const registrar = whoisData?.registrar || null;
          const owner = whoisData?.owner || null;
          const createdAt = whoisData?.creationDate || null;
          const ageData = createdAt
            ? analyzeDomainAge(createdAt)
            : { ageInDays: null, ageRisk: null };
          const isPrivacyProtected = checkPrivacy(whoisData?.owner);

          const score = calculateRiskScore({
            similarity: item.similarity,
            dns: dnsExists,
            isPrivacyProtected,
            ageInDays: ageData.ageInDays,
            tldRisk,
          });

          return {
            domain: item.variant,
            similarity: item.similarity,
            dns_exists: dnsExists,
            registrar,
            owner,
            createdAt,
            ageInDays: ageData.ageInDays,
            ageRisk: ageData.ageRisk,
            isPrivacyProtected,
            tld,
            tldRisk,
            impersonation_score: score,
            risk_level: getRiskLevel(score),
          };
        } catch (error) {
          logger.error(`VARIANT FAILED: ${item.variant} - ${error.message}`);
          return null;
        }
      }),
    );

    const cleanResults = results.filter(Boolean);
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    await Scan.updateOne(
      { original_domain: domain },
      {
        $set: {
          scan_id: scanId,
          total_domains: cleanResults.length,
          scanned_domains: cleanResults.length,
          progress: 100,
          status: "Completed",
          results: cleanResults,
        },
      },
      { upsert: true },
    );

    logger.info(`SCAN COMPLETED: ${domain}`);
  } catch (error) {
    logger.error(`SCAN PROCESSING FAILED: ${domain} - ${error.message}`);

    await Scan.updateOne(
      { original_domain: domain },
      {
        $set: {
          progress: 100,
          status: "Failed",
          results: [],
        },
      },
      { upsert: true },
    );
  }
};

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

    const scanId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    await Scan.updateOne(
      { original_domain: domain },
      {
        $set: {
          scan_id: scanId,
          original_domain: domain,
          progress: 5,
          status: "Running",
          total_domains: 0,
          scanned_domains: 0,
          results: [],
        },
      },
      { upsert: true },
    );

    processScanInBackground(domain);

    logger.info(`SCAN STARTED: ${domain}`);

    return res.json({
      message: "Scan started",
      jobId: scanId,
      domain,
    });
  } catch (error) {
    logger.error(`SCAN FAILED: ${error.message}`);
    return res.status(500).json({ message: "Error starting scan" });
  }
};

export const generateScanReport = async (req, res) => {
  try {
    const { brand, scanDate, domains } = req.body;

    if (!brand || !Array.isArray(domains)) {
      return res.status(400).json({
        success: false,
        message: "Brand and domains are required",
      });
    }

    const scanResult = {
      brand,
      scanDate: scanDate || new Date().toISOString(),
      domains: domains.map((domain) => ({
        ...domain,
        risk_level: String(domain.risk_level || "LOW").toUpperCase(),
      })),
    };

    scanResult.domains = scanResult.domains.map((domain) => ({
      ...domain,
      recommendations: getRecommendations(domain),
    }));

    const reportFile = await generatePdfReport(scanResult);

    return res.json({
      success: true,
      data: scanResult,
      report: reportFile.fileName,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getScanResult = async (req, res) => {
  try {
    const { domain } = req.params;

    const result = await Scan.findOne({ original_domain: domain });

    if (!result) {
      return res.json({
        status: "processing",
      });
    }

    if (result.status !== "Completed") {
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
    return res.status(500).json({ message: "Error fetching result" });
  }
};

export const getScanReport = async (req, res) => {
  try {
    const { scan_id } = req.params;
    const scan = await Scan.findOne({ scan_id });

    if (!scan) {
      return res.status(404).json({ message: "Scan not found" });
    }

    const results = Array.isArray(scan.results) ? scan.results : [];
    const normalizeRisk = (riskLevel) => String(riskLevel || "LOW").toUpperCase();

    return res.json({
      total: results.length,
      high: results.filter((item) => normalizeRisk(item.risk_level) === "HIGH").length,
      medium: results.filter((item) => normalizeRisk(item.risk_level) === "MEDIUM").length,
      low: results.filter((item) => normalizeRisk(item.risk_level) === "LOW").length,
      critical: results.filter((item) => normalizeRisk(item.risk_level) === "CRITICAL").length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllScans = async (req, res) => {
  try {
    const scans = await Scan.find().sort({ createdAt: -1 });
    return res.json(scans);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

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
