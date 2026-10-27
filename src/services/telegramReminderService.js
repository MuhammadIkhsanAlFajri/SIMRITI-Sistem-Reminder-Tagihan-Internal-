const prisma = require("../config/database");

const telegramService = require("./telegramService");

const emailService = require("./emailService");

// ==============================
// FORMAT TANGGAL
// ==============================

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ==============================
// FORMAT NOMINAL
// ==============================

function formatAmount(amount) {
  if (amount === null || amount === undefined) {
    return "Belum ditentukan";
  }

  return Number(amount).toLocaleString("id-ID");
}

// ==============================
// AMBIL JATUH TEMPO AKTIF
// ==============================

function getActiveDueDate(bill) {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (bill.type === "BERULANG" && bill.previousDueDate && bill.nextDueDate) {
    const previousDueDate = new Date(bill.previousDueDate);

    previousDueDate.setHours(0, 0, 0, 0);

    // Jika periode sebelumnya sudah berakhir,
    // gunakan jatuh tempo berikutnya
    if (today > previousDueDate) {
      return bill.nextDueDate;
    }
  }

  return bill.dueDate;
}

// ==============================
// HITUNG STATUS AKTIF
// ==============================

function getActiveStatus(bill) {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  // ==========================================
  // TAGIHAN BERULANG
  // ==========================================

  if (bill.type === "BERULANG" && bill.paidAt && bill.previousDueDate) {
    const paidAt = new Date(bill.paidAt);

    const previousDueDate = new Date(bill.previousDueDate);

    paidAt.setHours(0, 0, 0, 0);

    previousDueDate.setHours(0, 0, 0, 0);

    // ==========================================
    // PERIODE LAMA MASIH BERLAKU
    // ==========================================

    if (today >= paidAt && today <= previousDueDate) {
      return "SUDAH_DIBAYAR";
    }

    // ==========================================
    // PERIODE LAMA SUDAH LEWAT
    // ==========================================

    if (today > previousDueDate && bill.nextDueDate) {
      const nextDueDate = new Date(bill.nextDueDate);

      nextDueDate.setHours(0, 0, 0, 0);

      const diff = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));

      if (diff < 0) {
        return "TERLAMBAT";
      }

      if (diff <= 7) {
        return "AKAN_JATUH_TEMPO";
      }

      return "MENUNGGU_PEMBAYARAN";
    }
  }

  // ==========================================
  // TAGIHAN NORMAL / BELUM DIBAYAR
  // ==========================================

  if (!bill.dueDate) {
    return "MENUNGGU_PEMBAYARAN";
  }

  const dueDate = new Date(bill.dueDate);

  dueDate.setHours(0, 0, 0, 0);

  const diff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return "TERLAMBAT";
  }

  if (diff <= 7) {
    return "AKAN_JATUH_TEMPO";
  }

  return "MENUNGGU_PEMBAYARAN";
}

// ==============================
// INTERVAL REMINDER
// ==============================
//
// > 7 hari     = setiap 3 hari
// 4 - 7 hari   = setiap 1 hari
// 0 - 3 hari   = setiap 8 jam
//
// 72 jam = 3 hari
// 24 jam = 1 hari
// 8 jam  = 3 kali sehari
// ==============================

function getReminderIntervalHours(diff) {
  // Belum masuk periode reminder
  // Contoh: H-8, H-9, H-10, dst.
  if (diff > 7) {
    return null;
  }

  // H-7 sampai H-4
  // Reminder 1 kali sehari
  if (diff >= 4) {
    return 24;
  }

  // H-3 sampai hari H
  // Reminder 3 kali sehari
  if (diff >= 0) {
    return 8;
  }

  // Sudah lewat jatuh tempo
  return null;
}

// ==============================
// PROSES SEMUA REMINDER
// ==============================

exports.processReminders = async () => {
  try {
    // ==========================================
    // AMBIL SEMUA TAGIHAN
    // ==========================================

    const bills = await prisma.bill.findMany({
      include: {
        vendor: true,

        // Mengambil data user
        // untuk mendapatkan email user
        user: true,
      },

      orderBy: {
        dueDate: "asc",
      },
    });

    console.log(`Memeriksa ${bills.length} tagihan...`);

    // ==========================================
    // WAKTU SEKARANG
    // ==========================================

    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // ==========================================
    // LOOP SEMUA TAGIHAN
    // ==========================================

    for (const bill of bills) {
      const activeDueDate = getActiveDueDate(bill);

      const activeStatus = getActiveStatus(bill);

      // ==========================================
      // SKIP JIKA SUDAH DIBAYAR
      // ==========================================

      if (activeStatus === "SUDAH_DIBAYAR") {
        console.log(`SKIP: ${bill.title} sudah dibayar.`);

        continue;
      }

      // ==========================================
      // SKIP JIKA TIDAK ADA JATUH TEMPO
      // ==========================================

      if (!activeDueDate) {
        console.log(`SKIP: ${bill.title} tidak memiliki jatuh tempo.`);

        continue;
      }

      const dueDate = new Date(activeDueDate);

      const due = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate(),
      );

      // ==========================================
      // HITUNG SELISIH HARI
      // ==========================================

      const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

      console.log(
        `${bill.title} | ` +
          `jatuh tempo ${formatDate(activeDueDate)} | ` +
          `${diff} hari lagi`,
      );

      // ==========================================
      // SUDAH LEWAT JATUH TEMPO
      // ==========================================

      if (diff < 0) {
        console.log(`SKIP: ${bill.title} sudah melewati jatuh tempo.`);

        continue;
      }

      // ==========================================
      // TENTUKAN INTERVAL REMINDER
      // ==========================================

      const reminderIntervalHours = getReminderIntervalHours(diff);

      if (reminderIntervalHours === null) {
        console.log(`SKIP: ${bill.title} belum masuk periode reminder.`);

        continue;
      }

      // ==========================================
      // CEK ANTI SPAM
      // ==========================================

      if (bill.lastReminderSentAt) {
        const lastSent = new Date(bill.lastReminderSentAt);

        const hoursSinceLastReminder =
          (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

        // Belum waktunya mengirim reminder
        if (hoursSinceLastReminder < reminderIntervalHours) {
          console.log(
            `SKIP: ${bill.title} belum waktunya reminder berikutnya.` +
              ` (${hoursSinceLastReminder.toFixed(1)} jam berlalu)`,
          );

          continue;
        }
      }

      // ==========================================
      // TEKS REMINDER
      // ==========================================

      let reminderText;

      if (diff === 0) {
        reminderText = "Jatuh tempo hari ini";
      } else if (diff === 1) {
        reminderText = "Jatuh tempo besok";
      } else {
        reminderText = `Jatuh tempo ${diff} hari lagi`;
      }

      // ==========================================
      // INFORMASI PERIODE
      // ==========================================

      let periodText = "";

      if (bill.type === "BERULANG") {
        if (bill.recurringMonths === 0) {
          periodText = `🔁 Periode: ${bill.recurringPeriod} ` + `(tanpa batas)`;
        } else {
          periodText =
            `🔁 Periode: ${bill.recurringPeriod} ` +
            `dari ${bill.recurringMonths} bulan`;
        }
      }

      // ==========================================
      // PESAN TELEGRAM
      // ==========================================

      const message = `
⚠️ SEGERA LAKUKAN PEMBAYARAN!

🔔 SIMRITI REMINDER

📄 Judul Tagihan: ${bill.title}
🧾 Nomor Invoice: ${bill.invoiceNumber || "-"}
🏢 Vendor: ${bill.vendor?.name || "-"}
💰 Nominal: Rp ${formatAmount(bill.amount)}
📅 Jatuh Tempo: ${formatDate(activeDueDate)}
⏰ ${reminderText}
📌 Status: ${activeStatus.replaceAll("_", " ")}
${periodText}
      `.trim();

      // ==========================================
      // KIRIM TELEGRAM
      // ==========================================

      try {
        console.log(`Mengirim Telegram: ${bill.title}`);

        await telegramService.sendMessage(message);

        console.log(`TELEGRAM BERHASIL: ${bill.title}`);
      } catch (error) {
        // Jika Telegram gagal,
        // Email tetap akan dicoba
        console.error(`TELEGRAM GAGAL: ${bill.title}`, error.message);
      }

      // ==========================================
      // KIRIM EMAIL
      // ==========================================

      try {
        // Pastikan user memiliki email
        if (bill.user?.email) {
          console.log(`Mengirim Email ke ${bill.user.email}`);

          const subject = `⚠️ Reminder Tagihan: ${bill.title}`;

          // ==========================================
          // TEMPLATE EMAIL
          // ==========================================

          const html = `

<div style="
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: auto;
  border: 1px solid #ddd;
  border-radius: 10px;
  overflow: hidden;
">

  <div style="
    padding: 20px;
    background: #f5f5f5;
  ">

    <h2>
      ⚠️ SIMRITI REMINDER
    </h2>

    <p>
      Segera lakukan pembayaran tagihan Anda.
    </p>

  </div>


  <div style="
    padding: 20px;
  ">

    <p>

      <strong>
        📄 Judul Tagihan:
      </strong>

      ${bill.title}

    </p>


    <p>

      <strong>
        🧾 Nomor Invoice:
      </strong>

      ${bill.invoiceNumber || "-"}

    </p>


    <p>

      <strong>
        🏢 Vendor:
      </strong>

      ${bill.vendor?.name || "-"}

    </p>


    <p>

      <strong>
        💰 Nominal:
      </strong>

      Rp ${formatAmount(bill.amount)}

    </p>


    <p>

      <strong>
        📅 Jatuh Tempo:
      </strong>

      ${formatDate(activeDueDate)}

    </p>


    <p>

      <strong>
        ⏰ Reminder:
      </strong>

      ${reminderText}

    </p>


    <p>

      <strong>
        📌 Status:
      </strong>

      ${activeStatus.replaceAll("_", " ")}

    </p>


    ${periodText ? `<p>${periodText}</p>` : ""}


    <hr>


    <p style="
      color: #777;
      font-size: 12px;
    ">

      Email ini dikirim secara otomatis
      oleh Sistem SIMRITI.

    </p>

  </div>

</div>

          `;

          // ==========================================
          // KIRIM EMAIL
          // ==========================================

          await emailService.sendReminderEmail({
            to: bill.user.email,

            subject,

            html,
          });

          console.log(`EMAIL BERHASIL: ${bill.title}`);
        } else {
          console.log(`SKIP EMAIL: ${bill.title} - User belum memiliki email.`);
        }
      } catch (error) {
        // Jika Email gagal,
        // sistem tidak berhenti
        console.error(`EMAIL GAGAL: ${bill.title}`, error.message);
      }

      // ==========================================
      // SIMPAN WAKTU REMINDER
      // ==========================================

      await prisma.bill.update({
        where: {
          id: bill.id,
        },

        data: {
          lastReminderSentAt: new Date(),
        },
      });

      console.log(`REMINDER SELESAI: ${bill.title}`);
    }

    // ==========================================
    // SELESAI
    // ==========================================

    console.log("=========================");

    console.log("REMINDER SELESAI");

    console.log("=========================");
  } catch (error) {
    console.error("REMINDER ERROR:", error);
  }
};
