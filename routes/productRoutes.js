const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../config/multer");
const { isAuthenticated } = require("../controllers/authController");

// Routes
router.post(
  "/create",
  isAuthenticated,
  upload.single("image"),
  productController.createProduct,
);

router.post("/update/:id", isAuthenticated, productController.updateProduct);

router.get("/", isAuthenticated, productController.getFarmerProducts);

router.post("/delete/:id", isAuthenticated, productController.deleteProduct);

router.get("/market", productController.getMarket);

module.exports = router;
