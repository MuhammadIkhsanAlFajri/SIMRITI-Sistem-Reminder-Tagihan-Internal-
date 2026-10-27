const billService = require("../services/billService");

exports.index = async (req, res) => {
  try {
    // Ambil tagihan yang statusnya sudah dihitung dinamis
    // oleh billService.getBills()
    const bills = await billService.getBills({});

    // ==========================================
    // URUTAN DAFTAR TAGIHAN DASHBOARD
    // ==========================================
    // Prioritas:
    // 1. Akan Jatuh Tempo
    // 2. Menunggu Pembayaran
    // 3. Terlambat
    // 4. Lunas
    //
    // Di dalam status yang sama,
    // tenggat terdekat ditampilkan lebih dulu.
    // ==========================================

    const statusPriority = {
      AKAN_JATUH_TEMPO: 1,
      MENUNGGU_PEMBAYARAN: 2,
      TERLAMBAT: 3,
      SUDAH_DIBAYAR: 4,
    };

    bills.sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 99;
      const priorityB = statusPriority[b.status] ?? 99;

      // Prioritas status
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Jika status sama,
      // tenggat terdekat ditampilkan lebih dulu
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;

      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;

      return dateA - dateB;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // ==========================================
    // CARD DASHBOARD
    // HITUNG SEMUA TAGIHAN
    // ==========================================

    const totalBill = bills.length;

    const dueSoon = bills.filter(
      (bill) => bill.status === "AKAN_JATUH_TEMPO",
    ).length;

    const overdue = bills.filter((bill) => bill.status === "TERLAMBAT").length;

    const paid = bills.filter((bill) => bill.status === "SUDAH_DIBAYAR").length;

    // ==========================================
    // RINGKASAN VENDOR
    // TIDAK DIBATASI BULAN
    // ==========================================

    const vendorSummary = [];

    bills.forEach((bill) => {
      if (!bill.vendor) return;

      const existing = vendorSummary.find(
        (vendor) => vendor.id === bill.vendor.id,
      );

      if (existing) {
        existing._count.bills++;
      } else {
        vendorSummary.push({
          id: bill.vendor.id,
          name: bill.vendor.name,

          _count: {
            bills: 1,
          },
        });
      }
    });

    // ==========================================
    // NAMA USER
    // ==========================================

    const userName =
      req.session?.user?.fullName || req.session?.user?.username || "Pengguna";

    // ==========================================
    // RENDER DASHBOARD
    // ==========================================

    res.render("dashboard/index", {
      title: "Dashboard",

      totalBill,
      dueSoon,
      overdue,
      paid,

      // Semua tagihan untuk tabel
      bills,

      vendorSummary,
      userName,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Terjadi kesalahan");
  }
};
