import dns from "dns/promises";
import DNSRecord from "../Models/dnsRecordModel.js";

export const getDNSRecords = async (domain) => {
  try {
    // Parallel fetching all records
    const A = await dns.resolve4(domain).catch(() => []);
    const AAAA = await dns.resolve6(domain).catch(() => []);

    const MX = await dns
      .resolveMx(domain)
      .then((res) => res.map((r) => r.exchange))
      .catch(() => []);

    const NS = await dns.resolveNs(domain).catch(() => []);

    return {
      A,
      AAAA,
      MX,
      NS,
    };
  } catch (error) {
    console.log("DNS Error:", error.message);

    return {
      A: [],
      AAAA: [],
      MX: [],
      NS: [],
    };
  }
};

export const detectSharedInfrastructure = async (domain, dnsData) => {
  try {
    const ipList = dnsData?.A || [];

    if (ipList.length === 0) {
      return {
        hosting_provider: "Unknown",
        risk_level: "LOW",
        reason: "No IP address found",
      };
    }

    const existingRecord = await DNSRecord.findOne({
      domain: { $ne: domain },
      A_record: { $in: ipList },
    });

    if (existingRecord) {
      return {
        hosting_provider: "Shared Hosting",
        risk_level: "HIGH",
        reason: `Same IP used by ${existingRecord.domain}`,
      };
    }

    return {
      hosting_provider: "Unique Hosting",
      risk_level: "LOW",
      reason: "No shared infrastructure detected",
    };
  } catch (error) {
    console.log("Infra Detection Error:", error);

    return {
      hosting_provider: "Unknown",
      risk_level: "LOW",
      reason: "Error during infrastructure analysis",
    };
  }
};
