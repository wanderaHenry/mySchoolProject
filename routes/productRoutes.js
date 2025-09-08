// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const multer = require("multer");

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
}

// -----------------------------
// Multer configuration for file uploads
// -----------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// -----------------------------
// Routes
// -----------------------------

// Farmer uploads a new product
router.post("/create", requireAuth, upload.single("image"), productController.createProduct);

// Market view for all users
router.get("/market", requireAuth, productController.getMarket);

// Farmer views own products
router.get("/", requireAuth, productController.getFarmerProducts);

module.exports = router;
