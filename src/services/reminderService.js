const prisma = require("../config/database");
const activityService = require("./activityService");

exports.getSetting = async () => {
  return await prisma.reminderSetting.findFirst();
};

exports.updateAllBillStatus = async () => {
  const bills = await prisma.bill.findMany({
    include: {
      user: true,
      vendor: true,
      payments: true,
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const bill of bills) {
    let status;

    if (bill.payment) {
      status = "SUDAH_DIBAYAR";
    } else {
      const due = new Date(bill.dueDate);
      due.setHours(0, 0, 0, 0);

      const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

      if (diff < 0) {
        status = "TERLAMBAT";
      } else if (diff <= 7) {
        status = "AKAN_JATUH_TEMPO";
      } else {
        status = "MENUNGGU_PEMBAYARAN";
      }
    }

    if (status !== bill.status) {
      await prisma.bill.update({
        where: {
          id: bill.id,
        },

        data: {
          status,
        },
      });

      await activityService.createLog(
        "UBAH_STATUS",

        `Status tagihan "${bill.title}" berubah menjadi ${status.replaceAll("_", " ")}`,

        bill.userId,
      );
    }
  }
};

exports.saveSetting = async (body) => {
  const data = {
    daysBefore: Number(body.daysBefore),
    frequency: Number(body.frequency),
    status: body.status,
  };

  const reminder = await prisma.reminderSetting.findFirst();

  if (reminder) {
    await prisma.reminderSetting.update({
      where: {
        id: reminder.id,
      },
      data,
    });
  } else {
    // sementara pakai bill pertama

    await prisma.reminderSetting.create({
      data,
    });
  }
};

exports.getReminderBills = async (query = {}) => {
  const where = {
    OR: [
      { status: "AKAN_JATUH_TEMPO" },
      { status: "TERLAMBAT" },
      { status: "MENUNGGU_PEMBAYARAN" },
      { status: "SUDAH_DIBAYAR" },
    ],
  };

  if (query.vendor) {
    where.vendorId = Number(query.vendor);
  }

  if (query.search) {
    where.title = {
      contains: query.search,
      mode: "insensitive",
    };
  }

  if (query.status) {
    where.status = query.status;
  }

  return await prisma.bill.findMany({
    where,

    include: {
      vendor: true,
    },

    orderBy: {
      dueDate: "asc",
    },
  });
};

exports.getVendors = async () => {
  return await prisma.vendor.findMany({
    orderBy: {
      name: "asc",
    },
  });
};
