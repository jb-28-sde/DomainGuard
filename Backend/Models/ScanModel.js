import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    brandName: {
    // 🔹 Original input domain
    original_domain: {
      type: String,
      required: true,
    },

    scanDate: {
      type: Date,
      default: Date.now,
    // 🔹 Generated domain (variant)
    generated_domain: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // 🔹 Similarity score
    similarity_score: {
      type: Number,
      min: [0, "Similarity score cannot be negative"],
      max: [100, "Similarity score cannot exceed 100"],
    },

    // 🔹 DNS & WHOIS Info
    dns_exists: {
      type: Boolean,
      default: false,
    },

    registrar: {
      type: String,
      default: null,
    },

    createdAtDomain: {
      type: String,
      default: null,
    },

    owner: {
      type: String,
      default: null,
    },

    // 🔹 Domain Age
    ageInDays: {
      type: Number,
      default: null,
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
    // 🔹 Privacy
    isPrivacyProtected: {
      type: Boolean,
      default: null,
    },

    // 🔹 TLD Info
    tld: {
      type: String,
      default: null,
    },

    tldRisk: {
      type: String,
      default: null,
    },

    // 🔹 Impersonation Score
    impersonation_score: {
      type: Number,
    },

    // 🔹 Final Risk Level
    risk_level: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
    },



    // 🔹 Scan tracking (group multiple domains under one scan)
    scan_id: {
      type: String,
      required: true,
      index: true,
    },

    // 🔹 Total domains in this scan
    total_domains: {
      type: Number,
      default: 0,
    },

    // 🔹 How many domains processed so far
    scanned_domains: {
      type: Number,
      default: 0,
    },

    // 🔹 Progress percentage (0–100)
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // 🔹 Optional: store status
    status: {
      type: String,
      enum: ["Pending", "Running", "Completed"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

const Scan = mongoose.model("Scan", scanSchema);

export default Scan;
