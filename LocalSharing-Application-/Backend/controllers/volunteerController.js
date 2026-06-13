const Volunteer = require("../models/Volunteer");
const triggerN8n = require("../utils/triggerN8n");

const registerVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.create(req.body);

    await triggerN8n(process.env.N8N_VOLUNTEER_REGISTER_URL, {
      volunteerId: volunteer._id,
      ...req.body,
      timestamp: volunteer.createdAt,
    });

    res.status(201).json({
      message: "Volunteer registered successfully",
      volunteer,
    });
  } catch (error) {
    console.error("Volunteer registration error:", error.message);
    res.status(500).json({ message: "Server error registering volunteer" });
  }
};

module.exports = { registerVolunteer };
