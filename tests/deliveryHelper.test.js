const assert = require("assert");
const { calculateDeliveryFee } = require("../utils/deliveryHelper");

assert.strictEqual(calculateDeliveryFee("Western", "Western"), 5000);
assert.strictEqual(calculateDeliveryFee("Eastern", "Central"), 12000);
assert.strictEqual(calculateDeliveryFee("Central", "Northern"), 12000);
assert.strictEqual(calculateDeliveryFee("Eastern", "Western"), 18000);
assert.throws(() => calculateDeliveryFee("Western", undefined));

console.log("deliveryHelper tests passed");
