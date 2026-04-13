export const getRecommendations = (domainData) => {
  const recommendations = [];

  const { risk_level, isPrivacyProtected, ageInDays } = domainData;

  // Critical
  if (risk_level === "Critical") {
    recommendations.push("Immediate takedown request");
    recommendations.push("Contact hosting provider");
    recommendations.push("Initiate legal action");
  }

  // High
  else if (risk_level === "High") {
    recommendations.push("Report domain to registrar");
    recommendations.push("Monitor DNS activity");
    recommendations.push("Add to blacklist");
  }

  // Medium
  else if (risk_level === "Medium") {
    recommendations.push("Keep monitoring domain");
    recommendations.push("Set up alerts");
  }

  // Low
  else {
    recommendations.push("No immediate action required");
  }

  // Privacy check
  if (isPrivacyProtected) {
    recommendations.push("Investigate hidden ownership");
  }

  // Domain age check
  if (ageInDays < 30) {
    recommendations.push("New domain - high alert");
  }

  return recommendations;
};