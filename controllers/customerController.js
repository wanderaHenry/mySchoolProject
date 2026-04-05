// controllers/customerController.js
const Order = require("../models/Order");
const User = require("../models/User");

exports.getCustomerDashboard = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.userId);
    if (!user || user.role !== "customer") {
      return res.status(403).send("Access denied. Customer role required.");
    }

    // Fetch all orders for the logged-in customer
    const orders = await Order.find({ customerId: user._id })
      .populate("farmerId", "name phone") // Populate farmer details including phone
      .populate("product", "name") // Populate product name
      .sort({ createdAt: -1 }); // Sort by latest

    // Render the dashboard with orders data
    res.render("customer/dashboard", {
      user: user,
      orders: orders,
    });
  } catch (error) {
    console.error("Error fetching customer dashboard:", error);
    res.status(500).send("Internal server error");
  }
};
