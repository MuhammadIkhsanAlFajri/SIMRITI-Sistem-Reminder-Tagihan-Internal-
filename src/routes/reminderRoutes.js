const express = require("express");
const router = express.Router();

const reminderController = require("../controllers/reminderController");

router.get("/", reminderController.index);

router.post("/", reminderController.store);

module.exports = router;
