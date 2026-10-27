const app = require("./app");

const reminderScheduler = require("./services/reminderScheduler");

const emailService = require("./services/emailService");

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log("--------------------------------");

  console.log("SIMRITI SERVER");

  console.log("http://localhost:" + PORT);

  console.log("--------------------------------");

  // Verifikasi koneksi Gmail
  await emailService.verifyEmailConnection();

  // Jalankan Reminder Scheduler
  reminderScheduler.start();
});
