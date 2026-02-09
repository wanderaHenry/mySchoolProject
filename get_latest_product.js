require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Product = mongoose.model(
      "Product",
      new mongoose.Schema({}, { strict: false, collection: "products" }),
    );
    const p = await Product.findOne().sort({ createdAt: -1 }).lean();
    if (!p) {
      console.log("NO_PRODUCT");
      process.exit(0);
    }
    console.log(p._id.toString());
    process.exit(0);
  } catch (err) {
    console.error("ERR", err);
    process.exit(1);
  }
})();
