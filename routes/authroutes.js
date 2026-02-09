// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
}

// Register
router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", async (req, res) => {
  try {
    const { name, region, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).send("Passwords do not match");
    }

    const user = new User({ name, region, email, password });
    await user.save();

    res.redirect("/login");
  } catch (err) {
    res.status(400).send("Error registering user: " + err.message);
  }
});

// ✅ Login
router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).send("Invalid email or password");
    }

    req.session.userId = user._id;
    req.session.userName = user.name;
    res.redirect("/welcome");
  } catch (err) {
    res.status(500).send("Login error: " + err.message);
  }
});

// Protected routes are handled in `homeRoutes.js` to ensure a single
// source of truth for `/welcome` and `/dashboard`. Keep auth routes
// focused on registration/login/logout.

// ✅ Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;
