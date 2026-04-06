import mongoose from "mongoose";

const dnsRecordSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  A_record: {
    type: [String],
    default: [],
  },

  AAAA_record: {
    type: [String],
    default: [],
  },

  MX_record: {
    type: [String],
    default: [],
  },

  NS_record: {
    type: [String],
    default: [],
  },

  hosting_provider: {
    type: String,
    default: null,
  },

  risk_level: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH"],
    default: "LOW",
  },

  reason: {
    type: String,
    default: "",
  },

  scanned_at: {
    type: Date,
    default: Date.now,
  },
});

const DNSRecord = mongoose.model("dns_records", dnsRecordSchema);

export default DNSRecord;
