import generateVariants from "../Domain-analysis/DomainvariantGenerator.js";
import Scan from "../Models/ScanModel.js";
import { checkDNS } from "../Domain-analysis/DnsChecker.js";
import { calculateSimilarityForVariants } from "../Domain-analysis/SimilarityCalculator.js";

export const FullScan = async (req, res) => {
  try {
    const { domain: inputDomain } = req.body;

    if (!inputDomain) {
      return res.status(400).json({ message: "Domain is required" });
    }

    // Domain clean
    let domain = inputDomain.toLowerCase();
    domain = domain.replace("https://", "");
    domain = domain.replace("http://", "");
    domain = domain.replace("www.", "");

    if (domain.includes("/")) {
      domain = domain.split("/")[0];
    }

    // Generate variants
    const variants = generateVariants(domain);

    // Calculate similarity
    const similarityData = calculateSimilarityForVariants(domain, variants);

    // DNS check for each variant
    const finalResults = await Promise.all(
      similarityData.map(async (item) => {
        const dns = await checkDNS(item.variant);
        return {
          domain: item.variant,
          similarity: item.similarity,
          dns,
        };
      })
    );

    // Save original domain in MongoDB
    const existing = await Scan.findOne({ original_domain: domain });
    if (existing)
      return res.json({ message: "Domain already scanned", domain });

    const newScan = new Scan({
      original_domain: domain,
    });
    await newScan.save();

    // final response
    res.json(finalResults);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error in full scan pipeline" });
  }
};