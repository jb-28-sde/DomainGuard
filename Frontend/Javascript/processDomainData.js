export const processDomainData = (data) => {
  if (!data || !Array.isArray(data)) {
    return {
      all: [],
      highSimilarity: [],
      risky: []
    };
  }

  // Step 1 - Filter: keep only dns === true
  let filtered = data.filter(item => item.dns === true);

  // Step 2 - Clean: replace null with "N/A"
  let cleaned = filtered.map(item => {
    let newItem = {};
    for (let key in item) {
      newItem[key] = item[key] === null ? "N/A" : item[key];
    }
    return newItem;
  });

  // Step 3 - Sort: similarity highest to lowest
  cleaned.sort((a, b) => b.similarity - a.similarity);

  // Step 4 - Filter options
  let highSimilarity = cleaned.filter(item => item.similarity >= 90);

  let risky = cleaned.filter(item =>
    item.ageRisk === "HIGH" || item.ageRisk === "MEDIUM"
  );

  return {
    all: cleaned,
    highSimilarity,
    risky
  };
};