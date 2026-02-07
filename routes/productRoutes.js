const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const multer = require("multer");

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, ""));
  },
});

const upload = multer({ storage });

// Routes
router.post(
  "/create",
  requireAuth,
  upload.single("image"),
  productController.createProduct,
);
