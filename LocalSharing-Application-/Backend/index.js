require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const mongoose = require("mongoose");

const connectDB = require("./db");
const User = require("./models/User");
const Alert = require("./models/Alert");
const BloodDonor = require("./models/BloodDonor");
const Request = require("./models/Request");
const Volunteer = require("./models/Volunteer");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect Database
connectDB();

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "super_secret_resqlink_key_2026", {
    expiresIn: "30d",
  });
};

// Middleware to protect routes (optional validation/session check)
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_secret_resqlink_key_2026");
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }
      return next();
    } catch (error) {
      console.error("JWT validation error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Helper to trigger n8n webhooks in background
const triggerN8n = async (webhookUrl, data) => {
  if (!webhookUrl) {
    console.log(`n8n Webhook URL is not configured. Data stored in DB only.`);
    return { success: false, reason: "Webhook not configured" };
  }
  try {
    console.log(`Forwarding workflow data to n8n: ${webhookUrl}`);
    const response = await axios.post(webhookUrl, data);
    console.log(`n8n trigger success: Status ${response.status}`);
    return { success: true };
  } catch (error) {
    console.error(`Error triggering n8n webhook (${webhookUrl}): ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ─── AUTHENTICATION ROUTES ───────────────────────────────────────────────────

// Signup
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, phone, password, role, location } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      location,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      location: user.location,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ message: "Server error during registration", error: error.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check by email or phone
    const user = await User.findOne({
      $or: [{ email: email }, { phone: email }],
    });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
});

// Get User Profile
app.get("/api/auth/me", protect, async (req, res) => {
  res.json(req.user);
});

// ─── WORKFLOW ROUTES ──────────────────────────────────────────────────────────

// 1. User Alert Workflow
app.post("/api/alerts/trigger", async (req, res) => {
  const { name, location } = req.body;
  if (!name || !location) {
    return res.status(400).json({ message: "Name and location are required" });
  }

  try {
    const alert = await Alert.create({ name, location });

    // Trigger n8n user alert workflow
    await triggerN8n(process.env.N8N_USER_ALERT_URL, {
      alertId: alert._id,
      name,
      location,
      timestamp: alert.createdAt,
    });

    // Generate responsive interface state matching user location
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
});

// Get Alerts List (used by frontend alerts screen)
app.get("/api/alerts", async (req, res) => {
  try {
    const dbAlerts = await Alert.find().sort({ createdAt: -1 }).limit(10);
    res.json(dbAlerts);
  } catch (error) {
    console.error("Fetch alerts error:", error.message);
    res.status(500).json({ message: "Server error fetching alerts" });
  }
});


// 2. Become Blood Donor Workflow
app.post("/api/donors/register", async (req, res) => {
  const { name, location, phone, email, resourceType, age, gender, bloodGroup, available } = req.body;
  try {
    const donor = await BloodDonor.create({
      name,
      location,
      phone,
      email,
      resourceType: resourceType || "Blood",
      age,
      gender,
      bloodGroup,
      available: available !== undefined ? available : true,
    });

    // Trigger n8n Become blood donor workflow
    await triggerN8n(process.env.N8N_BLOOD_DONOR_URL, {
      donorId: donor._id,
      name,
      location,
      phone,
      email,
      resourceType: donor.resourceType,
      age,
      gender,
      bloodGroup,
      available: donor.available,
      timestamp: donor.createdAt,
    });

    res.status(201).json({ message: "Registered as a blood donor successfully", donor });
  } catch (error) {
    console.error("Donor registration error:", error.message);
    res.status(500).json({ message: "Server error registering donor", error: error.message });
  }
});

app.get("/api/donors", async (req, res) => {
  try {
    const donors = await BloodDonor.find().sort({ createdAt: -1 });
    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching donors" });
  }
});


// 3. Matching and Notify Workflow
app.post("/api/requests/matching", async (req, res) => {
  const { name, phone, location, resourceNeeded, email, title, description, priority, userId } = req.body;
  try {
    // Generate a unique request number REQ-XXXX
    const reqNum = "REQ-" + Math.floor(1000 + Math.random() * 9000);

    // Setup initial timeline and responder for premium UI preview
    const timeline = [
      { label: "Request submitted", time: "Just now", done: true },
      { label: "AI matching in progress", time: "Pending", done: false },
      { label: "Responder assigned", time: "—", done: false },
    ];

    const request = await Request.create({
      name,
      phone,
      location,
      resourceNeeded,
      email,
      title,
      description,
      priority: priority || "med",
      status: "pending",
      timeline,
      user: userId || null,
    });

    // Set custom text field for MongoDB model or use schema key
    // We override request.id matching display in response
    const requestData = request.toObject();
    requestData.id = reqNum; // UI compatibility

    // Trigger n8n matching & notification workflow
    await triggerN8n(process.env.N8N_MATCHING_NOTIFY_URL, {
      requestId: request._id,
      id: reqNum,
      name,
      phone,
      location,
      resourceNeeded,
      email,
      title,
      description,
      priority,
      timestamp: request.createdAt,
    });

    res.status(201).json({
      message: "Request registered and matching initiated",
      request: { ...requestData, id: reqNum },
    });
  } catch (error) {
    console.error("Request matching error:", error.message);
    res.status(500).json({ message: "Server error registering request", error: error.message });
  }
});

app.get("/api/requests", async (req, res) => {
  try {
    const dbRequests = await Request.find().sort({ createdAt: -1 });
    // Map database ID to custom REQ-XXXX format for frontend compatibility
    const mapped = dbRequests.map((r, i) => {
      const obj = r.toObject();
      obj.id = obj.id || `REQ-${2800 - i}`;
      return obj;
    });
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching requests" });
  }
});


// 4. Tracking Progress Workflow
app.get("/api/requests/track/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Find request by MongoDB _id or query matching regex for timeline preview
    // We also support looking it up via the custom ID or name
    let request = await Request.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { title: new RegExp(id, "i") },
        { name: new RegExp(id, "i") }
      ]
    });

    // Fallback: search if we stored a custom id or simulate query
    if (!request) {
      // Create a mock tracking if request matches the demo ones
      if (id.startsWith("REQ-")) {
        // Find by custom mapping, or return dummy matching data
        // Let's trigger tracking workflow anyway to verify URL integration
        await triggerN8n(process.env.N8N_TRACKING_PROGRESS_URL, {
          trackedId: id,
          queriedAt: new Date(),
        });

        return res.json({
          id: id,
          title: "Emergency resource tracking",
          location: "Location under tracking",
          status: "in-progress",
          priority: "HIGH",
          timeline: [
            { label: "Request submitted", time: "10 mins ago", done: true },
            { label: "AI matching complete", time: "8 mins ago", done: true },
            { label: "Responder dispatched", time: "5 mins ago", done: true },
            { label: "Arriving at destination", time: "ETA 4m", done: false }
          ],
          responder: {
            name: "John Doe (ResQ Volunteer)",
            type: "Emergency Responder",
            eta: "4 mins",
            phone: "+91 99999 88888"
          }
        });
      }
      return res.status(404).json({ message: "Request tracking ID not found" });
    }

    // Trigger n8n tracking progress workflow
    await triggerN8n(process.env.N8N_TRACKING_PROGRESS_URL, {
      requestId: request._id,
      title: request.title,
      status: request.status,
      timestamp: new Date(),
    });

    res.json(request);
  } catch (error) {
    console.error("Tracking progress error:", error.message);
    res.status(500).json({ message: "Server error tracking request" });
  }
});


// 5. Become Volunteer Workflow
app.post("/api/volunteers/register", async (req, res) => {
  const { name, phone, location, volunteerType, available, email } = req.body;
  try {
    const volunteer = await Volunteer.create({
      name,
      phone,
      location,
      volunteerType,
      available: available !== undefined ? available : true,
      email,
    });

    // Trigger n8n Become volunteer workflow
    await triggerN8n(process.env.N8N_BECOME_VOLUNTEER_URL, {
      volunteerId: volunteer._id,
      name,
      phone,
      location,
      volunteerType,
      available: volunteer.available,
      email,
      timestamp: volunteer.createdAt,
    });

    res.status(201).json({ message: "Registered as volunteer successfully", volunteer });
  } catch (error) {
    console.error("Volunteer registration error:", error.message);
    res.status(500).json({ message: "Server error registering volunteer", error: error.message });
  }
});

app.get("/api/volunteers", async (req, res) => {
  try {
    const list = await Volunteer.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching volunteers" });
  }
});

// App Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in mode on port ${PORT}`);
});
