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
      { userId: user._id },
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

    if (!req.session.userId) {
      return res.redirect("/login");
    }

    const user = await require("../models/User").findById(req.session.userId);
    if (!user) {
      return res.redirect("/login");
    }

    // Fetch the order and populate product
    const order = await Order.findById(orderId).populate("product");
    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Ensure the order belongs to the logged-in customer
    if (order.customerId.toString() !== user._id.toString()) {
      return res.status(403).send("Not authorized to pay for this order");
    }

    // Ensure the order is approved for payment
    if (order.status !== "approved") {
      return res.status(400).send("Order must be approved before payment");
    }

    // Validate phone number format (should be 256XXXXXXXXX for Uganda)
    const phoneRegex = /^256\d{9}$/;
    if (!phoneRegex.test(phone.replace(/^\+/, ""))) {
      return res
        .status(400)
        .send("Invalid phone number format. Use 256XXXXXXXXX");
    }

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
    let tokenResponse;
    try {
      tokenResponse = await axios.post(
        `${baseUrl}/collection/token/`,
        {},
        {
          headers: {
            "Ocp-Apim-Subscription-Key": subscriptionKey,
            Authorization: `Basic ${Buffer.from(`${apiUser}:${apiKey}`).toString("base64")}`,
          },
        },
      );
    } catch (err) {
      console.error("MTN Token Error:", err.response?.data || err.message);
      return res.status(500).send("Failed to get MTN access token");
    }

    const accessToken = tokenResponse.data.access_token;

    // Step 2: Request to pay
    const referenceId = `order-${orderId}-${Date.now()}`;
    let paymentResponse;
    try {
      paymentResponse = await axios.post(
        `${baseUrl}/collection/v1_0/requesttopay`,
        {
          amount: expectedAmount.toString(),
          currency: "UGX",
          externalId: orderId,
          payer: {
            partyIdType: "MSISDN",
            partyId: phone.replace(/^\+/, ""), // Remove + if present
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
    } catch (err) {
      console.error(
        "MTN Payment Request Error:",
        err.response?.data || err.message,
      );
      return res.status(500).send("Failed to initiate MTN payment");
    }

    console.log("MTN Payment Response:", paymentResponse.data);

    // For sandbox, MTN doesn't send real prompts, so we simulate success
    // In production, you would poll the payment status
    if (process.env.NODE_ENV === "production") {
      // Poll for payment status
      let status = "PENDING";
      let attempts = 0;
      while (status === "PENDING" && attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        try {
          const statusResponse = await axios.get(
            `${baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Ocp-Apim-Subscription-Key": subscriptionKey,
                "X-Target-Environment": "sandbox",
              },
            },
          );
          status = statusResponse.data.status;
        } catch (err) {
          console.error("Status check error:", err.message);
        }
        attempts++;
      }

      if (status !== "SUCCESSFUL") {
        return res.status(400).send("Payment not completed or failed");
      }
    }

    // Update order status to paid
    await Order.findByIdAndUpdate(orderId, { status: "paid" });

    res.send("Payment completed successfully. Order status updated to paid.");
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).send("Payment failed: " + err.message);
  }
};
