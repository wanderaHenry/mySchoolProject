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
