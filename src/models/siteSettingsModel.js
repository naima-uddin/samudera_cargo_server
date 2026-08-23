// models/siteSettingsModel.js
// Single-document collection that stores the site-wide identity/contact info
// (logo, company name, phone, email, address, fax, socials) so an admin can
// control what shows across the whole website from the dashboard.
const mongoose = require("mongoose");

const SiteSettingsSchema = new mongoose.Schema(
  {
    // Fixed key so we always read/update the same single document.
    key: {
      type: String,
      default: "global",
      unique: true,
      index: true,
    },

    // Logo stored as a base64 data URL string (e.g. "data:image/png;base64,....").
    logo: { type: String, default: "" },

    // Favicon stored as a base64 data URL string (shown in the browser tab).
    favicon: { type: String, default: "" },

    companyName: { type: String, default: "Samudera Traffic Co., Ltd." },
    phone: { type: String, default: "+66977830395" },
    whatsapp: { type: String, default: "66977830395" },
    email: { type: String, default: "info@samuderathai.com" },
    address: {
      type: String,
      default:
        "Green Tower, 9th floor, 3656/27-28 Rama IV Road, Klongton-Klong Toey, Bangkok 10110, Thailand",
    },
    fax: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", SiteSettingsSchema);
