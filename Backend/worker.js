import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";

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

const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), ms)
  );

// 🔥 MongoDB FIRST CONNECT
mongoose
  .connect("mongodb://127.0.0.1:27017/brandshield")
  .then(() => {
    console.log("🟢 MongoDB Connected (Worker)");

    // 🚀 Worker START after DB ready
    const worker = new Worker(
      "scan-queue",
      async (job) => {
        try {
          const { domain } = job.data;

          console.log("🚀 Processing scan for:", domain);

          const variants = generateVariants(domain);
          const similarityData = calculateSimilarityForVariants(domain, variants);

          const results = await Promise.all(
            similarityData.map(async (item) => {
              try {
                const { tld, isSuspicious } = checkSuspiciousTLD(item.variant);
                const tldRisk = isSuspicious ? "HIGH" : "LOW";

                const dns = await Promise.race([
                  checkDNS(item.variant),
                  timeout(15000),
                ]);

                let registrar = null;
                let createdAt = null;
                let ageInDays = null;
                let ageRisk = null;
                let isPrivacyProtected = null;

                if (dns) {
                  const whoisData = await Promise.race([
                    getWhoisData(item.variant),
                    timeout(10000),
                  ]);

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
                  risk_level: getRiskLevel(score),
                };
              } catch (err) {
                console.error("❌ Variant error:", item.variant, err.message);
                return null;
              }
            })
          );

          const cleanResults = results.filter(Boolean);

          console.log("📦 Results generated:", cleanResults.length);

          await Scan.create({
            brandName: domain,
            original_domain: domain,
            totalDomains: cleanResults.length,
            results: cleanResults,
            createdAt: new Date(),
            status: "completed",
          });

          console.log("✅ Scan completed:", domain);

        } catch (err) {
          console.error("❌ Worker crashed safely:", err.message);
        }
      },
      { connection }
    );

    console.log("🔥 Worker running...");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
  });