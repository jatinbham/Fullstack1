const express = require("express");
const router = express.Router();
const { registerDonor, getDonors } = require("../controllers/donorController");

router.post("/register", registerDonor);
router.get("/", getDonors);

module.exports = router;
