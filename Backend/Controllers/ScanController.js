import { scanQueue } from "../queue/scanQueue.js";
import Scan from "../Models/ScanModel.js";
import logger from '../Middlewares/Logger.js';
import mongoose from "mongoose";

import { checkDNS } from "../Domain-analysis/DnsChecker.js";
import { calculateSimilarityForVariants } from "../Domain-analysis/SimilarityCalculator.js";
import { getWhoisData } from "../Domain-analysis/whoisService.js";
import { analyzeDomainAge } from "../Domain-analysis/domainAgeService.js";
import { checkPrivacy } from "../Domain-analysis/privacyCheckService.js";
import { checkSuspiciousTLD } from "../Domain-analysis/TldChecker.js";
import { generateVariants } from "../Domain-analysis/variantGenerator.js"; // ✅ FIXED



const generateJsonReport = (brand, results) => {
  const summary = {
    total: results.length,
    high: results.filter(r => r.risk_level === "High").length,
    medium: results.filter(r => r.risk_level === "Medium").length,
    low: results.filter(r => r.risk_level === "Low").length,
    critical: results.filter(r => r.risk_level === "Critical").length,
  };

  return {
    brand,
    summary,
    domains: results.map(r => ({
      domain: r.domain,
      risk: r.risk_level
    }))
  };
};


export const FullScan = async (req, res) => {
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

    return res.json({
      message: "Scan started 🚀",
      jobId: job.id,
      domain: domain,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error starting scan" });
  }
};



export const getScanResult = async (req, res) => {
  try {
    const { domain } = req.params;

    const result = await Scan.findOne({ original_domain: domain });

    if (!result) {
      return res.json({
        status: "processing",
        message: "Scan abhi chal raha hai...",
      });
    }

    return res.json({
      status: "completed",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching result" });
    logger.info(`SCAN STARTED: ${domain}`);

    const variants = generateVariants(domain);
    const similarityData = calculateSimilarityForVariants(domain, variants);

    const finalResults = [];

    for (const item of similarityData) {
      const { tld, isSuspicious } = checkSuspiciousTLD(item.variant);
      const tldRisk = isSuspicious ? "HIGH" : "LOW";

      const dns = await checkDNS(item.variant);

      let registrar = null;
      let createdAt = null;
      let ageInDays = null;
      let ageRisk = null;
      let isPrivacyProtected = null;
      let hosting_provider = null;
      let infraRisk = null;
      let reason = null;

      if (dns) {
        const whoisData = await getWhoisData(item.variant);

        registrar = whoisData?.registrar || null;
        createdAt = whoisData?.creationDate || null;

        if (createdAt) {
          const ageData = analyzeDomainAge(createdAt);
          ageInDays = ageData.ageInDays;
          ageRisk = ageData.ageRisk;
        }

        isPrivacyProtected = checkPrivacy(whoisData?.owner);

        const dnsData = await getDNSRecords(item.variant);
        const infra = await detectSharedInfrastructure(item.variant, dnsData);

        hosting_provider = infra.hosting_provider;
        infraRisk = infra.risk_level;
        reason = infra.reason;
      }

      const score = calculateRiskScore({
        similarity: item.similarity,
        dns,
        isPrivacyProtected,
        ageInDays,
        tldRisk,
        infraRisk,
      });

      const riskLevel = getRiskLevel(score);

      const result = {
        domain: item.variant,
        similarity: item.similarity,
        dns,
        registrar,
        createdAt,
        ageInDays,
        ageRisk,
        isPrivacyProtected,
        tld,
        tldRisk,
        hosting_provider,
        reason,
        impersonation_score: score,
        risk_level: riskLevel,
      };

      finalResults.push(result);
    }

    logger.info(`SCAN COMPLETED: ${domain}`);

  
    const report = generateJsonReport(domain, finalResults);

    res.json({
      success: true,
      message: `Scan completed for ${domain}`,
      report
    });

  } catch (error) {
    logger.error(`SCAN FAILED: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


export const getScanReport = async (req, res) => {
  try {
    const { scan_id } = req.params;

    const domains = await Scan.find({
      scan_id,
      generated_domain: { $ne: null },
    });

    const report = {
      total: domains.length,
      high: domains.filter(d => d.risk_level === "High").length,
      medium: domains.filter(d => d.risk_level === "Medium").length,
      low: domains.filter(d => d.risk_level === "Low").length,
      critical: domains.filter(d => d.risk_level === "Critical").length,
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};