const activityService = require("../services/activityService");

exports.index = async (req, res) => {
  const logs = await activityService.getLogs();

  res.render("activity/index", {
    title: "Histori Log",

    logs,
  });
};
