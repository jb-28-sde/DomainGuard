import { Worker } from "bullmq";
import IORedis from "ioredis";

import generateVariants from "./Domain-analysis/DomainvariantGenerator.js";
import { calculateSimilarityForVariants } from "./Domain-analysis/SimilarityCalculator.js";

import Scan from "./Models/ScanModel.js";
import { checkDNS } from "./Domain-analysis/DnsChecker.js";
import { getWhoisData } from "./Domain-analysis/whoisService.js";
import { analyzeDomainAge } from "./Domain-analysis/domainAgeService.js";
import { checkPrivacy } from "./Domain-analysis/privacyCheckService.js";
import { checkSuspiciousTLD } from "./Domain-analysis/TldChecker.js";

import {
  calculateRiskScore,
  getRiskLevel,
} from "./Domain-analysis/riskScoring.js";

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "scan-queue",
  async (job) => {
    const { domain } = job.data;

    console.log("🚀 Processing scan for:", domain);

    // STEP 1: Generate variants
    const variants = generateVariants(domain);

    // STEP 2: Similarity
    const similarityData = calculateSimilarityForVariants(domain, variants);

    // STEP 3: Full processing
    const results = await Promise.all(
      similarityData.map(async (item) => {
        const { tld, isSuspicious } = checkSuspiciousTLD(item.variant);
        const tldRisk = isSuspicious ? "HIGH" : "LOW";

        const dns = await checkDNS(item.variant);

        let registrar = null;
        let createdAt = null;
        let ageInDays = null;
        let ageRisk = null;
        let isPrivacyProtected = null;

        if (dns) {
          const whoisData = await getWhoisData(item.variant);

          registrar = whoisData?.registrar || null;
          createdAt = whoisData?.creationDate || null;

          const ageData = analyzeDomainAge(createdAt);
          ageInDays = ageData.ageInDays;
          ageRisk = ageData.ageRisk;

          isPrivacyProtected = checkPrivacy(whoisData?.owner);
        }

        const score = calculateRiskScore({
          similarity: item.similarity,
          dns,
          isPrivacyProtected,
          ageInDays,
          tldRisk,
        });

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
          impersonation_score: score,
          risk_level: riskLevel,
        };
      })
    );

    // SAVE RESULT
    await Scan.create({
      original_domain: domain,
      totalDomains: results.length,
      results,
    });

    console.log("✅ Scan completed:", domain);
  },
  { connection }
);

console.log("🔥 Worker running...");