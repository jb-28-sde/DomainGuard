import { Worker } from "bullmq";
import IORedis from "ioredis";
import Scan from "./models/ScanModel.js";

const connection = new IORedis();

const worker = new Worker(
  "scan-queue",
  async (job) => {
    const { domain } = job.data;

    console.log("🚀 Processing scan for:", domain);

    const results = [
      {
        domain: domain,
        similarity: 100,
        dns: true,
        registrar: "GoDaddy",
        createdAt: "2024-01-01",
        ageInDays: 400,
        ageRisk: "LOW",
        isPrivacyProtected: false,
        tld: "." + domain.split(".").pop(),
        tldRisk: "LOW",
        risk_level: "Low",
      },
      {
        domain: "fake-" + domain,
        similarity: 90,
        dns: false,
        registrar: null,
        createdAt: null,
        ageInDays: null,
        ageRisk: "HIGH",
        isPrivacyProtected: true,
        tld: ".xyz",
        tldRisk: "HIGH",
        risk_level: "High",
      },
    ];

    await Scan.create({
      brandName: domain,
      totalDomains: results.length,
      results: results,
    });

    console.log("✅ Scan completed:", domain);
  },
  { connection }
);

console.log("🔥 Worker running...");