const reminderService = require("../services/reminderService");
const billService = require("../services/billService");

exports.index = async (req, res) => {
  const setting = await reminderService.getSetting();

  const bills = await reminderService.getReminderBills(req.query);

  const vendors = await reminderService.getVendors();

  res.render("reminder/index", {
    title: "Reminder",
    setting,
    bills,
    vendors,
    query: req.query,
  });
};

exports.store = async (req, res) => {
  await reminderService.saveSetting(req.body);

  res.redirect("/reminder");
};
