const BloodDonor = require("../models/BloodDonor");
const triggerN8n = require("../utils/triggerN8n");

const registerDonor = async (req, res) => {
  try {
    const donor = await BloodDonor.create(req.body);

    await triggerN8n(process.env.N8N_BLOOD_DONOR_URL, {
      donorId: donor._id,
      ...req.body,
      timestamp: donor.createdAt,
    });

    res.status(201).json({
      message: "Blood donor registered successfully",
      donor,
    });
  } catch (error) {
    console.error("Donor registration error:", error.message);
    res.status(500).json({ message: "Server error registering donor" });
  }
};

const getDonors = async (req, res) => {
  try {
    const donors = await BloodDonor.find().sort({ createdAt: -1 }).limit(20);
    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching donors" });
  }
};

module.exports = { registerDonor, getDonors };
