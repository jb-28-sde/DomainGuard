import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: true,
    },

    scanDate: {
      type: Date,
      default: Date.now,
    },

    totalDomains: Number,

    results: [
      {
        domain: String,
        similarity: Number,
        dns: Boolean,
        registrar: String,
        createdAt: String,
        ageInDays: Number,
        ageRisk: String,
        isPrivacyProtected: Boolean,
        tld: String,
        tldRisk: String,
        risk_level: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Scan", scanSchema);