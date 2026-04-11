import { analyzeDomain } from '../Domain-analysis/analysis.js';
import logger from '../Middlewares/Logger.js';

const fullScan = async (req, res) => {
  const { domain } = req.body;

  try {
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: "Domain is required"
      });
    }

    logger.info(`SCAN STARTED: ${domain}`);
    const result = await  analyzeDomain(domain);
    logger.info(`SCAN COMPLETED: ${domain}`);

    res.json({
      success: true,
      domain: result.domain,
      status: result.status,
      totalVariants: result.totalVariants,
      variants: result.variants,
      dnsResults: result.dnsResults,
      message: `Scan complete for ${domain}`
    });

  } catch (error) {
    logger.info(`SCAN FAILED: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export { fullScan };