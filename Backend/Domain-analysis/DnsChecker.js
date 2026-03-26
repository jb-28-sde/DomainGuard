const dns = require('dns').promises;

module.exports = async function(domain) {
    try {
        await dns.lookup(domain);
        return true;
    } catch (err) {
        return false;
    }
};