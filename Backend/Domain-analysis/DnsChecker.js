import dns from "dns/promises";
@parameters {domain: string}
@returns {Boolean}
export const checkDns = async (domain) => {
    try {
        const addresses=await dns.resolve(domain);
        return addresses.length > 0;
    } catch (error) {
        console.log("DNS check failed:",error.message);
        return false;
    }
};