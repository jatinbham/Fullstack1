const express = require("express");
const router = express.Router();
const { createMatchRequest, trackRequest, getRequests } = require("../controllers/requestController");

router.post("/matching", createMatchRequest);
router.get("/track/:id", trackRequest);
router.get("/", getRequests);

module.exports = router;
