const deliveryFees = {
  sameRegion: 5000,
  neighbouringRegion: 12000,
  farRegion: 18000,
};

const neighbouringRegions = new Set([
  "Central-Eastern",
  "Central-Northern",
  "Central-Western",
]);

function isNeighbouringRegion(customerRegion, farmerRegion) {
  const pair = [customerRegion, farmerRegion].sort().join("-");
  return neighbouringRegions.has(pair);
}

// Delivery is paid by the customer and depends on both saved user regions.
function calculateDeliveryFee(customerRegion, farmerRegion) {
  if (!customerRegion || !farmerRegion) {
    throw new Error("Both customer and farmer regions are required");
  }

  if (customerRegion === farmerRegion) {
    return deliveryFees.sameRegion;
  }

  if (isNeighbouringRegion(customerRegion, farmerRegion)) {
    return deliveryFees.neighbouringRegion;
  }

  return deliveryFees.farRegion;
}

module.exports = { calculateDeliveryFee };
