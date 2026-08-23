// controller/siteSettingsController.js
const SiteSettings = require("../models/siteSettingsModel");

// Fields an admin is allowed to update via the dashboard.
const EDITABLE_FIELDS = [
  "logo",
  "favicon",
  "companyName",
  "phone",
  "whatsapp",
  "email",
  "address",
  "fax",
];

// Return the single settings document, creating it with defaults if missing.
const getOrCreateSettings = async () => {
  let settings = await SiteSettings.findOne({ key: "global" });
  if (!settings) {
    settings = await SiteSettings.create({ key: "global" });
  }
  return settings;
};

// GET /api/v1/site-settings  (public)
exports.getSiteSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("❌ getSiteSettings error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/site-settings  (admin only)
exports.updateSiteSettings = async (req, res) => {
  try {
    const updates = {};
    EDITABLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Guard against oversized logo payloads (base64). ~3MB of base64 text.
    if (updates.logo && updates.logo.length > 3 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: "Logo is too large. Please upload an image under ~2MB.",
      });
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { key: "global" },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json({
      success: true,
      message: "Site settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("❌ updateSiteSettings error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
