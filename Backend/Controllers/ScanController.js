<<<<<<< Updated upstream
import Scan from "../Models/ScanModel.js";

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
=======
const generateVariants = require('../Domain-analysis/DomainvariantGenerator');
const checkDNS = require('../Domain-analysis/DnsChecker');
const calculateSimilarity = require('../Domain-analysis/SimilarityCalculator');

const scanDomain = async (req, res) => {
    try {
        const { domain } = req.body;

        if (!domain) {
            return res.status(400).json({ error: "Domain is required" });
        }

        const variants = generateVariants(domain);

        //Parallel processing (fast)
        const results = await Promise.all(
            variants.map(async (variant) => {
                const exists = await checkDNS(variant);
                const similarity = calculateSimilarity(domain, variant);

                return {
                    domain: variant,
                    exists,
                    similarity
                };
            })
        );

        // Sort by similarity
        results.sort((a, b) => b.similarity - a.similarity);

        res.json({
            original: domain,
            scanned: results
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { scanDomain };
>>>>>>> Stashed changes
