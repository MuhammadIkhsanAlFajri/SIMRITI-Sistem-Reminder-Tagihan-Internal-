const prisma = require("../config/database");
const fs = require("fs");
const path = require("path");
const activityService = require("./activityService");
const { freemem } = require("os");
const { connect } = require("http2");
const { title } = require("process");
const { diff } = require("util");

function getBillStatus(bill) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tagihan berulang
  if (bill.type === "BERULANG") {
    if (
      bill.recurringMonths > 0 &&
      bill.recurringMonths >= bill.recurringMonths
    ) {
      const payments = bill.payments || [];

      const latestPayment = [...payments]
        .sort(
          (a, b) =>
            new Date(b.dueDate).getTime() -
            new Date(a.dueDate).getTime()
        )[0];

      if (
        latestPayment && latestPayment.status === "SUDAH_DIBAYAR"
      ) {
        return "SUDAH_DIBAYAR";
      }
    }

    //  PERIODE SUDAH DI BAYAR

    if (bill.paidAt && bill.previousDueDate) {
      const previousDueDate = new Date(bill.previousDueDate);
      previousDueDate.setHours(0, 0, 0, 0);

      /*
       * Selama tanggal hari ini masih berada
       * di dalam periode pembayaran sebelumnya,
       * status tetap LUNAS.
       */
      if (today <= previousDueDate) {
        return "SUDAH_DIBAYAR";
      }

      // PERIODE BARU

      if (bill.nextDueDate) {
        const nextDueDate = new Date(bill.nextDueDate);
        nextDueDate.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
          (nextDueDate - today) / (1000 * 60 * 60 * 24)
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

  // TAGIHAN NORMAL

  if (bill.type === "NORMAL") {
    if (bill.status === "SUDAH_DIBAYAR") {
      return "SUDAH_DIBAYAR";
    }
  }

  // FALLBACK BERDASARKAN DUE DATE

  if (!bill.dueDate) {
    return "MENUNGGU_PEMBAYARAN";
  }

  const dueDate = new Date(bill.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (dueDate - today) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return "TERLAMBAT";
  }

  if (diffDays <= 7) {
    return "AKAN_JATUH_TEMPO";
  }

  return "MENUNGGU_PEMBAYARAN";
}

function getDisplayAmount(bill) {
  if (bill.amount === null || bill.amount === undefined) {
    return null;
  }

  return Number(bill.amount);
}

function getActiveDueDate(bill) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // TAGIHAN BERULANG

  if (bill.type === "BERULANG") {
    if (bill.previousDueDate) {
      const previousDueDate = new Date(
        bill.previousDueDate
      );

      previousDueDate.setHours(0, 0, 0, 0);

      if (today <= previousDueDate) {
        return bill.previousDueDate;
      }
    }

    /*
     * Setelah previousDueDate lewat,
     * gunakan nextDueDate.
     */

    if (bill.nextDueDate) {
      return bill.nextDueDate;
    }
  }

  // TAGIHAN NORMAL / FALLBACK
  return bill.dueDate
}

function getPaymentStatus(payment) {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  // Jika sudah dibayar
  if (payment.status === "SUDAH_DIBAYAR") {
    return "SUDAH_DIBAYAR";
  }

  const dueDate = new Date(payment.dueDate);

  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  // Sudah melewati tenggat
  if (diffDays < 0) {
    return "TERLAMBAT";
  }

  // H-7 sampai hari H
  if (diffDays <= 7) {
    return "AKAN_JATUH_TEMPO";
  }

  return "MENUNGGU_PEMBAYARAN";
}

function getActivePayment(payments) {
  if (!payments || payments.length === 0) {
    return null;
  }

  for (const payment of payments) {
    const status = getPaymentStatus(payment);

    if (status !== "SUDAH_DIBAYAR") {
      return {
        ...payment,
        status,
      };
    }
  }

  return null;
}

exports.getBills = async (query = {}) => {
  const where = {};

  // ==============================
  // CARI TAGIHAN
  // ==============================

  if (query.search && query.search.trim() !== "") {
    const search = query.search.trim();

    where.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },

      {
        invoiceNumber: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  // ==============================
  // FILTER VENDOR
  // ==============================

  if (query.vendor && query.vendor !== "") {
    where.vendorId = Number(query.vendor);
  }

  // ==============================
  // AMBIL BILL + PAYMENT
  // ==============================

  let bills = await prisma.bill.findMany({
    where,

    include: {
      vendor: true,

      payments: {
        orderBy: {
          dueDate: "asc",
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  // ==============================
  // AMBIL PAYMENT AKTIF
  // ==============================

  // ==============================
  // TENTUKAN STATUS TAGIHAN AKTIF
  // ==============================

  bills = bills.map((bill) => {
    const status = getBillStatus(bill);

    const activeDueDate = getActiveDueDate(bill);

    const displayAmount = getDisplayAmount(bill);

    return {
      ...bill,

      status,

      dueDate: activeDueDate,

      displayAmount,
    };
  });

  // ==============================
  // FILTER STATUS
  // ==============================

  if (query.status && query.status !== "") {
    bills = bills.filter((bill) => bill.status === query.status);
  }

  // ==============================
  // FILTER PERIODE
  // BERDASARKAN TENGGAT AKTIF
  // ==============================

  if (query.period && query.period !== "") {
    const [year, month] = query.period.split("-").map(Number);

    if (year && month) {
      bills = bills.filter((bill) => {
        if (!bill.dueDate) {
          return false;
        }

        const dueDate = new Date(bill.dueDate);

        return (
          dueDate.getFullYear() === year && dueDate.getMonth() === month - 1
        );
      });
    }
  }

  return bills;
};

//

exports.getVendors = async () => {
  return await prisma.vendor.findMany({
    orderBy: {
      name: "asc",
    },
  });
};

exports.createBill = async (req) => {
  console.log("DATA FORM:", req.body);

  const body = req.body;

  // ==============================
  // DATA DASAR
  // ==============================

  const title = body.title?.trim();

  if (!title) {
    throw new Error("Judul tagihan wajib diisi.");
  }

  const invoiceNumber = body.invoiceNumber?.trim() || null;

  const description = body.description?.trim() || null;

  // ==============================
  // NOMINAL OPSIONAL
  // ==============================

  let amount = null;

  if (body.amount !== undefined && body.amount !== null && body.amount !== "") {
    amount = Number(body.amount);

    if (isNaN(amount) || amount < 0) {
      throw new Error("Nominal tagihan tidak valid.");
    }
  }

  // ==============================
  // TANGGAL
  // ==============================

  if (!body.invoiceDate) {
    throw new Error("Tanggal tagihan wajib diisi.");
  }

  if (!body.dueDate) {
    throw new Error("Tenggat tagihan wajib diisi.");
  }

  const invoiceDate = new Date(body.invoiceDate);
  const dueDate = new Date(body.dueDate);

  if (isNaN(invoiceDate.getTime())) {
    throw new Error("Tanggal tagihan tidak valid.");
  }

  if (isNaN(dueDate.getTime())) {
    throw new Error("Tenggat tagihan tidak valid.");
  }

  // ==============================
  // UPLOAD INVOICE OPSIONAL
  // ==============================

  const invoiceFile = req.file ? req.file.filename : null;

  // ==============================
  // JENIS TAGIHAN
  // ==============================

  const isRecurring = body.isRecurring === "on";

  const type = isRecurring ? "BERULANG" : "NORMAL";

  // ==============================
  // JUMLAH BULAN RECURRING
  // ==============================

  let recurringMonths = 0;

  if (isRecurring) {
    if (body.recurringMonths === undefined || body.recurringMonths === "") {
      throw new Error("Jumlah bulan tagihan berulang wajib diisi.");
    }

    recurringMonths = Number(body.recurringMonths);

    if (!Number.isInteger(recurringMonths) || recurringMonths <= 0) {
      throw new Error("Jumlah bulan harus berupa angka lebih dari 0.");
    }
  }

  // ==============================
  // CARI / BUAT VENDOR
  // ==============================

  const vendorName = body.vendorName?.trim();

  if (!vendorName) {
    throw new Error("Nama vendor wajib diisi.");
  }

  let vendor = await prisma.vendor.findFirst({
    where: {
      name: {
        equals: vendorName,
        mode: "insensitive",
      },
    },
  });

  // Jika vendor belum ada
  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        name: vendorName,
      },
    });
  }

  // ==============================
  // SIMPAN TAGIHAN
  // ==============================

  const bill = await prisma.bill.create({
    data: {
      title,

      invoiceNumber,

      description,

      amount,

      invoiceDate,

      dueDate,

      invoiceFile,

      type,

      isRecurring,

      recurringMonths,

      recurringPeriod: 1,

      status: "MENUNGGU_PEMBAYARAN",

      vendor: {
        connect: {
          id: vendor.id,
        },
      },

      user: {
        connect: {
          id: req.session.user.id,
        },
      },
    },
  });

  let paymentAmount = amount;

  if (isRecurring) {
    paymentAmount = amount / recurringMonths;
  }

  // ==============================
  // BUAT TRANSAKSI / PAYMENT PERTAMA
  // ==============================

  await prisma.payment.create({
    data: {
      periodDate: invoiceDate,

      dueDate: dueDate,

      amount: paymentAmount,

      status: "MENUNGGU_PEMBAYARAN",

      billId: bill.id,
    },
  });

  // ==============================
  // ACTIVITY LOG
  // ==============================

  await activityService.createLog(
    "TAMBAH_TAGIHAN",
    `Menambahkan tagihan "${bill.title}"`,
    req.session.user.id,
  );

  return bill;
};

exports.editPage = async (id) => {
  const bill = await prisma.bill.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      vendor: true,
    },
  });

  const vendors = await prisma.vendor.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return {
    bill,

    vendors,
  };
};

exports.updateBill = async (req) => {
  const body = req.body;
  const billId = Number(req.params.id);

  //CARI BILL
  const oldBill = await prisma.bill.findUnique({
    where: {
      id: billId,
    },
  });

  if (!oldBill) {
    throw new Error("Tagihan tidak ditemukan");
  }

  // VENDOR
  const vendorName = body.vendorName?.trim();

  if (!vendorName) {
    throw new Error("Nama vendor wajib diisi");
  }

  let vendor = await prisma.vendor.findFirst({
    where: {
      name: {
        equals: vendorName,
        mode: "insensitive",
      },
    },
  });

  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        name: vendorName,
      },
    });
  }

  // RECURRRING
  const isRecurring = body.isRecurring === "on";

  let recurringMonths = 0;

  if (isRecurring) {
    recurringMonths = Number(body.recurringMonths || 0);

    if (!Number.isInteger(recurringMonths) || recurringMonths < 0) {
      throw new Error("Batas tagihan harus berupa angka 0 atau lebih");
    }
  }

  // NOMINAL OPSIONAL
  let amount = null;

  if (body.amount !== undefined && body.amount !== null && body.amount !== "") {
    amount = Number(body.amount);

    if (isNaN(amount) || amount < 0) {
      throw new Error("Nominal tagihan tidak valid");
    }
  }

  // DATA TAGIHAN
  const data = {
    title: body.title,
    invoiceNumber: body.invoiceNumber || null,
    description: body.description || null,
    amount,
    invoiceDate: new Date(body.invoiceDate),
    dueDate: new Date(body.dueDate),
    vendorId: vendor.id,
    type: isRecurring ? "BERULANG" : "NORMAL",
    isRecurring,
    recurringMonths,
  };

  // Jangan reset periode jika
  // jenis recurring tidak berubah.
  //
  // Kalau sebelumnya NORMAL
  // kemudian diubah menjadi BERULANG,
  // mulai dari periode 1.
  if (oldBill.type !== "BERULANG" && isRecurring) {
    data.recurringPeriod = 1;
  }

  // Kalau recurring dimatikan
  // periode kembali ke 1.
  if (!isRecurring) {
    data.recurringPeriod = 1;
  }

  // FILE BARU
  if (req.file) {
    data.invoiceFile = req.file.filename;
  }

  // UPDATE DATABASE
  const bill = await prisma.bill.update({
    where: {
      id: billId,
    },

    data,
  });

  // =====================================
  // UPDATE PAYMENT AKTIF
  // =====================================

  const activePayment = await prisma.payment.findFirst({
    where: {
      billId: billId,

      status: {
        not: "SUDAH_DIBAYAR",
      },
    },

    orderBy: {
      dueDate: "asc",
    },
  });

  if (activePayment) {
    await prisma.payment.update({
      where: {
        id: activePayment.id,
      },

      data: {
        periodDate: new Date(body.invoiceDate),

        dueDate: new Date(body.dueDate),

        amount: amount,
      },
    });
  }

  // LOG
  await activityService.createLog(
    "EDIT_TAGIHAN",
    `Mengubah tagihan "${bill.title}"`,
    req.session.user.id,
  );

  return bill;
};

exports.deleteBill = async (id, userId) => {
  const bill = await prisma.bill.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!bill) {
    throw new Error("Tagihan tidak ditemukan");
  }

  // ==============================
  // HAPUS FILE INVOICE
  // ==============================

  if (bill.invoiceFile) {
    const filePath = path.join(
      __dirname,
      "../uploads/invoice",
      bill.invoiceFile,
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // ==============================
  // HAPUS PAYMENT
  // ==============================

  await prisma.payment.deleteMany({
    where: {
      billId: Number(id),
    },
  });

  // ==============================
  // ACTIVITY LOG
  // ==============================

  await activityService.createLog(
    "HAPUS_TAGIHAN",
    `Menghapus tagihan "${bill.title}"`,
    userId,
  );

  // ==============================
  // HAPUS BILL
  // ==============================

  await prisma.bill.delete({
    where: {
      id: Number(id),
    },
  });

  return bill;
};

exports.getBillById = async (id) => {
  const bill = await prisma.bill.findUnique({
    where: { id: Number(id) },
    include: {
      vendor: true,
      user: true,
      payments: {
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!bill) return null;

  // PEMBAYRAN SUDAH LUNAS

  const paidPayment = (bill.payments || []).filter(
    (payment) => payment.status === "SUDAH_DIBAYAR"
  );

  // BIAYA BERJALAN

  const runningCost = paidPayment.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  // SISA TAGIHAN

  const remainingCost = Math.max(
    Number(bill.amount || 0) - runningCost,
    0
  );

  // RETURN DATA

  return {
    ...bill,
    status: getBillStatus(bill),
    dueDate: getActiveDueDate(bill),
    displayAmount: getDisplayAmount(bill),
    runningCost,
    remainingCost,
  };
};

exports.findInvoiceByNumber = async (invoiceNumber) => {
  return await prisma.bill.findFirst({
    where: {
      invoiceNumber,
    },
    include: {
      vendor: true,
    },
  });
};

exports.checkDuplicateInvoice = async (invoiceNumber) => {
  if (!invoiceNumber) {
    return null;
  }

  return await prisma.bill.findFirst({
    where: {
      invoiceNumber,
    },

    include: {
      vendor: true,
    },
  });
};
