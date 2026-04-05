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

    const { name, description, price, quantity } = req.body; // Added quantity

    const product = new Product({
      name,
      description,
      price,
      quantity: parseInt(quantity) || 0, // Added quantity
      image: req.file ? `/images/uploads/${req.file.filename}` : null, // multer handles uploaded file
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
    // 1. Fetch all products and populate seller details
    const products = await Product.find().populate("seller").lean();

    res.render("market", {
      products: products || [],
      user: req.user || { name: "Guest", role: "guest" },
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
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const user = await require("../models/User").findById(req.session.userId);
    if (!user || user.role !== "farmer") {
      return res.status(403).send("Access denied");
    }

    const products = await Product.find({ seller: user._id }).lean();

    res.render("products", { products });
  } catch (err) {
    console.error("Error fetching farmer products:", err);
    res.status(500).send("Server error");
  }
};

// -----------------------------
// Delete a product
// -----------------------------
exports.deleteProduct = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const user = await require("../models/User").findById(req.session.userId);
    if (!user || user.role !== "farmer") {
      return res.status(403).send("Access denied");
    }

    const productId = req.params.id;

    // Ensure the product belongs to the logged-in farmer
    const product = await Product.findOne({
      _id: productId,
      seller: user._id,
    });

    if (!product) {
      return res.status(404).send("Product not found or not authorized");
    }

    // Check if there are any orders for this product
    const Order = require("../models/Order");
    const ordersCount = await Order.countDocuments({
      product: productId,
      status: { $in: ["pending", "approved"] },
    });

    if (ordersCount > 0) {
      return res
        .status(400)
        .send(
          "Cannot delete product with active orders. Please resolve orders first.",
        );
    }

    await Product.findByIdAndDelete(productId);

    res.redirect("/products");
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Server error");
  }
};
