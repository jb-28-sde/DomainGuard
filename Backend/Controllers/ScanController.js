import Scan from "../Models/ScanModel.js";
import { checkDNS } from "../Domain-analysis/DnsChecker.js";
import generateVariants from "../Domain-analysis/DomainvariantGenerator.js";
import { generatePhishingVariants } from "../Domain-analysis/DomainvariantGenerator.js";
import { checkSuspiciousTLD } from "../Domain-analysis/TldChecker.js";
import { calculateSimilarityForVariants } from "../Domain-analysis/SimilarityCalculator.js";

export const createScan = (req, res) => {
  const inputDomain = req.body.domain;
  if (!inputDomain) {
    return res.status(400).json({ message: "Domain is required" });
  }

  let domain = inputDomain.toLowerCase();
  domain = domain.replace("https://", "");
  domain = domain.replace("http://", "");
  domain = domain.replace("www.", "");

  if (domain.includes("/")) {
    domain = domain.split("/")[0];
  }

  //data save in database
  const newScan = new Scan({
    original_domain: domain,
  });
  newScan
    .save()
    .then(() => {
      res.json({
        message: "Domain saved",
        domain: domain,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: "error saving domain" });
    });
};
export const generateDomainVariants = (req, res) => {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ message: "Domain is required" });
  }

  const variants = generateVariants(domain);

  //calculate similarity for each variant
  const variantSimilarity = calculateSimilarityForVariants(domain,variants)

  res.json({
    original: domain,
    total: variants.length,
    variantSimilarity
  });
};
// it handle the request coming from frontend(API CALL)
export const checkDomainDNS = async (req, res) => {
  try {
     const { domain } = req.body;
     if(!domain) {
      return res.status(400).json({ message: "Domain is required" });
     }
     const result = await checkDNS(domain);
     res.json({
      domain,
      isValid : result,
     });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error checking DNS" });
  }
}
//controller to generate phishing-style domain variants
export const generatePhishingDomains = (req, res) => {
  const { domain } = req.body;
  //check if domain is provided  
  if (!domain) {
    return res.status(400).json({ message: "Domain is required" });
  }
  const variants = generatePhishingVariants(domain);
  res.json({
    original: domain,
    total: variants.length,
    variants,
  });
};
// controller to check suspicious TLD
export const checkTLD = (req, res) => {
  const { domain } = req.body;

  // validate input
  if (!domain) {
    return res.status(400).json({ message: "Domain is required" });
  }

  // call TLD checker logic
  const result = checkSuspiciousTLD(domain);

  // send response
  res.json({
    domain,
    tld: result.tld,
    isSuspicious: result.isSuspicious,
  });
};
