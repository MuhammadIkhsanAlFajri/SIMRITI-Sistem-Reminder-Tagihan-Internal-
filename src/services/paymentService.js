const prisma = require("../config/database");
const activityService = require("./activityService");

// =====================================================
// HITUNG STATUS AKTIF TAGIHAN
// =====================================================

function getActiveStatus(bill) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ===================================================
  // TAGIHAN BERULANG
  // ===================================================

  if (bill.type === "BERULANG") {
    // -------------------------------------------------
    // Jika periode sebelumnya sudah dibayar
    // dan periode tersebut masih berjalan
    // -------------------------------------------------

    if (bill.paidAt && bill.previousDueDate) {
      const previousDueDate = new Date(bill.previousDueDate);

      previousDueDate.setHours(0, 0, 0, 0);

      // Selama hari ini masih <= tenggat periode lama,
      // status tetap LUNAS.
      if (today <= previousDueDate) {
        return "SUDAH_DIBAYAR";
      }

      // -------------------------------------------------
      // PERIODE LAMA SUDAH BERAKHIR
      // -------------------------------------------------

      if (bill.nextDueDate) {
        const nextDueDate = new Date(bill.nextDueDate);

        nextDueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
          (nextDueDate - today) / (1000 * 60 * 60 * 24),
        );

        if (diffDays < 0) {
          return "TERLAMBAT";
        }

        if (diffDays <= 7) {
          return "AKAN_JATUH_TEMPO";
        }

        return "MENUNGGU_PEMBAYARAN";
      }
    }
  }

  // ===================================================
  // NORMAL / RECURRING BELUM PERNAH DIBAYAR
  // ===================================================

  if (!bill.dueDate) {
    return "MENUNGGU_PEMBAYARAN";
  }

  const dueDate = new Date(bill.dueDate);

  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "TERLAMBAT";
  }

  if (diffDays <= 7) {
    return "AKAN_JATUH_TEMPO";
  }

  return "MENUNGGU_PEMBAYARAN";
}

// =====================================================
// HITUNG JATUH TEMPO AKTIF
// =====================================================

function getActiveDueDate(bill) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ===================================================
  // TAGIHAN BERULANG
  // ===================================================

  if (bill.type === "BERULANG" && bill.previousDueDate && bill.nextDueDate) {
    const previousDueDate = new Date(bill.previousDueDate);

    previousDueDate.setHours(0, 0, 0, 0);

    // Periode yang sudah dibayar masih berjalan
    if (today <= previousDueDate) {
      return bill.previousDueDate;
    }

    // Periode lama sudah lewat
    // Aktifkan tenggat periode berikutnya
    return bill.nextDueDate;
  }

  // ===================================================
  // NORMAL / BELUM BERPINDAH PERIODE
  // ===================================================

  return bill.dueDate;
}

// =====================================================
// AMBIL TAGIHAN
// =====================================================

exports.getBill = async (id) => {
  const bill = await prisma.bill.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      vendor: true,

      payments: {
        orderBy: {
          dueDate: "asc",
        },
      },
    },
  });

  if (!bill) {
    return null;
  }

  return {
    ...bill,

    // Status aktif
    status: getActiveStatus(bill),

    // Jatuh tempo aktif
    dueDate: getActiveDueDate(bill),
  };
};

// =====================================================
// VALIDASI PEMBAYARAN
// =====================================================

exports.payBill = async (id, body, file) => {
  const billId = Number(id);

  // ===================================================
  // AMBIL TAGIHAN
  // ===================================================

  const bill = await prisma.bill.findUnique({
    where: {
      id: billId,
    },

    include: {
      payments: {
        orderBy: {
          dueDate: "asc",
        },
      },

      vendor: true,
    },
  });

  if (!bill) {
    throw new Error("Tagihan tidak ditemukan");
  }

  // ===================================================
  // STATUS AKTIF
  // ===================================================

  const currentStatus = getActiveStatus(bill);

  // ===================================================
  // CEGAH VALIDASI ULANG
  // ===================================================

  if (currentStatus === "SUDAH_DIBAYAR") {
    throw new Error(
      "Tagihan ini masih berada dalam periode yang sudah dibayar.",
    );
  }

  // ===================================================
  // VALIDASI TANGGAL PEMBAYARAN
  // ===================================================

  if (!body.paymentDate) {
    throw new Error("Tanggal pembayaran wajib diisi.");
  }

  const paymentDate = new Date(body.paymentDate);

  if (isNaN(paymentDate.getTime())) {
    throw new Error("Tanggal pembayaran tidak valid.");
  }

  let paymentAmount = null;

  if (body.amount !== undefined && body.amount !== "") {
    paymentAmount = Number(body.amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      throw new Error("Nominal pembayran tidak valid.");
    }
  }

  const proofFile = file ? file.filename : null;

  // ===================================================
  // CARI PAYMENT AKTIF
  // ===================================================
  //
  // createBill() sudah membuat Payment pertama.
  // Jadi ketika pembayaran divalidasi,
  // kita UPDATE Payment yang masih menunggu,
  // bukan membuat Payment baru.
  //
  // ===================================================

  let activePayment = null;

  if (bill.payments && bill.payments.length > 0) {
    activePayment = bill.payments.find(
      (payment) => payment.status !== "SUDAH_DIBAYAR",
    );
  }

  // ===================================================
  // TAGIHAN NORMAL
  // ===================================================

  if (bill.type === "NORMAL") {
    // -------------------------------------------------
    // Jika Payment belum ditemukan
    // buat sebagai fallback.
    // -------------------------------------------------

    if (!activePayment) {
      activePayment = await prisma.payment.create({
        data: {
          periodDate: bill.invoiceDate,
          dueDate: bill.dueDate,
          amount: bill.amount,
          status: "MENUNGGU_PEMBAYARAN",
          billId: billId,
        },
      });
    }

    // -------------------------------------------------
    // UPDATE PAYMENT MENJADI LUNAS
    // -------------------------------------------------

    const payment = await prisma.payment.update({
      where: {
        id: activePayment.id,
      },

      data: {
        paymentDate,
        amount: paymentAmount ?? bill.amount,
        proofFile,
        note: body.note || null,
        status: "SUDAH_DIBAYAR",
      },
    });

    // -------------------------------------------------
    // UPDATE BILL
    // -------------------------------------------------

    await prisma.bill.update({
      where: {
        id: billId,
      },

      data: {
        status: "SUDAH_DIBAYAR",
        paidAt: paymentDate,

        previousDueDate: null,
        nextDueDate: null,

        lastReminderSentAt: null,
        lastEmailReminderSentAt: null,
      },
    });

    // -------------------------------------------------
    // ACTIVITY LOG
    // -------------------------------------------------

    await activityService.createLog(
      "PEMBAYARAN",
      `Tagihan "${bill.title}" berhasil divalidasi`,
      bill.userId,
    );

    return payment;
  }

  // ===================================================
  // TAGIHAN BERULANG
  // ===================================================

  const currentPeriod = bill.recurringPeriod || 1;

  const nextPeriod = currentPeriod + 1;

  const unlimited = bill.recurringMonths === 0;

  const canContinue = unlimited || nextPeriod <= bill.recurringMonths;

  // ===================================================
  // CEGAH PEMBAYARAN SETELAH PERIODE TERAKHIR LUNAS
  // ===================================================
  //
  // Jika sudah mencapai periode terakhir DAN
  // Payment periode tersebut sudah dibayar,
  // maka tagihan benar-benar selesai.
  // ===================================================

  if (!unlimited && currentPeriod >= bill.recurringMonths) {
    const hasUnpaidPayment = bill.payments?.some(
      (payment) => payment.status !== "SUDAH_DIBAYAR",
    );

    if (!hasUnpaidPayment) {
      throw new Error(
        "Tagihan ini sudah mencapai periode terakhir dan seluruh pembayaran telah lunas.",
      );
    }
  }

  // ===================================================
  // PERIODE YANG SEDANG DIBAYAR
  // ===================================================
  //
  // Gunakan Jatuh Tempo AKTIF.
  //
  // Untuk periode pertama:
  //     bill.dueDate
  //
  // Setelah periode pertama lewat:
  //     bill.nextDueDate
  //
  // Jika Payment aktif sudah tersedia,
  // gunakan dueDate Payment tersebut sebagai sumber utama.
  // ===================================================

  let currentDueDate;

  if (activePayment) {
    currentDueDate = new Date(activePayment.dueDate);
  } else {
    currentDueDate = new Date(getActiveDueDate(bill));
  }

  currentDueDate.setHours(0, 0, 0, 0);

  // ===================================================
  // MASIH ADA PERIODE BERIKUTNYA
  // ===================================================

  if (canContinue) {
    // -------------------------------------------------
    // WAJIB ADA TENGGAT BERIKUTNYA
    // -------------------------------------------------

    if (!body.nextDueDate) {
      throw new Error("Tenggat berikutnya wajib diisi untuk tagihan berulang.");
    }

    // -------------------------------------------------
    // VALIDASI NEXT DUE DATE
    // -------------------------------------------------

    const nextDueDate = new Date(body.nextDueDate);

    if (isNaN(nextDueDate.getTime())) {
      throw new Error("Tenggat berikutnya tidak valid.");
    }

    nextDueDate.setHours(0, 0, 0, 0);

    // -------------------------------------------------
    // TENGGAT BERIKUTNYA HARUS SETELAH TENGGAT SEKARANG
    // -------------------------------------------------

    if (nextDueDate <= currentDueDate) {
      throw new Error(
        "Tenggat berikutnya harus setelah tenggat periode saat ini.",
      );
    }

    // =================================================
    // UPDATE PAYMENT PERIODE SEKARANG
    // =================================================

    if (!activePayment) {
      // Fallback jika Payment periode sekarang
      // belum tersedia di database.

      activePayment = await prisma.payment.create({
        data: {
          periodDate: bill.invoiceDate,
          dueDate: currentDueDate,
          amount: bill.amount,
          status: "MENUNGGU_PEMBAYARAN",
          billId: billId,
        },
      });
    }

    const paidPayment = await prisma.payment.update({
      where: {
        id: activePayment.id,
      },

      data: {
        paymentDate,
        amount: paymentAmount ?? (
          bill.recurringMonths > 0
            ? bill.amount / bill.recurringMonths
            : bill.amount
        ),
        proofFile,
        note: body.note || null,
        status: "SUDAH_DIBAYAR",
      },
    });

    // =================================================
    // SIMPAN PERIODE LAMA + PERIODE BARU DI BILL
    // =================================================

    await prisma.bill.update({
      where: {
        id: billId,
      },

      data: {
        // Periode yang baru saja dibayar
        previousDueDate: currentDueDate,

        // Periode berikutnya
        nextDueDate,

        // Tetap simpan dueDate lama.
        // getActiveStatus() dan getActiveDueDate()
        // akan menentukan kapan pindah ke nextDueDate.
        dueDate: currentDueDate,

        // Naik satu periode
        recurringPeriod: nextPeriod,

        // Tanggal pembayaran
        paidAt: paymentDate,

        // Database status tetap LUNAS.
        // Status tampilan dihitung dinamis.
        status: "SUDAH_DIBAYAR",

        // Reset reminder
        lastReminderSentAt: null,
        lastEmailReminderSentAt: null,
      },
    });

    // =================================================
    // BUAT PAYMENT PERIODE BERIKUTNYA
    // =================================================
    //
    // Ini bagian penting.
    //
    // Payment berikutnya sudah disiapkan di database,
    // tetapi BELUM dibayar.
    //
    // Jadi history akan mempunyai:
    //
    // Periode 1 → Lunas
    // Periode 2 → Menunggu pembayaran
    //
    // =================================================

    const nextPeriodDate = new Date(currentDueDate);

    nextPeriodDate.setDate(nextPeriodDate.getDate() + 1);

    const defaultPeriodAmount =
      bill.recurringMonths > 0
        ? bill.amount / bill.recurringMonths
        : bill.amount;

    await prisma.payment.create({
      data: {
        periodDate: nextPeriodDate,

        // Tenggat periode baru
        dueDate: nextDueDate,

        // Nominal tagihan
        amount: defaultPeriodAmount,

        // Belum dibayar
        status: "MENUNGGU_PEMBAYARAN",

        billId: billId,
      },
    });

    // =================================================
    // ACTIVITY LOG
    // =================================================

    await activityService.createLog(
      "PEMBAYARAN",
      `Tagihan berulang "${bill.title}" periode ${currentPeriod} berhasil divalidasi. Dilanjutkan ke periode ${nextPeriod}.`,
      bill.userId,
    );

    return paidPayment;
  }

  // ===================================================
  // PERIODE TERAKHIR
  // ===================================================

  if (!activePayment) {
    activePayment = await prisma.payment.create({
      data: {
        periodDate: bill.invoiceDate,
        dueDate: currentDueDate,
        amount: bill.amount,
        status: "MENUNGGU_PEMBAYARAN",
        billId: billId,
      },
    });
  }

  // ---------------------------------------------------
  // UPDATE PAYMENT TERAKHIR
  // ---------------------------------------------------

  const payment = await prisma.payment.update({
    where: {
      id: activePayment.id,
    },

    data: {
      paymentDate,
      proofFile,
      note: body.note || null,
      status: "SUDAH_DIBAYAR",
    },
  });

  // ---------------------------------------------------
  // UPDATE BILL
  // ---------------------------------------------------

  await prisma.bill.update({
    where: {
      id: billId,
    },

    data: {
      status: "SUDAH_DIBAYAR",
      paidAt: paymentDate,

      previousDueDate: null,
      nextDueDate: null,

      lastReminderSentAt: null,
      lastEmailReminderSentAt: null,
    },
  });

  // ---------------------------------------------------
  // ACTIVITY LOG
  // ---------------------------------------------------

  await activityService.createLog(
    "PEMBAYARAN",
    `Tagihan berulang "${bill.title}" periode terakhir berhasil divalidasi dan telah mencapai batas.`,
    bill.userId,
  );

  return payment;
};
