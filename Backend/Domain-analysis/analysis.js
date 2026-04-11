import generateVariants from './DomainvariantGenerator.js';
import { checkDNS } from './DnsChecker.js';
import { calculateSimilarityForVariants } from './SimilarityCalculator.js';

export async function analyzeDomain(domain) {
  console.log("Analyzing domain:", domain);

  // 1. Generate typo variants
  const variants = generateVariants(domain);

  // 2. Check DNS for each variant
  const dnsResults = await Promise.all(
    variants.map(async (variant) => {
      const exists = await checkDNS(variant);
      return { variant, exists };
    })
  );

  // 3. Calculate similarity scores
  const similarityResults = calculateSimilarityForVariants(
    domain, variants
  );

  // 4. Return full result
  return {
    domain,
    totalVariants: variants.length,
    variants: similarityResults.slice(0, 10),
    dnsResults: dnsResults.filter(d => d.exists).slice(0, 5),
    status: dnsResults.some(d => d.exists) ? "suspicious" : "safe"
  };
}

