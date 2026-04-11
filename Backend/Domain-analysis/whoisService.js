export async function getWhoisData(domain) {
  // Temporary fallback (WHOIS disabled)

  return {
    domain,
    registrar: "Unknown",
    creationDate: null,
    owner: "Unknown",
  };
}