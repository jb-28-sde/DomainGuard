import whois from "whois-json";

export async function getWhoisData(domain) {
  try {
    // WHOIS call
    const data = await whois(domain);

    //  Normalize fields (different TLDs → different keys)
    const registrar = data.registrar || data.Registrar || "Unknown";

    const creationDate =
      data.creationDate ||
      data.createdDate ||
      data.registeredOn ||
      data.created ||
      null;

    const owner =
      data.org ||
      data.owner ||
      data.registrant ||
      data.RegistrantOrganization ||
      "Unknown";

    // Clean response
    return {
      domain,
      registrar,
      creationDate,
      owner,
    };
  } catch (error) {
    //  Error handling
    return {
      domain,
      registrar: "Unknown",
      creationDate: null,
      owner: "Unknown",
    };
  }
}
