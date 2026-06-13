const Alert = require("../models/Alert");
const triggerN8n = require("../utils/triggerN8n");

const triggerAlert = async (req, res) => {
  const { name, location } = req.body;
  if (!name || !location) {
    return res.status(400).json({ message: "Name and location are required" });
  }

  try {
    const alert = await Alert.create({ name, location });

    await triggerN8n(process.env.N8N_USER_ALERT_URL, {
      alertId: alert._id,
      name,
      location,
      timestamp: alert.createdAt,
    });

    res.status(201).json({
      message: "Alert trigger registered successfully",
      alert,
      responseInterface: {
        header: `Emergency response alert active for ${location}`,
        severity: "critical",
        respondersDispatched: 3,
        safetyShelter: `Civil Lines Community Hall, ${location}`,
        broadcastReach: "4.8 km radius",
      },
    });
  } catch (error) {
    console.error("Alert trigger error:", error.message);
    res.status(500).json({ message: "Server error triggering alert" });
  }
};

const getAlerts = async (req, res) => {
  try {
    const dbAlerts = await Alert.find().sort({ createdAt: -1 }).limit(10);
    res.json(dbAlerts);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching alerts" });
  }
};

module.exports = { triggerAlert, getAlerts };
