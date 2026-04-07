const fs = require("fs");
const multer = require("multer");
const path = require("path");

const uploadDir = path.join(__dirname, "../public/images/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB max upload size
  },
  fileFilter: (req, file, cb) => {
    const allowedExt = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

module.exports = upload;
