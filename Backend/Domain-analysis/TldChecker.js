const suspiciousTLDs = ["xyz", "top", "ru", "click"];

export const checkSuspiciousTLD = (domain) => {
  if (!domain || !domain.includes(".")) {
    return { tld: null, isSuspicious: false };
  }

  const parts = domain.split(".");
  const tld = parts[parts.length - 1].toLowerCase();

  const isSuspicious = suspiciousTLDs.includes(tld);

  return {
    tld,
    isSuspicious,
  };
};