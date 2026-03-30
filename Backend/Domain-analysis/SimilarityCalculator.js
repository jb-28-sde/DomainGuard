// Input validation
function validateInput(str) {
  return typeof str === "string" && str.trim().length > 0;
}

// Optimized 2-row DP Levenshtein distance
function levenshteinOptimized(a, b) {
  if (!validateInput(a) || !validateInput(b)) return Infinity;

  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array(a.length + 1)
    .fill(0)
    .map((_, i) => i);
  let curr = Array(a.length + 1).fill(0);

  for (let i = 1; i <= b.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = Math.min(
          prev[j] + 1, // deletion
          curr[j - 1] + 1, // insertion
          prev[j - 1] + 1, // substitution
        );
      }
    }
    [prev, curr] = [curr, prev]; // swap for next iteration
  }

  return prev[a.length];
}

// Calculate similarity % between original and single variant
export function calculateSimilarity(original, variant) {
  if (!validateInput(original) || !validateInput(variant)) return 0;

  const distance = levenshteinOptimized(original, variant);
  const maxLength = Math.max(original.length, variant.length);
  return parseFloat(((1 - distance / maxLength) * 100).toFixed(2));
}

// Calculate similarity for multiple variants with threshold filter + sorting
export function calculateSimilarityForVariants(
  original,
  variants,
  threshold = 70,
) {
  if (!Array.isArray(variants)) return [];

  return variants
    .map((variant) => ({
      variant,
      similarity: calculateSimilarity(original, variant),
    }))
    .filter((v) => v.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}
