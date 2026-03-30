const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
// Use centralized multer configuration to avoid duplication
const upload = require("../config/multer");
const { isAuthenticated } = require("../controllers/authController");

// Routes
// Create product (upload)
router.post(
  "/create",
  isAuthenticated,
  upload.single("image"),
  productController.createProduct,
);

// Farmer's products (mounted at /products)
router.get("/", isAuthenticated, productController.getFarmerProducts);

// Delete product
router.post("/delete/:id", isAuthenticated, productController.deleteProduct);

// Market view for all users (mounted at /products/market)
router.get("/market", productController.getMarket);

module.exports = router;
