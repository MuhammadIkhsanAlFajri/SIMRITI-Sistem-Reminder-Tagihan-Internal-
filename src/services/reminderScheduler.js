const telegramReminderService = require("./telegramReminderService");

const emailReminderService = require("./emailReminderService");

let isRunning = false;

const runReminder = async () => {
  if (isRunning) {
    console.log("Reminder masih berjalan, skip...");

    return;
  }

  isRunning = true;

  try {
    console.log("--------------------------------");

    console.log("Menjalankan pengecekan reminder...");

    console.log(new Date().toLocaleString("id-ID"));

    // TELEGRAM

    await telegramReminderService.processReminders();

    // EMAIL

    await emailReminderService.processReminders();

    console.log("Pengecekan reminder selesai.");

    console.log("--------------------------------");
  } catch (error) {
    console.error(
      "REMINDER SCHEDULER ERROR:",

      error.message,
    );
  } finally {
    isRunning = false;
  }
};

exports.start = () => {
  console.log("--------------------------------");

  console.log("REMINDER SCHEDULER AKTIF");

  console.log("Pengecekan dilakukan setiap 1 jam");

  console.log("--------------------------------");

  // Pertama kali server hidup

  runReminder();

  // Setiap 1 jam

  setInterval(
    runReminder,

    60 * 60 * 1000,
  );
};
