// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");

// Middleware to check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.redirect("/login");
  }
};

// Middleware to restrict access to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).send("Access denied");
    }
    next();
  };
};

// Middleware to attach user to req and template locals
exports.attachUser = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      req.user = await User.findById(req.session.userId);
      res.locals.user = req.user;
    } catch (error) {
      console.error("Error attaching user:", error);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
};

// Render login page
exports.getLogin = (req, res) => {
  res.render("login");
};

// Render register page
exports.getRegister = (req, res) => {
  res.render("register");
};

// Render welcome page
exports.getWelcome = (req, res) => {
  // Later we can pass logged-in user's name to pug
  res.render("welcome", { username: "Henry" });
};
