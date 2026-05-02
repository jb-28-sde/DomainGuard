export const processDomainData = (data) => {
  if (!data || !Array.isArray(data)) {
    return {
      all: [],
      highSimilarity: [],
      risky: [],
    };
  }

  const cleaned = data.map((item) => {
    const newItem = {};

    for (const key in item) {
      if (key === "dns_exists") {
        newItem.dns = item[key];
        newItem.dns_exists = item[key];
      } else if (key === "createdAt" && item[key]) {
        const parsedDate = new Date(item[key]);
        newItem[key] = Number.isNaN(parsedDate.getTime())
          ? item[key]
          : parsedDate.toLocaleDateString("en-GB");
      } else {
        newItem[key] =
          item[key] === null || item[key] === undefined ? "N/A" : item[key];
      }
    }

    return newItem;
  });

  cleaned.sort((a, b) => {
    const simA = typeof a.similarity === "number" ? a.similarity : 0;
    const simB = typeof b.similarity === "number" ? b.similarity : 0;
    return simB - simA;
  });

  const highSimilarity = cleaned.filter(
    (item) => typeof item.similarity === "number" && item.similarity >= 80,
  );

  const risky = cleaned.filter(
    (item) =>
      item.ageRisk === "HIGH" ||
      item.ageRisk === "MEDIUM" ||
      item.risk_level === "HIGH" ||
      item.risk_level === "CRITICAL",
  );

  return {
    all: cleaned,
    highSimilarity,
    risky,
  };
};
