const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = path.join(
    __dirname,
    "../uploads/payment"
);

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({

    destination(req, file, cb){
        cb(null, uploadPath);
    },

    filename(req, file, cb) {
        const ext = path.extname(file.originalname);

        cb(
            null,
            Date.now() + ext
        );
    }
});

module.exports = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});