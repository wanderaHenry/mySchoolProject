const PRICE_WARNING_MULTIPLIER = 1.15;
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "bag",
  "bags",
  "clean",
  "farm",
  "fresh",
  "green",
  "kg",
  "kilogram",
  "local",
  "natural",
  "new",
  "organic",
  "pack",
  "packed",
  "premium",
  "quality",
  "ripe",
  "the",
  "yellow",
]);

function normalizeProductName(name) {
  if (typeof name !== "string") {
    return "";
  }

  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  const tokens = cleaned
    .split(" ")
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token))
    .map((token) => singularize(token));

  return tokens.join(" ").trim();
}

function singularize(token) {
  if (!token) {
    return "";
  }

  if (token.endsWith("ies") && token.length > 4) {
    return token.slice(0, -3) + "y";
  }

  if (token.endsWith("ses") && token.length > 4) {
    return token.slice(0, -2);
  }

  if (
    token.endsWith("es") &&
    token.length > 4 &&
    !["ses", "xes", "zes", "ches", "shes"].some((suffix) =>
      token.endsWith(suffix),
    )
  ) {
    return token.slice(0, -2);
  }

  if (token.endsWith("s") && token.length > 3 && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }

  return token;
}

function findSimilarProducts(productName, products = []) {
  const targetName = normalizeProductName(productName);

  if (!targetName) {
    return [];
  }

  return products.filter((product) => {
    if (!product || !product.name) {
      return false;
    }

    const candidate = normalizeProductName(product.name);
    if (!candidate) {
      return false;
    }

    if (candidate === targetName) {
      return true;
    }

    const candidateTokens = candidate.split(" ");
    const targetTokens = targetName.split(" ");

    return candidateTokens.some((token) => targetTokens.includes(token));
  });
}

function getCurrentLowestActivePrice(productName, products = []) {
  const activeMatches = findSimilarProducts(productName, products).filter(
    (product) => {
      const quantity = Number(product.quantity);
      return Number.isFinite(quantity) && quantity > 0;
    },
  );

  if (!activeMatches.length) {
    return null;
  }

  const prices = activeMatches
    .map((product) => Number(product.price))
    .filter((price) => Number.isFinite(price) && price >= 0);

  if (!prices.length) {
    return null;
  }

  return Math.min(...prices);
}

function isUnreasonablyHigh(price, lowestActivePrice) {
  if (
    !Number.isFinite(price) ||
    !Number.isFinite(lowestActivePrice) ||
    lowestActivePrice <= 0
  ) {
    return false;
  }

  return price > lowestActivePrice * PRICE_WARNING_MULTIPLIER;
}

function validateNewPrice({
  productName,
  price,
  products = [],
  allowOwnPriceLower = false,
}) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return {
      allowed: false,
      warning: false,
      message: "Please enter a valid price in UGX.",
    };
  }

  const currentLowest = getCurrentLowestActivePrice(productName, products);

  if (
    !allowOwnPriceLower &&
    currentLowest !== null &&
    numericPrice < currentLowest
  ) {
    return {
      allowed: false,
      warning: false,
      message: `This product already has an active listing at UGX ${currentLowest.toLocaleString()}. New listings must be at least UGX ${currentLowest.toLocaleString()} or slightly above it.`,
    };
  }

  if (
    currentLowest !== null &&
    isUnreasonablyHigh(numericPrice, currentLowest)
  ) {
    return {
      allowed: true,
      warning: true,
      message: `Warning: UGX ${numericPrice.toLocaleString()} is more than 15% above the current lowest active price of UGX ${currentLowest.toLocaleString()}. This is allowed, but it is much higher than the market minimum.`,
    };
  }

  return {
    allowed: true,
    warning: false,
    message: "Price is valid.",
  };
}

module.exports = {
  normalizeProductName,
  singularize,
  findSimilarProducts,
  getCurrentLowestActivePrice,
  isUnreasonablyHigh,
  validateNewPrice,
  PRICE_WARNING_MULTIPLIER,
};
