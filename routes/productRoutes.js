const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get("/market", productController.getMarket);

module.exports = router;
