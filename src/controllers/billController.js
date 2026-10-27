const billService = require("../services/billService");
const reminderService = require("../services/reminderService");
const ocrService = require("../services/ocrService");

exports.index = async (req, res) => {
  try {
    const bills = await billService.getBills(req.query);
    const vendors = await billService.getVendors();

    res.render("bills/index", {
      title: "Data Tagihan",
      bills,
      vendors,
      statuses: [
        "MENUNGGU_PEMBAYARAN",
        "AKAN_JATUH_TEMPO",
        "TERLAMBAT",
        "SUDAH_DIBAYAR",
      ],
      query: req.query,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Terjadi kesalahan");
  }
};

exports.create = async (req, res) => {
  const vendors = await billService.getVendors();

  res.render("bills/create", {
    title: "Tambah Tagihan",
    vendors,
  });
};

exports.store = async (req, res) => {
  try {
    await billService.createBill(req);

    res.redirect("/bills");
  } catch (err) {
    console.log(err);

    res.send(err.message);
  }
};

exports.edit = async (req, res) => {
  try {
    const data = await billService.editPage(req.params.id);

    if (!data.bill) {
      return res.status(404).send("Tagihan tidak ditemukan");
    }

    // Tagihan NORMAL yang sudah LUNAS tidak boleh diedit
    if (data.bill.type === "NORMAL" && data.bill.status === "SUDAH_DIBAYAR") {
      return res.redirect(`/bills/${data.bill.id}`);
    }

    res.render("bills/edit", {
      title: "Edit Tagihan",
      ...data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

exports.update = async (req, res) => {
  await billService.updateBill(req);

  res.redirect("/bills");
};

exports.destroy = async (req, res) => {
  try {
    await billService.deleteBill(req.params.id, req.session.user.id);

    res.redirect("/bills");
  } catch (error) {
    console.error("ERROR DELETE TAGIHAN:", error);

    res.status(500).send("Terjadi kesalahan saat menghapus tagihan");
  }
};

exports.show = async (req, res) => {
  try {
    console.log("================================");
    console.log("BUKA DETAIL TAGIHAN");
    console.log("ID:", req.params.id);

    const bill = await billService.getBillById(req.params.id);

    console.log("Judul:", bill?.title);
    console.log("Due Date:", bill?.dueDate);
    console.log("Status:", bill?.status);
    console.log("================================");

    if (!bill) {
      return res.status(404).send("Tagihan tidak ditemukan");
    }

    res.render("bills/show", {
      title: "Detail Tagihan",
      bill,
    });
  } catch (error) {
    console.error("DETAIL ERROR:", error);
    res.status(500).send("Terjadi kesalahan");
  }
};

exports.scanInvoice = async (req, res) => {
  try {
    console.log("================================");
    console.log("SCAN INVOICE DIPANGGIL");

    if (!req.file) {
      console.log("FILE TIDAK DITEMUKAN");

      return res.status(400).json({
        success: false,
        message: "File tidak ditemukan",
      });
    }

    console.log("FILE BERHASIL DITERIMA");

    console.log("Nama File:", req.file.originalname);

    console.log("Path File:", req.file.path);

    console.log("Mime Type:", req.file.mimetype);

    console.log("Ukuran:", req.file.size);

    /*
    Kirim SELURUH req.file

    JANGAN hanya req.file.path
    */

    const data = await ocrService.scanInvoice(req.file);

    console.log("================================");
    console.log("HASIL OCR:");

    console.log(data);

    console.log("================================");

    return res.json(data);
  } catch (err) {
    console.error("================================");

    console.error("ERROR SCAN INVOICE");

    console.error(err);

    console.error("================================");

    return res.status(500).json({
      success: false,

      message:
        err.response?.data?.message ||
        err.message ||
        "Terjadi kesalahan saat memproses invoice",
    });
  }
};

exports.checkDuplicate = async (req, res) => {
  try {
    const bill = await billService.checkDuplicateInvoice(
      req.body.invoiceNumber,
    );

    if (bill) {
      return res.json({
        duplicate: true,
        bill,
      });
    }

    return res.json({
      duplicate: false,
    });
  } catch (err) {
    return res.status(500).json({
      duplicate: false,
    });
  }
};
