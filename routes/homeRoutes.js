// routes/homeRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

// Middleware to check auth
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
}

// Home
router.get("/", (req, res) => {
  res.render("index");
});

// About
router.get("/about", (req, res) => {
  res.render("about");
});

// Contact
router.get("/contact", (req, res) => {
  res.render("contactUs");
});

// Welcome
router.get("/welcome", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).lean();
    res.render("welcome", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Dashboard
router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).lean();

    if (!user) return res.redirect("/login");

    if (user.role !== "farmer") return res.redirect("/customer/dashboard");

    // Fetch this farmer's products
    const products = await Product.find({ seller: user._id }).lean();

    // Fetch this farmer's orders (linked to their products)
    const orders = await Order.find({ farmerId: user._id })
      .populate("product")
      .populate("customerId", "name")
      .lean();

    // Calculate stats
    const totalSales = orders
      .filter((o) => o.status === "paid" || o.status === "delivered")
      .reduce((sum, o) => {
        const price = o.product && o.product.price ? o.product.price : 0;
        return sum + o.quantity * price;
      }, 0);

    const numberOfOrders = orders.length;

    const avgOrderValue =
      numberOfOrders > 0 ? (totalSales / numberOfOrders).toFixed(2) : 0;

    res.render("dashboard", {
      user,
      products,
      orders,
      totalSales,
      numberOfOrders,
      avgOrderValue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
