// controllers/orderController.js
const Order = require("../models/Order");
const Product = require("../models/Product");
const axios = require("axios");

// Create order (buyer requests product)
exports.createOrder = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const user = await require("../models/User").findById(req.session.userId);
    if (!user) {
      return res.redirect("/login");
    }

    const { productId, quantity } = req.body;

    const product = await Product.findById(productId).populate("seller");

    if (!product) {
      return res.status(404).send("Product not found");
    }

    if (quantity > product.quantity) {
      return res.status(400).send("Requested quantity exceeds available stock");
    }

    const order = new Order({
      customerId: user._id,
      farmerId: product.seller._id,
      product: product._id,
      quantity: parseInt(quantity),
      status: "pending",
    });

    await order.save();

    // Reduce product quantity
    product.quantity -= parseInt(quantity);
    await product.save();

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
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const user = await require("../models/User").findById(req.session.userId);
    if (!user || user.role !== "farmer") {
      return res.status(403).send("Access denied");
    }

    const orders = await Order.find({ farmerId: user._id })
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

    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const user = await require("../models/User").findById(req.session.userId);
    if (!user || user.role !== "farmer") {
      return res.status(403).send("Access denied");
    }

    const order = await Order.findById(orderId);
    if (!order || order.farmerId.toString() !== user._id.toString()) {
      return res.status(403).send("Not authorized");
    }

    await Order.findByIdAndUpdate(orderId, { status });

    res.redirect("/orders");
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).send("Error updating order status");
  }
};

// Process payment with MTN API
exports.processPayment = async (req, res) => {
  try {
    const { orderId, phone, amount } = req.body;

    // Get MTN API credentials from environment variables
    const apiUser = process.env.MTN_API_USER;
    const apiKey = process.env.MTN_API_KEY;
    const subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;
    const baseUrl =
      process.env.MTN_BASE_URL || "https://sandbox.momodeveloper.mtn.com";

    if (!apiUser || !apiKey || !subscriptionKey) {
      return res.status(500).send("MTN API credentials not configured");
    }

    // Step 1: Get access token
    const tokenResponse = await axios.post(
      `${baseUrl}/collection/token/`,
      {},
      {
        headers: {
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          Authorization: `Basic ${Buffer.from(`${apiUser}:${apiKey}`).toString("base64")}`,
        },
      },
    );

    const accessToken = tokenResponse.data.access_token;

    // Step 2: Request to pay
    const referenceId = `order-${orderId}-${Date.now()}`;
    const paymentResponse = await axios.post(
      `${baseUrl}/collection/v1_0/requesttopay`,
      {
        amount: amount,
        currency: "UGX",
        externalId: orderId,
        payer: {
          partyIdType: "MSISDN",
          partyId: phone,
        },
        payerMessage: "Payment for order",
        payeeNote: "Order payment",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "Content-Type": "application/json",
        },
      },
    );

    // Check payment status (in real app, this should be asynchronous)
    // For simplicity, assume success
    await Order.findByIdAndUpdate(orderId, { status: "paid" });

    res.send("Payment initiated successfully. Order status updated to paid.");
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).send("Payment failed: " + err.message);
  }
};
