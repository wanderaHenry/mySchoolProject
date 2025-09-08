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

    // Fetch this farmer's products
    const products = await Product.find({ seller: user._id }).lean();

    // Fetch this farmer's orders (linked to their products)
    const orders = await Order.find({ product: { $in: products.map(p => p._id) } })
      .populate("product")
      .populate("buyer")
      .lean();

    // Calculate stats
    const totalSales = orders
      .filter(o => o.status === "Confirmed" || o.status === "Delivered")
      .reduce((sum, o) => sum + o.total, 0);

    const numberOfOrders = orders.length;

    const avgOrderValue = numberOfOrders > 0 ? (totalSales / numberOfOrders).toFixed(2) : 0;

    res.render("dashboard", { 
      user, 
      products, 
      orders, 
      stats: { totalSales, numberOfOrders, avgOrderValue } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
