const prisma = require("../config/database");

const emailService = require("./emailService");

// ==============================
// FORMAT TANGGAL
// ==============================

function formatDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
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
// ACTIVE DUE DATE
// ==============================

function getActiveDueDate(bill) {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  if (bill.type === "BERULANG" && bill.previousDueDate && bill.nextDueDate) {
    const previousDueDate = new Date(bill.previousDueDate);

    previousDueDate.setHours(0, 0, 0, 0);

    if (today > previousDueDate) {
      return bill.nextDueDate;
    }
  }

  return bill.dueDate;
}

// ==============================
// ACTIVE STATUS
// ==============================

function getActiveStatus(bill) {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  // RECURRING

  if (bill.type === "BERULANG" && bill.paidAt && bill.previousDueDate) {
    const paidAt = new Date(bill.paidAt);

    const previousDueDate = new Date(bill.previousDueDate);

    paidAt.setHours(0, 0, 0, 0);

    previousDueDate.setHours(0, 0, 0, 0);

    // Periode masih dibayar

    if (today >= paidAt && today <= previousDueDate) {
      return "SUDAH_DIBAYAR";
    }

    // Periode berikutnya

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

  // NORMAL

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

function getReminderIntervalHours(diff) {
  // Belum masuk periode reminder
  if (diff > 7) {
    return null;
  }

  // H-7 sampai H-4
  if (diff >= 4) {
    return 24;
  }

  // H-3 sampai hari H
  if (diff >= 0) {
    return 8;
  }

  // Sudah lewat jatuh tempo
  return null;
}

// ==============================
// PROSES EMAIL REMINDER
// ==============================

exports.processReminders = async () => {
  try {
    const bills = await prisma.bill.findMany({
      include: {
        vendor: true,

        user: true,
      },

      orderBy: {
        dueDate: "asc",
      },
    });

    console.log(`Memeriksa ${bills.length} tagihan untuk Email...`);

    const now = new Date();

    const today = new Date(
      now.getFullYear(),

      now.getMonth(),

      now.getDate(),
    );

    // ==========================
    // LOOP TAGIHAN
    // ==========================

    for (const bill of bills) {
      // USER TIDAK PUNYA EMAIL

      if (!bill.user?.email) {
        console.log(`SKIP EMAIL: ${bill.title} - user belum memiliki email.`);

        continue;
      }

      const activeDueDate = getActiveDueDate(bill);

      const activeStatus = getActiveStatus(bill);

      // SUDAH DIBAYAR

      if (activeStatus === "SUDAH_DIBAYAR") {
        continue;
      }

      if (!activeDueDate) {
        continue;
      }

      const dueDate = new Date(activeDueDate);

      const due = new Date(
        dueDate.getFullYear(),

        dueDate.getMonth(),

        dueDate.getDate(),
      );

      // ==========================
      // HITUNG HARI
      // ==========================

      const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

      // SUDAH TERLAMBAT

      if (diff < 0) {
        continue;
      }

      // ==========================
      // INTERVAL
      // ==========================

      const intervalHours = getReminderIntervalHours(diff);

      if (intervalHours === null) {
        continue;
      }

      // ==========================
      // ANTI SPAM EMAIL
      // ==========================

      if (bill.lastEmailReminderSentAt) {
        const lastSent = new Date(bill.lastEmailReminderSentAt);

        const hoursSinceLastEmail =
          (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastEmail < intervalHours) {
          console.log(`SKIP EMAIL: ${bill.title} belum waktunya.`);

          continue;
        }
      }

      // ==========================
      // REMINDER TEXT
      // ==========================

      let reminderText;

      if (diff === 0) {
        reminderText = "Jatuh tempo hari ini";
      } else if (diff === 1) {
        reminderText = "Jatuh tempo besok";
      } else {
        reminderText = `Jatuh tempo dalam ${diff} hari`;
      }

      // ==========================
      // PERIODE
      // ==========================

      let periodText = "";

      if (bill.type === "BERULANG") {
        if (bill.recurringMonths === 0) {
          periodText = `Periode ${bill.recurringPeriod} (Tanpa Batas)`;
        } else {
          periodText = `Periode ${bill.recurringPeriod} dari ${bill.recurringMonths} bulan`;
        }
      }

      // ==========================
      // EMAIL TEXT
      // ==========================

      const text = `
SIMRITI - Invoice Reminder

Halo ${bill.user.fullName},

Berikut adalah pengingat tagihan Anda.

Judul Tagihan: ${bill.title}
Nomor Invoice: ${bill.invoiceNumber || "-"}
Vendor: ${bill.vendor?.name || "-"}
Jenis Tagihan: ${bill.type === "BERULANG" ? "Berulang" : "Sekali Bayar"}
Nominal: Rp ${formatAmount(bill.amount)}
Jatuh Tempo: ${formatDate(activeDueDate)}
Status: ${activeStatus.replaceAll("_", " ")}

${reminderText}

${periodText}

Email ini dikirim secara otomatis oleh SIMRITI Invoice Reminder System.
`;

      // ==========================
      // EMAIL HTML
      // ==========================

      const html = `
<!DOCTYPE html>
<html lang="id">

<head>
  <meta charset="UTF-8">
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f6f8;
  font-family: Arial, Helvetica, sans-serif;
  color: #343a40;
">

  <div style="
    padding: 30px 15px;
  ">

    <!-- CONTAINER -->
    <div style="
      max-width: 700px;
      margin: auto;
      background-color: #ffffff;
      border: 1px solid #dcdfe3;
      border-radius: 16px;
      overflow: hidden;
    ">

      <!-- HEADER -->
      <div style="
        text-align: center;
        padding: 35px 25px 30px;
        border-bottom: 1px solid #e5e7eb;
      ">

        <h1 style="
          margin: 0;
          font-size: 32px;
          letter-spacing: 1px;
          color: #2f3a45;
        ">
          SIMRITI
        </h1>

        <p style="
          margin: 8px 0 0;
          font-size: 17px;
          color: #6b7280;
        ">
          Invoice Reminder
        </p>

      </div>


      <!-- CONTENT -->
      <div style="
        padding: 35px 40px;
      ">

        <!-- GREETING -->
        <p style="
          margin: 0 0 20px;
          font-size: 17px;
          line-height: 1.6;
        ">
          Halo
          <strong>${bill.user.fullName}</strong>,
        </p>


        <p style="
          margin: 0 0 30px;
          font-size: 17px;
          line-height: 1.6;
        ">
          Berikut adalah pengingat tagihan Anda.
        </p>


        <!-- JUDUL TAGIHAN -->
        <div style="
          border: 1px solid #d7dce2;
          border-radius: 14px;
          padding: 25px 30px;
          margin-bottom: 20px;
          background-color: #f8fafc;
        ">

          <p style="
            margin: 0 0 12px;
            font-size: 14px;
            font-weight: bold;
            color: #5b6570;
            letter-spacing: 0.5px;
          ">
            JUDUL TAGIHAN
          </p>


          <h2 style="
            margin: 0;
            font-size: 30px;
            color: #2f3a45;
          ">
            ${bill.title}
          </h2>

        </div>


        <!-- JATUH TEMPO -->
        <div style="
          border: 1px solid #d7dce2;
          border-radius: 14px;
          padding: 25px 30px;
          margin-bottom: 35px;
          background-color: #fffdf7;
        ">

          <p style="
            margin: 0 0 12px;
            font-size: 14px;
            font-weight: bold;
            color: #5b6570;
            letter-spacing: 0.5px;
          ">
            JATUH TEMPO
          </p>


          <h2 style="
            margin: 0 0 15px;
            font-size: 30px;
            color: #2f3a45;
          ">
            ${formatDate(activeDueDate)}
          </h2>


          <p style="
            margin: 0;
            font-size: 17px;
            font-weight: bold;
            color: #4b5563;
          ">
            ${reminderText}
          </p>

        </div>


        <!-- DETAIL TAGIHAN -->
        <h2 style="
          margin: 0 0 15px;
          font-size: 22px;
          color: #2f3a45;
        ">
          Detail Tagihan
        </h2>


        <table style="
          width: 100%;
          border-collapse: collapse;
          font-size: 16px;
        ">


          <!-- NOMOR INVOICE -->
          <tr>

            <td style="
              padding: 15px 0;
              border-top: 1px solid #e5e7eb;
              color: #5f6873;
            ">
              Nomor Invoice
            </td>

            <td style="
              padding: 15px 0;
              border-top: 1px solid #e5e7eb;
              text-align: right;
              font-weight: 500;
              color: #343a40;
            ">
              ${bill.invoiceNumber || "-"}
            </td>

          </tr>


          <!-- VENDOR -->
          <tr>

            <td style="
              padding: 15px 0;
              border-top: 1px solid #e5e7eb;
              color: #5f6873;
            ">
              Vendor
            </td>

            <td style="
              padding: 15px 0;
              border-top: 1px solid #e5e7eb;
              text-align: right;
              font-weight: 500;
              color: #343a40;
            ">
              ${bill.vendor?.name || "-"}
            </td>

          </tr>


          <!-- NOMINAL -->
          <tr>

            <td style="
              padding: 15px 0;
              border-top: 1px solid #e5e7eb;
              color: #5f6873;
            ">
              Nominal
            </td>

            <td style="
              padding: 15px 0;
              border-top: 1px solid #e5e7eb;
              text-align: right;
              font-weight: bold;
              color: #343a40;
            ">
              Rp ${formatAmount(bill.amount)}
            </td>

          </tr>

          <!-- JENIS TAGIHAN -->
<tr>

  <td style="
    padding: 15px 0;
    border-top: 1px solid #e5e7eb;
    color: #5f6873;
  ">
    Jenis Tagihan
  </td>

  <td style="
    padding: 15px 0;
    border-top: 1px solid #e5e7eb;
    text-align: right;
    font-weight: 500;
    color: #343a40;
  ">
    ${bill.type === "BERULANG" ? "Berulang" : "Sekali Bayar"}
  </td>

</tr>


          <!-- STATUS -->
          <tr>

            <td style="
              padding: 15px 0;
              border-top: 1px solid #e5e7eb;
              border-bottom: 1px solid #e5e7eb;
              color: #5f6873;
            ">
              Status
            </td>

            <td style="
              padding: 15px 0;
              border-top: 1px solid #e5e7eb;
              border-bottom: 1px solid #e5e7eb;
              text-align: right;
              font-weight: 500;
              color: #343a40;
            ">
              ${activeStatus.replaceAll("_", " ")}
            </td>

          </tr>

        </table>


        <!-- FOOTER -->
        <div style="
          margin-top: 40px;
          padding-top: 25px;
          border-top: 1px solid #e5e7eb;
        ">

          <p style="
            margin: 0 0 15px;
            font-size: 15px;
            line-height: 1.6;
            color: #6b7280;
          ">
            Email ini dikirim secara otomatis oleh
            <strong>SIMRITI Invoice Reminder System</strong>.
          </p>


          <p style="
            margin: 0;
            font-size: 15px;
            line-height: 1.6;
            color: #6b7280;
          ">
            Mohon untuk memeriksa tagihan Anda sebelum tanggal jatuh tempo.
          </p>

        </div>

      </div>

    </div>

  </div>

</body>

</html>
`;

      // ==========================
      // KIRIM EMAIL
      // ==========================

      console.log(`Mengirim Email: ${bill.title}`);

      await emailService.sendReminderEmail({
        to: bill.user.email,

        subject: `SIMRITI ${reminderText} - ${bill.title}`,

        text,

        html,
      });

      // ==========================
      // UPDATE WAKTU EMAIL
      // ==========================

      await prisma.bill.update({
        where: {
          id: bill.id,
        },

        data: {
          lastEmailReminderSentAt: new Date(),
        },
      });

      console.log(`EMAIL TERKIRIM: ${bill.title}`);
    }
  } catch (error) {
    console.error("EMAIL REMINDER ERROR:", error);
  }
};
