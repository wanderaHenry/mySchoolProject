// routes/customerRoutes.js
const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

// Assuming isAuthenticated and restrictTo middlewares exist
const {
  isAuthenticated,
  restrictTo,
} = require("../controllers/authController"); // Adjust path if needed

router.get(
  "/dashboard",
  isAuthenticated,
  restrictTo("customer"),
  customerController.getCustomerDashboard,
);

module.exports = router;
