const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadInvoice");
const billController = require("../controllers/billController");

const paymentController = require("../controllers/paymentController");

const uploadPayment = require("../middleware/uploadPayment");

// OCR

const multer = require("multer");

const path = require("path");

const storageOCR = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1000000);

    const extension = path.extname(file.originalname);

    cb(
      null,

      uniqueName + extension,
    );
  },
});

const uploadOCR = multer({
  storage: storageOCR,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (
    req,

    file,

    cb,
  ) => {
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Format file tidak didukung"),

        false,
      );
    }
  },
});

router.get("/", billController.index);

router.get("/create", billController.create);

router.post("/create", upload.single("invoiceFile"), billController.store);

router.get("/:id/edit", billController.edit);

router.post("/:id/edit", upload.single("invoiceFile"), billController.update);

router.post("/:id/delete", billController.destroy);

router.get("/:id", billController.show);

router.get("/:id/payment", paymentController.create);

router.post(
  "/:id/payment",
  uploadPayment.single("paymentProof"),
  paymentController.store,
);

router.post("/scan", uploadOCR.single("file"), billController.scanInvoice);

router.post("/check-duplicate", billController.checkDuplicate);

module.exports = router;
