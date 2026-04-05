import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    original_domain: {
      type: String,
      required: [true, "Original domain is required"],
      trim: true,
      lowercase: true,
    },

    generated_domain: {
      type: String,
      trim: true,
      lowercase: true,
    },

    similarity_score: {
      type: Number,
      min: [0, "Similarity score cannot be negative"],
      max: [100, "Similarity score cannot exceed 100"],
    },

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

    ageInDays: {
      type: Number,
      default: null,
    },

    ageRisk: {
      type: String,
      default: null,
    },

    isPrivacyProtected: {
      type: Boolean,
      default: null,
    },
       tld: {
      type: String,
      default: null,
    },
    tldRisk: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Scan = mongoose.model("Scan", scanSchema);

export default Scan;
