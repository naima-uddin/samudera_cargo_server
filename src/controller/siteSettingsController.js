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

    // Guard against oversized image payloads (base64). Allow images up to
    // ~20MB; base64 inflates by ~33%, so cap the text length accordingly.
    const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
    const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES * 1.4);
    for (const field of ["logo", "favicon"]) {
      if (updates[field] && updates[field].length > MAX_BASE64_LENGTH) {
        return res.status(413).json({
          success: false,
          message: `${field} is too large. Please upload an image under 20MB.`,
        });
      }
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
