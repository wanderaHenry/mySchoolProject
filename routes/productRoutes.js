const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
// Use centralized multer configuration to avoid duplication
const upload = require("../config/multer");

// Routes
// I removed 'requireAuth' from here because your controller
// already handles the redirect to /login!
// Create product (upload)
router.post("/create", upload.single("image"), productController.createProduct);

// Farmer's products (mounted at /products)
router.get("/", productController.getFarmerProducts);

// Market view for all users (mounted at /products/market)
router.get("/market", productController.getMarket);

module.exports = router;
