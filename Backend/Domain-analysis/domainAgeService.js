export function analyzeDomainAge(creationDate) {
  // if creation date not found
  if (!creationDate) {
    return {
      ageInDays: null,
      ageRisk: "MEDIUM",
    };
  }

  const created = new Date(creationDate);
  const now = new Date();

  // Invalid date case
  if (isNaN(created)) {
    return {
      ageInDays: null,
      ageRisk: "MEDIUM",
    };
  }

  // Difference in days
  const diffTime = now - created;

  const ageInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  //  Risk classification
  let ageRisk = "LOW";

  if (ageInDays <= 7) {
    ageRisk = "HIGH";
  } else if (ageInDays <= 30) {
    ageRisk = "MEDIUM";
  }

  return {
    ageInDays,
    ageRisk,
  };
}
