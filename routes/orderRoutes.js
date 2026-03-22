const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { isAuthenticated } = require("../controllers/authController");

// Seller views all orders
router.get("/", isAuthenticated, orderController.getOrders);

// Buyer creates a new order
router.post("/create", isAuthenticated, orderController.createOrder);

// Seller updates order status
router.post("/update", isAuthenticated, orderController.updateOrderStatus);

module.exports = router;
