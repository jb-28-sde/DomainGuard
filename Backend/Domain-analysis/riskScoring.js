export const calculateRiskScore = ({
  similarity,
  dns,
  isPrivacyProtected,
  ageInDays,
  tldRisk,
  infraRisk,
}) => {
  // If domain does not exist, keep score low
  if (!dns) return 0;

  const similarityScore = similarity;

  const privacyScore = isPrivacyProtected ? 20 : 0;

  let ageScore = 0;
  if (ageInDays !== null) {
    if (ageInDays < 30) ageScore = 10;
    else if (ageInDays <= 180) ageScore = 5;
  }

  const tldScore = tldRisk === "HIGH" ? 10 : 0;

  let infraScore = 0;
  if (infraRisk === "HIGH") infraScore = 20;
  else if (infraRisk === "MEDIUM") infraScore = 10;

  const totalScore =
    similarityScore * 0.4 +
    privacyScore * 0.2 +
    ageScore * 0.1 +
    tldScore * 0.1 +
    infraScore * 0.2;

  return Math.round(totalScore);
};

export const getRiskLevel = (score) => {
  if (score <= 30) return "LOW";
  if (score <= 60) return "MEDIUM";
  if (score <= 80) return "HIGH";
  return "CRITICAL";
};
