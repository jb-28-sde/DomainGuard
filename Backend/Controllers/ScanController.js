import Scan from "../Models/ScanModel.js";

export const createScan = (req, res) => {
  const inputDomain = req.body.domain;
  if (!inputDomain) {
    return res.status(400).json({ message: "Domain is required" });
  }

  let domain = inputDomain.toLowerCase();
  domain = domain.replace("https://", "");
  domain = domain.replace("http://", "");
  domain = domain.replace("www.", "");

  if (domain.includes("/")) {
    domain = domain.split("/")[0];
  }

  //data save in database
  const newScan = new Scan({
    original_domain: domain,
  });
  newScan
    .save()
    .then(() => {
      res.json({
        message: "Domain saved",
        domain: domain,
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: "error saving domain" });
    });
};
