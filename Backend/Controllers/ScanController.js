import generateVariants from "../Domain-analysis/DomainvariantGenerator.js";
import Scan from "../Models/ScanModel.js";
import { checkDNS } from "../Domain-analysis/DnsChecker.js";
import { calculateSimilarityForVariants } from "../Domain-analysis/SimilarityCalculator.js";
import { getWhoisData } from "../Domain-analysis/whoisService.js";
import { analyzeDomainAge } from "../Domain-analysis/domainAgeService.js";
import { checkPrivacy } from "../Domain-analysis/privacyCheckService.js";

export const FullScan = async (req, res) => {
  try {
    const { domain: inputDomain } = req.body;

    if (!inputDomain) {
      return res.status(400).json({ message: "Domain is required" });
    }

    //  Clean domain
    let domain = inputDomain
      .toLowerCase()
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "");

    if (domain.includes("/")) {
      domain = domain.split("/")[0];
    }

    //  Generate variants
    const variants = generateVariants(domain);

    // Similarity calculation
    const similarityData = calculateSimilarityForVariants(domain, variants);

    //  MAIN PIPELINE
    const finalResults = await Promise.all(
      similarityData.map(async (item) => {
        const dns = await checkDNS(item.variant);

        let registrar = null;
        let createdAt = null;
        let ageInDays = null;
        let ageRisk = null;
        let isPrivacyProtected = null;

        // Only if domain exists
        if (dns) {
          // WHOIS
          const whoisData = await getWhoisData(item.variant);

          registrar = whoisData.registrar;
          createdAt = whoisData.creationDate;

          // Age check
          const ageData = analyzeDomainAge(createdAt);
          ageInDays = ageData.ageInDays;
          ageRisk = ageData.ageRisk;

          // Privacy check
          isPrivacyProtected = checkPrivacy(whoisData.owner);
        }

        return {
          domain: item.variant,
          similarity: item.similarity,
          dns,

          registrar,
          createdAt,

          ageInDays,
          ageRisk,

          isPrivacyProtected,
        };
      }),
    );

    // Save original domain 
    const existing = await Scan.findOne({ original_domain: domain });
    if (!existing) {
      const newScan = new Scan({
        original_domain: domain,
      });
      await newScan.save();
    }

    // Final response
    res.json(finalResults);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error in full scan pipeline" });
  }
};
