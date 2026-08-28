// controllers/productController.js
const Product = require("../models/Product");
const User = require("../models/User");
const { validateNewPrice } = require("../utils/priceHelper");
const { calculateDeliveryFee } = require("../utils/deliveryHelper");

const sellerRoles = ["farmer", "aggregator"];

function setFlash(req, key, message) {
  if (!req.session) return;
  req.session[key] = message;
}

async function getActiveProductOptions(excludeProductId = null) {
  const match = { quantity: { $gt: 0 } };
  if (excludeProductId) {
    match._id = { $ne: excludeProductId };
  }
  return Product.find(match).lean();
}

// -----------------------------
// Upload new product
// -----------------------------
exports.createProduct = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.userId);
    if (!user || !sellerRoles.includes(user.role)) {
      return res.status(403).send("Access denied");
    }

    const { name, description, price, quantity } = req.body;
    const productName = String(name || "").trim();
    const productPrice = Number(price);

    if (!productName) {
      setFlash(req, "productError", "Please enter a product name.");
      return res.redirect("/dashboard");
    }

    const activeProducts = await getActiveProductOptions();
    const validation = validateNewPrice({
      productName,
      price: productPrice,
      products: activeProducts,
    });

    if (!validation.allowed) {
      setFlash(req, "productError", validation.message);
      return res.redirect("/dashboard");
    }

    if (validation.warning) {
      setFlash(req, "productWarning", validation.message);
    }

    let imagePath = "/images/1770368612958-home.avif";
    if (req.file && req.file.filename) {
      imagePath = `/images/uploads/${req.file.filename}`;
    }

    const product = new Product({
      name: productName,
      description: String(description || "").trim(),
      price: productPrice,
      quantity: Math.max(0, parseInt(quantity, 10) || 0),
      image: imagePath,
      seller: user._id,
    });

    await product.save();
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Product upload error:", err);
    res.status(500).send("Error uploading product: " + err.message);
  }
};

// -----------------------------
// Market view for all users
// -----------------------------
exports.getMarket = async (req, res) => {
  try {
    const products = await Product.find().populate("seller").lean();
    const customerRegion =
      req.user?.role === "customer" ? req.user.region : null;

    products.forEach((product) => {
      product.deliveryFee =
        customerRegion && product.seller?.region
          ? calculateDeliveryFee(customerRegion, product.seller.region)
          : null;
    });

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

    const user = await User.findById(req.session.userId);
    if (!user || !sellerRoles.includes(user.role)) {
      return res.status(403).send("Access denied");
    }

    const products = await Product.find({ seller: user._id })
      .sort({ createdAt: -1 })
      .lean();
    const errorMessage = req.session.productError;
    const warningMessage = req.session.productWarning;

    delete req.session.productError;
    delete req.session.productWarning;

    res.render("products", {
      products,
      errorMessage,
      warningMessage,
      user,
    });
  } catch (err) {
    console.error("Error fetching farmer products:", err);
    res.status(500).send("Server error");
  }
};

// -----------------------------
// Update a product
// -----------------------------
exports.updateProduct = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.userId);
    if (!user || !sellerRoles.includes(user.role)) {
      return res.status(403).send("Access denied");
    }

    const product = await Product.findOne({
      _id: req.params.id,
      seller: user._id,
    });

    if (!product) {
      return res.status(404).send("Product not found or not authorized");
    }

    const { name, description, price, quantity } = req.body;
    const productName = String(name || "").trim();
    const productPrice = Number(price);

    if (!productName) {
      setFlash(req, "productError", "Please enter a product name.");
      return res.redirect("/products");
    }

    const activeProducts = await getActiveProductOptions(product._id);
    const validation = validateNewPrice({
      productName,
      price: productPrice,
      products: activeProducts,
      allowOwnPriceLower: true,
    });

    if (!validation.allowed) {
      setFlash(req, "productError", validation.message);
      return res.redirect("/products");
    }

    if (validation.warning) {
      setFlash(req, "productWarning", validation.message);
    }

    product.name = productName;
    product.description = String(description || "").trim();
    product.price = productPrice;
    product.quantity = Math.max(0, parseInt(quantity, 10) || 0);

    await product.save();
    res.redirect("/products");
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).send("Error updating product: " + err.message);
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

    const user = await User.findById(req.session.userId);
    if (!user || !sellerRoles.includes(user.role)) {
      return res.status(403).send("Access denied");
    }

    const productId = req.params.id;
    const product = await Product.findOne({
      _id: productId,
      seller: user._id,
    });

    if (!product) {
      return res.status(404).send("Product not found or not authorized");
    }

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
