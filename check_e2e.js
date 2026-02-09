require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    console.log(
      "Collections:",
      cols.map((c) => c.name),
    );

    const users = await db
      .collection("users")
      .find()
      .limit(5)
      .toArray()
      .catch(() => []);
    const products = await db
      .collection("products")
      .find()
      .limit(5)
      .toArray()
      .catch(() => []);
    const orders = await db
      .collection("orders")
      .find()
      .limit(5)
      .toArray()
      .catch(() => []);
    const sessions = await db
      .collection("sessions")
      .find()
      .limit(5)
      .toArray()
      .catch(() => []);

    console.log("\n--- users (sample) ---");
    console.dir(users, { depth: 2 });

    console.log("\n--- products (sample) ---");
    console.dir(products, { depth: 2 });

    console.log("\n--- orders (sample) ---");
    console.dir(orders, { depth: 2 });

    console.log("\n--- sessions (sample) ---");
    console.dir(sessions, { depth: 2 });

    process.exit(0);
  } catch (err) {
    console.error("DB check error:", err);
    process.exit(1);
  }
})();
