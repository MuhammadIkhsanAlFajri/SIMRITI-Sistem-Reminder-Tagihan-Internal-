const router = require("express").Router();

const controller = require("../controllers/activityController");

router.get("/", controller.index);

module.exports = router;
