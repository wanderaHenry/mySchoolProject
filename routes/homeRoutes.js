const express = require("express");
const router = express.Router();
const User = require("../models/User"); // import your User model

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

// Market
router.get("/market", async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.redirect("/login"); // redirect if not logged in
    }

    // Fetch user from DB (or just use session info)
    const user = await User.findById(req.session.userId).lean();

    if (!user) {
      return res.redirect("/login"); // user not found
    }

    // Render market page with user data
    res.render("market", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// ✅ Welcome
router.get("/welcome", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login"); // redirect if not logged in
    }

    // Option 1: fetch full user from DB
    const user = await User.findById(req.session.userId).lean();

    // Option 2 (simpler if only name needed):
    // const user = { name: req.session.userName };

    if (!user) {
      return res.redirect("/login");
    }

    res.render("welcome", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Dashboard
router.get("/dashboard", async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.redirect("/login"); // redirect if not logged in
    }

    // Fetch user info from DB (optional: only name needed from session)
    const user = await User.findById(req.session.userId).lean();

    if (!user) {
      return res.redirect("/login"); // user not found
    }

    // Render dashboard with user data
    res.render("dashboard", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


module.exports = router;
