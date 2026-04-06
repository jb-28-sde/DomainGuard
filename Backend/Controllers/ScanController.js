import generateVariants, {
  generatePhishingVariants,
} from "../Domain-analysis/DomainvariantGenerator.js";

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

    // Generate variants
    const variants = generateVariants(domain);

    // Similarity calculation
    const similarityData = calculateSimilarityForVariants(domain, variants);

    const finalResults = await Promise.all(
      similarityData.map(async (item) => {
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
          // WHOIS
          const whoisData = await getWhoisData(item.variant);

          registrar = whoisData?.registrar || null;
          createdAt = whoisData?.creationDate || null;

          // Domain Age
          const ageData = analyzeDomainAge(createdAt);
          ageInDays = ageData.ageInDays;
          ageRisk = ageData.ageRisk;

          // Privacy
          isPrivacyProtected = checkPrivacy(whoisData?.owner);

          // DNS Records
          const dnsData = await getDNSRecords(item.variant);

          // Save DNS records
          await DnsRecord.create({
            domain: item.variant,
            A_record: dnsData.A,
            AAAA_record: dnsData.AAAA,
            MX_record: dnsData.MX,
            NS_record: dnsData.NS,
            scanned_at: new Date(),
          });

          // Infrastructure Detection
          const infra = await detectSharedInfrastructure(item.variant, dnsData);

          hosting_provider = infra.hosting_provider;
          infraRisk = infra.risk_level;
          reason = infra.reason;
        }

        // Risk Scoring
        const score = calculateRiskScore({
          similarity: item.similarity,
          dns,
          isPrivacyProtected,
          ageInDays,
          tldRisk,
          infraRisk,
        });

        // Risk Level
        const riskLevel = getRiskLevel(score);

        return {
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
      }),
    );

    // Save original domain
    const existing = await Scan.findOne({ original_domain: domain });

    if (!existing) {
      await Scan.create({
        original_domain: domain,
      });
    }

    // Final response
    res.json(finalResults);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error in full scan pipeline" });
  }
};
