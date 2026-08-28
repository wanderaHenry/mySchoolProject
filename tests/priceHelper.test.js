const assert = require("assert");
const {
  normalizeProductName,
  getCurrentLowestActivePrice,
  validateNewPrice,
} = require("../utils/priceHelper");

const products = [
  { name: "Tomato", price: 2500, quantity: 20 },
  { name: "Fresh Tomatoes", price: 2800, quantity: 10 },
  { name: "Orange", price: 1800, quantity: 8 },
  { name: "Tomato", price: 3100, quantity: 0 },
];

assert.strictEqual(normalizeProductName(" Tomato  "), "tomato");
assert.strictEqual(normalizeProductName("Fresh Tomatoes"), "tomato");
assert.strictEqual(normalizeProductName("Tomatoes"), "tomato");
assert.strictEqual(normalizeProductName("fresh tomato"), "tomato");

assert.strictEqual(getCurrentLowestActivePrice("Tomato", products), 2500);
assert.strictEqual(getCurrentLowestActivePrice("Orange", products), 1800);
assert.strictEqual(getCurrentLowestActivePrice("Onion", products), null);

const allowed = validateNewPrice({
  productName: "Tomato",
  price: 2600,
  products,
});
assert.strictEqual(allowed.allowed, true);
assert.strictEqual(allowed.warning, false);

const blocked = validateNewPrice({
  productName: "Tomato",
  price: 2400,
  products,
});
assert.strictEqual(blocked.allowed, false);
assert.ok(blocked.message.includes("at least"));

const warning = validateNewPrice({
  productName: "Tomato",
  price: 3000,
  products,
});
assert.strictEqual(warning.allowed, true);
assert.strictEqual(warning.warning, true);

console.log("priceHelper tests passed");
