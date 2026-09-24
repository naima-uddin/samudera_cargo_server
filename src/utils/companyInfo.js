// utils/companyInfo.js
// Single source of truth for the company identity/contact info used in
// server-generated documents (invoice PDFs, emails). Reads the same
// SiteSettings document that the dashboard /settings page edits, so anything
// an admin changes there flows into every generated PDF automatically.
const SiteSettings = require("../models/siteSettingsModel");

// Fallbacks so a document never renders empty even if the DB is unreachable.
const DEFAULTS = {
  companyName: "Samudera Traffic Co., Ltd.",
  phone: "+66977830395",
  whatsapp: "66977830395",
  email: "info@samuderathai.com",
  address:
    "Green Tower, 9th floor, 3656/27-28 Rama IV Road, Klongton-Klong Toey, Bangkok 10110, Thailand",
  fax: "",
  logo: "",
  favicon: "",
};

// Returns an object shaped for the PDF generators. `name` is an alias of
// companyName because the existing generators read `companyInfo.name`.
const getCompanyInfo = async () => {
  const merged = { ...DEFAULTS };
  try {
    const settings = await SiteSettings.findOne({ key: "global" }).lean();
    if (settings) {
      Object.keys(DEFAULTS).forEach((key) => {
        const val = settings[key];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          merged[key] = val;
        }
      });
    }
  } catch (error) {
    console.error("⚠️ getCompanyInfo error, using defaults:", error.message);
  }

  return {
    ...merged,
    name: merged.companyName,
    // Generators that split address into two lines can use `address` as-is;
    // `city` kept empty because settings store one combined address string.
    city: "",
  };
};

module.exports = { getCompanyInfo, COMPANY_DEFAULTS: DEFAULTS };
