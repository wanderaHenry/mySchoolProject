// controllers/orderController.js
const Order = require("../models/Order");
const Product = require("../models/Product");

// Create order (buyer requests product)
exports.createOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/login");
    }

    const { productId, quantity } = req.body;

    const product = await Product.findById(productId).populate("seller");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const order = new Order({
      customerId: req.user._id,
      farmerId: product.seller._id,
      product: product._id,
      quantity: parseInt(quantity),
      status: "pending",
    });

    await order.save();

    // Add order to customer's orders
    const Customer = require("../models/Customer");
    await Customer.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { orders: order._id } },
    );

    res.redirect("/customer/dashboard");
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).send("Error placing order");
  }
};

// Get all orders for logged-in farmer (seller)
exports.getOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/login");
    }

    const orders = await Order.find({ farmerId: req.user._id })
      .populate("product")
      .populate("customerId", "name")
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
