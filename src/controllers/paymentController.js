const paymentService = require("../services/paymentService");

exports.create = async (req, res) => {
  try {
    const bill = await paymentService.getBill(req.params.id);

    if (!bill) {
      return res.status(404).send("Tagihan tidak ditemukan.");
    }

    // Jangan izinkan validasi ulang jika
    // periode aktif memang sudah dibayar
    if (bill.status === "SUDAH_DIBAYAR") {
      return res.redirect("/bills/" + req.params.id);
    }

    res.render("payments/create", {
      title: "Validasi Pembayaran",
      bill,
    });
  } catch (err) {
    console.error(err);

    res.status(500).send(err.message);
  }
};

exports.store = async (req, res) => {
  try {
    await paymentService.payBill(req.params.id, req.body, req.file);

    res.redirect("/bills/" + req.params.id);
  } catch (err) {
    console.error(err);

    res.status(400).send(err.message);
  }
};
