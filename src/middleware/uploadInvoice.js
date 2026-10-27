const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = path.join(__dirname, "../uploads/invoice");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadPath);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);

    const name = Date.now() + ext;

    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/png", "image/jpeg"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format file tidak didukung"));
  }
};

module.exports = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter,
});
