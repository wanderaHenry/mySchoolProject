const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Seller views all orders
router.get("/", orderController.getOrders);

// Buyer creates a new order
router.post("/create", orderController.createOrder);

// Seller updates order status
router.post("/update", orderController.updateOrderStatus);

module.exports = router;
