const express = require("express");
const router = express.Router();

console.log("📦 Loading token routes module...");

let tokenModule;
try {
  tokenModule = require("../../modules/token/tokenController");
  console.log("✅ Token controller loaded successfully");
} catch (err) {
  console.error("❌ ERROR loading token controller:", err);
  throw err;
}

/**
 * @route GET /api/token/price
 * @description Get current token price in USD
 * @access Public
 */
router.get("/price", (req, res, next) => {
  console.log("📍 ROUTE HIT: /api/token/price");
  console.log("📍 Query params:", req.query);
  console.log("📍 tokenModule:", typeof tokenModule);
  console.log("📍 GetTokenPrice:", typeof tokenModule.GetTokenPrice);
  
  if (!tokenModule || !tokenModule.GetTokenPrice) {
    console.error("❌ GetTokenPrice function not found!");
    return res.status(500).json({ error: "GetTokenPrice function not found" });
  }
  
  tokenModule.GetTokenPrice(req, res, next);
});

/**
 * @route GET /api/token/price-history
 * @description Get token price history
 * @access Public
 */
router.get("/price-history", tokenModule.GetTokenPriceHistory);

/**
 * @route GET /api/token/transfers
 * @description Get token transfers from Moralis
 * @access Public
 */
router.get("/transfers", (req, res, next) => {
  console.log("📍 ROUTE HIT: /api/token/transfers");
  console.log("📍 Query params:", req.query);
  console.log("📍 tokenModule:", typeof tokenModule);
  console.log("📍 GetTokenTransfers:", typeof tokenModule.GetTokenTransfers);
  
  if (!tokenModule || !tokenModule.GetTokenTransfers) {
    console.error("❌ GetTokenTransfers function not found!");
    return res.status(500).json({ error: "GetTokenTransfers function not found" });
  }
  
  tokenModule.GetTokenTransfers(req, res, next);
});

module.exports = router;

