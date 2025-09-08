// controllers/orderController.js
const Order = require("../models/Order");
const Product = require("../models/Product");

// Create order (buyer requests product)
exports.createOrder = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const { productId } = req.body;

    const product = await Product.findById(productId).populate("seller");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const order = new Order({
      product: product._id,
      buyer: req.session.userId,
      total: product.price,
      status: "Pending",
    });

    await order.save();

    res.redirect("/orders");
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).send("Error placing order");
  }
};

// Get all orders for logged-in farmer (seller)
exports.getOrders = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    // Find products owned by this farmer
    const products = await Product.find({ seller: req.session.userId }).lean();

    const orders = await Order.find({ product: { $in: products.map(p => p._id) } })
      .populate("product")
      .populate("buyer")
      .lean();

    res.render("orders", { orders });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Server error");
  }
};

// Update order status (Confirm, Decline, Ship, etc.)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    await Order.findByIdAndUpdate(orderId, { status });

    res.redirect("/orders");
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).send("Error updating order status");
  }
};
