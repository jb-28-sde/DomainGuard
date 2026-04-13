import dns from "dns/promises";

// timeout wrapper
const withTimeout = (promise, ms = 4000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms),
    ),
  ]);
};

// MAIN FUNCTION
export const getDNSRecords = async (domain) => {
  try {
    const result = {
      A: [],
      AAAA: [],
      MX: [],
      NS: [],
      exists: false,
    };

    // IPv4
    try {
      const aRecords = await withTimeout(dns.resolve4(domain));
      result.A = aRecords;
      if (aRecords.length > 0) result.exists = true;
    } catch (err) {
      
    }

    // IPv6
    try {
      const aaaaRecords = await withTimeout(dns.resolve6(domain));
      result.AAAA = aaaaRecords;
    } catch (err) {}

    // Mail servers
    try {
      const mxRecords = await withTimeout(dns.resolveMx(domain));
      result.MX = mxRecords.map((mx) => mx.exchange);
    } catch (err) {}

    // Name servers
    try {
      const nsRecords = await withTimeout(dns.resolveNs(domain));
      result.NS = nsRecords;
    } catch (err) {}

    return result;
  } catch (error) {
    return {
      A: [],
      AAAA: [],
      MX: [],
      NS: [],
      exists: false,
    };
  }
};
