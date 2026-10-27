require("dotenv").config();

const telegramReminderService = require("./services/telegramReminderService");

async function test() {
  try {
    await telegramReminderService.processReminders();

    console.log("==============================");
    console.log("REMINDER SELESAI");
    console.log("==============================");
  } catch (error) {
    console.error("REMINDER ERROR:", error);
  }
}

test();