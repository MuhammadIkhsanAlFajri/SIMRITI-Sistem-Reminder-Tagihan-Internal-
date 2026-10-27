const prisma = require("../config/database");

function getBillStatus(bill) {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  // =====================================
  // TAGIHAN BERULANG
  // =====================================

  if (bill.type === "BERULANG") {
    if (bill.paidAt && bill.previousDueDate) {
      const previousDueDate = new Date(bill.previousDueDate);

      previousDueDate.setHours(0, 0, 0, 0);

      // Masih dalam periode yang sudah dibayar
      if (today <= previousDueDate) {
        return "SUDAH_DIBAYAR";
      }

      // Periode lama sudah lewat
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

  // =====================================
  // TAGIHAN NORMAL YANG SUDAH DIBAYAR
  // =====================================

  if (bill.type === "NORMAL" && bill.status === "SUDAH_DIBAYAR") {
    return "SUDAH_DIBAYAR";
  }

  // =====================================
  // STATUS BERDASARKAN TENGGAT
  // =====================================

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

exports.getDashboardData = async () => {
  const bills = await prisma.bill.findMany({
    include: {
      vendor: true,
    },
  });

  // Tambahkan status dinamis
  const billsWithStatus = bills.map((bill) => ({
    ...bill,
    calculatedStatus: getBillStatus(bill),
  }));

  // =====================================
  // HITUNG CARD
  // =====================================

  const totalBills = billsWithStatus.length;

  const upcomingBills = billsWithStatus.filter(
    (bill) => bill.calculatedStatus === "AKAN_JATUH_TEMPO",
  ).length;

  const overdueBills = billsWithStatus.filter(
    (bill) => bill.calculatedStatus === "TERLAMBAT",
  ).length;

  const paidBills = billsWithStatus.filter(
    (bill) => bill.calculatedStatus === "SUDAH_DIBAYAR",
  ).length;

  return {
    totalBills,
    upcomingBills,
    overdueBills,
    paidBills,

    bills: billsWithStatus,
  };
};
