// DnsChecker.js

import dns from "dns/promises";

// Function to check if a domain exists
export async function checkDNS(domain) {
  try {
    const addresses = await dns.resolve(domain, "A"); // IPv4 check
    return addresses.length > 0; // Returns true if at least one IP found
  } catch (error) {
    return false; // Returns false if domain is invalid or DNS lookup fails
  }
}

