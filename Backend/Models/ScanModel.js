import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    scan_id: {
      type: String,
      required: true,
      index: true,
    },

    original_domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    scanDate: {
      type: Date,
      default: Date.now,
    },

    total_domains: {
      type: Number,
      default: 0,
    },

    scanned_domains: {
      type: Number,
      default: 0,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["Pending", "Running", "Completed", "Failed"],
      default: "Pending",
    },

    results: [
      {
        domain: String,
        similarity: Number,

        dns_exists: Boolean,

        registrar: String,
        owner: String,
        createdAt: String,

        ageInDays: Number,
        ageRisk: String,

        isPrivacyProtected: Boolean,

        tld: String,
        tldRisk: String,

        impersonation_score: Number,
        risk_level: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Scan = mongoose.models.Scan || mongoose.model("Scan", scanSchema);

export default Scan;
