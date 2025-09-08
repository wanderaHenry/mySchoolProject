// controllers/productController.js
const Product = require("../models/Product");

// -----------------------------
// Upload new product
// -----------------------------
exports.createProduct = async (req, res) => {
  try {
    // Ensure user is logged in
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const { name, description, price } = req.body;

    const product = new Product({
      name,
      description,
      price,
      image: req.file ? `/images/${req.file.filename}` : null, // multer handles uploaded file
      seller: req.session.userId,
    });

    await product.save();

    res.redirect("/dashboard");
  } catch (err) {
    console.error("Product upload error:", err);
    res.status(500).send("Error uploading product");
  }
};

// -----------------------------
// Market view for all users
// -----------------------------
exports.getMarket = async (req, res) => {
  try {
    const products = await Product.find().populate("seller").lean();

    res.render("market", {
      products,
      user: { name: req.session.userName },
    });
  } catch (err) {
    console.error("Error fetching market:", err);
    res.status(500).send("Server error");
  }
};

// -----------------------------
// Farmer views their own products
// -----------------------------
exports.getFarmerProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.session.userId }).lean();

    res.render("products", { products });
  } catch (err) {
    console.error("Error fetching farmer products:", err);
    res.status(500).send("Server error");
  }
};
