const express = require("express");
const router = express.Router();
const { triggerAlert, getAlerts } = require("../controllers/alertController");

router.post("/trigger", triggerAlert);
router.get("/", getAlerts);

module.exports = router;
