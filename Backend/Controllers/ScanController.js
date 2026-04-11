import { scanQueue } from "../queue/scanQueue.js";
import Scan from "../Models/ScanModel.js";


export const FullScan = async (req, res) => {
  try {
    const { domain: inputDomain } = req.body;

    if (!inputDomain) {
      return res.status(400).json({ message: "Domain is required" });
    }

  

    let domain = inputDomain
      .toLowerCase()
      .replace("https://", "")
      .replace("http://", "")
      .replace("www.", "");

    if (domain.includes("/")) {
      domain = domain.split("/")[0];
    }

  

    const job = await scanQueue.add("scan-job", { domain });

    return res.json({
      message: "Scan started 🚀",
      jobId: job.id,
      domain: domain,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error starting scan" });
  }
};



export const getScanResult = async (req, res) => {
  try {
    const { domain } = req.params;

    const result = await Scan.findOne({ original_domain: domain });

    if (!result) {
      return res.json({
        status: "processing",
        message: "Scan abhi chal raha hai...",
      });
    }

    return res.json({
      status: "completed",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching result" });
  }
};