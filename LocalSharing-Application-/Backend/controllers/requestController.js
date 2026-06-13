const Request = require("../models/Request");
const triggerN8n = require("../utils/triggerN8n");

const createMatchRequest = async (req, res) => {
  try {
    const reqCount = await Request.countDocuments();
    const customId = `REQ-${1000 + reqCount + 1}`;
    
    const requestData = {
      requestId: customId,
      ...req.body,
    };

    const newRequest = await Request.create(requestData);

    await triggerN8n(process.env.N8N_MATCHING_NOTIFY_URL, {
      id: newRequest._id,
      requestId: newRequest.requestId,
      ...req.body,
      timestamp: newRequest.createdAt,
    });

    res.status(201).json({
      message: "Request submitted successfully for matching",
      request: newRequest,
    });
  } catch (error) {
    console.error("Request match error:", error.message);
    res.status(500).json({ message: "Server error submitting request" });
  }
};

const trackRequest = async (req, res) => {
  try {
    const request = await Request.findOne({ requestId: req.params.id });
    if (!request) {
      return res.status(404).json({ message: "Request ID not found" });
    }
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching tracking info" });
  }
};

const getRequests = async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 }).limit(20);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching requests" });
  }
};

module.exports = { createMatchRequest, trackRequest, getRequests };
