import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import generateVariants from "./Domain-analysis/DomainvariantGenerator.js";
import { calculateSimilarityForVariants } from "./Domain-analysis/SimilarityCalculator.js";

import Scan from "./Models/ScanModel.js";
import { getDNSRecords } from "./Domain-analysis/DnsChecker.js";
import { getWhoisData } from "./Domain-analysis/whoisService.js";
import { analyzeDomainAge } from "./Domain-analysis/domainAgeService.js";
import { checkPrivacy } from "./Domain-analysis/privacyCheckService.js";
import { checkSuspiciousTLD } from "./Domain-analysis/TldChecker.js";

import {
  calculateRiskScore,
  getRiskLevel,
} from "./Domain-analysis/riskScoring.js";

const connection = new IORedis({
  host: "fancy-beetle-112031.upstash.io",
  port: 6379,
  username: "default",
  password: "gQAAAAAAAbWfAAIgcDI0NTdiYjdmYzI0YzY0NjgyOTlkZTM4NDAwYTA3NmRjNg",
  tls: {}, 
  maxRetriesPerRequest: null,
});

const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), ms),
  );

// MongoDB FIRST CONNECT
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected (Worker)");

    // Worker START after DB ready
    const worker = new Worker(
      "scan-queue",
      async (job) => {
        try {
          const { domain } = job.data;

          console.log("Processing scan for:", domain);

          const variants = generateVariants(domain);
          const similarityData = calculateSimilarityForVariants(
            domain,
            variants,
          );

          const results = await Promise.all(
            similarityData.map(async (item) => {
              try {
                const { tld, isSuspicious } = checkSuspiciousTLD(item.variant);
                const tldRisk = isSuspicious ? "HIGH" : "LOW";

                const dns = await Promise.race([
                  getDNSRecords(item.variant),
                  timeout(15000),
                ]);

                // Extract the boolean flag from DNS object  
                const dnsExists = dns?.exists || false;

                let registrar = null;
                let owner = null;
                let createdAt = null;
                let ageInDays = null;
                let ageRisk = null;
                let isPrivacyProtected = null;
                const whoisData = await Promise.race([
                  getWhoisData(item.variant),
                  timeout(10000),
                ]);

                registrar = whoisData?.registrar || null;
                owner = whoisData?.owner || null;
                createdAt = whoisData?.creationDate || null;

                if (createdAt) {
                  const ageData = analyzeDomainAge(createdAt);
                  ageInDays = ageData.ageInDays;
                  ageRisk = ageData.ageRisk;
                }

                isPrivacyProtected = checkPrivacy(whoisData?.owner);

                const score = calculateRiskScore({
                  similarity: item.similarity,
                  dns: dnsExists,
                  isPrivacyProtected,
                  ageInDays,
                  tldRisk,
                });

                return {
                  domain: item.variant,
                  similarity: item.similarity,
                  dns_exists: dnsExists,
                  registrar,
                  owner,
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
                console.error("Variant error:", item.variant, err.message);
                return null;
              }
            }),
          );

          const cleanResults = results.filter(Boolean);

          console.log("Results generated:", cleanResults.length);

          // Generate unique scan ID
          const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Use updateOne with upsert to allow rescans of the same domain
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
              }
            },
            { upsert: true }
          );

          console.log("Scan completed:", domain);
        } catch (err) {
          console.error("Worker crashed safely:", err.message);
        }
      },
      { connection },
    );

    console.log("Worker running...");
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });
