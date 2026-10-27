const router = require("express").Router();
const helpController = require("../controllers/helpController");

router.get("/", helpController.index);

router.get("/guide", helpController.guide);

module.exports = router;