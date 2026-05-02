export const getRecommendations = (domainData) => {
  const recommendations = [];

  const { risk_level, isPrivacyProtected, ageInDays, dns_exists } = domainData;
  const normalizedRisk = String(risk_level || "LOW").toUpperCase();

  // Critical
  if (normalizedRisk === "CRITICAL") {
    recommendations.push("Immediate takedown request");
    recommendations.push("Contact hosting provider");
    recommendations.push("Initiate legal action");
  }

  // High
  else if (normalizedRisk === "HIGH") {
    recommendations.push("Report domain to registrar");
    recommendations.push("Monitor DNS activity");
    recommendations.push("Add to blacklist");
  }

  // Medium
  else if (normalizedRisk === "MEDIUM") {
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

  if (dns_exists) {
    recommendations.push("Capture hosting evidence for escalation");
  }

  // Domain age check
  if (typeof ageInDays === "number" && ageInDays < 30) {
    recommendations.push("New domain - high alert");
  }

  return recommendations;
};
