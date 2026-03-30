// DnsChecker.js

import dns from "dns/promises";

// Function to check if a domain exists
export async function checkDNS(domain) {
  try {
    const addresses = await dns.lookup(domain); // IPv4 check
    return addresses ? true : false; // Returns true if at least one IP found
  } catch (error) {
    return false; // Returns false if domain is invalid or DNS lookup fails
  }
}

