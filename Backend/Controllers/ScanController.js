import generateVariants from "../Domain-analysis/DomainvariantGenerator.js";

import Scan from "../Models/ScanModel.js";
import DnsRecord from "../Models/dnsRecordModel.js";

import { checkDNS } from "../Domain-analysis/DnsChecker.js";
import { calculateSimilarityForVariants } from "../Domain-analysis/SimilarityCalculator.js";
import { getWhoisData } from "../Domain-analysis/whoisService.js";
import { analyzeDomainAge } from "../Domain-analysis/domainAgeService.js";
import { checkPrivacy } from "../Domain-analysis/privacyCheckService.js";
import { checkSuspiciousTLD } from "../Domain-analysis/TldChecker.js";

import {
  getDNSRecords,
  detectSharedInfrastructure,
} from "../Domain-analysis/dnsInfrastructure.js";

import {
  calculateRiskScore,
  getRiskLevel,
} from "../Domain-analysis/riskScoring.js";

import mongoose from "mongoose";

// Alert Model
const AlertSchema = new mongoose.Schema({
  domain: String,
  riskLevel: String,
  createdAt: { type: Date, default: Date.now },
});
const Alert = mongoose.model("Alert", AlertSchema);

// =======================================================
// FULL SCAN
// =======================================================
export const FullScan = async (req, res) => {
  try {
    const { domain: inputDomain } = req.body;

    if (!inputDomain) {
      return res.status(400).json({ message: "Domain is required" });
    }

    // Clean domain
    let domain = inputDomain
      .toLowerCase()
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "");

    if (domain.includes("/")) {
      domain = domain.split("/")[0];
    }

    const variants = generateVariants(domain);
    const similarityData = calculateSimilarityForVariants(domain, variants);

    const scan_id = new mongoose.Types.ObjectId().toString();
    const totalDomains = similarityData.length;
    let scannedCount = 0;

    // Initial scan entry
    await Scan.create({
      original_domain: domain,
      scan_id,
      total_domains: totalDomains,
      scanned_domains: 0,
      progress: 0,
      status: "Running",
    });

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

        // safer handling
        if (createdAt) {
          const ageData = analyzeDomainAge(createdAt);
          ageInDays = ageData.ageInDays;
          ageRisk = ageData.ageRisk;
        }

        isPrivacyProtected = checkPrivacy(whoisData?.owner);

        const dnsData = await getDNSRecords(item.variant);

        await DnsRecord.create({
          domain: item.variant,
          A_record: dnsData.A,
          AAAA_record: dnsData.AAAA,
          MX_record: dnsData.MX,
          NS_record: dnsData.NS,
          scanned_at: new Date(),
        });

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

      // ALERT
      if (riskLevel === "High" || riskLevel === "Critical") {
        await Alert.create({
          domain: item.variant,
          riskLevel,
        });
      }

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

      // Store each domain result
      await Scan.create({
        original_domain: domain,
        generated_domain: item.variant,
        similarity_score: item.similarity,
        dns_exists: dns,
        registrar,
        createdAtDomain: createdAt,
        ageInDays,
        ageRisk,
        isPrivacyProtected,
        tld,
        tldRisk,
        impersonation_score: score,
        risk_level: riskLevel,
        scan_id,
      });

      scannedCount++;
      const progress = Math.floor((scannedCount / totalDomains) * 100);

      await Scan.findOneAndUpdate(
        { scan_id, generated_domain: { $exists: false } },
        {
          scanned_domains: scannedCount,
          progress,
        }
      );
    }

    await Scan.findOneAndUpdate(
      { scan_id, generated_domain: { $exists: false } },
      {
        status: "Completed",
        progress: 100,
      }
    );

    res.json({
      scan_id,
      total: totalDomains,
      results: finalResults,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error in full scan pipeline" });
  }
};

// =======================================================
// PROGRESS
// =======================================================
export const getScanProgress = async (req, res) => {
  try {
    const { scan_id } = req.params;

    const scan = await Scan.findOne({
      scan_id,
      generated_domain: { $exists: false },
    });

    if (!scan) {
      return res.status(404).json({ message: "Scan not found" });
    }

    res.json({
      total: scan.total_domains,
      scanned: scan.scanned_domains,
      progress: scan.progress,
      status: scan.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================================================
// REPORT
// =======================================================
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

// =======================================================
// GET ALL SCANS (from main branch)
// =======================================================
export const getAllScans = async (req, res) => {
  try {
    const scans = await Scan.find().sort({ createdAt: -1 });
    res.json(scans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching scans" });
  }
};