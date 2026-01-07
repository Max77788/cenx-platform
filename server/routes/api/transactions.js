const express = require("express");
const router = express.Router();
const transactionModule = require("../../modules/transaction/transactionController");

/**
 * @route POST /api/transaction/history
 * @description Get transaction history for a wallet address
 * @access Public
 */
router.post("/history", transactionModule.GetUserTransactions);

/**
 * @route POST /api/transaction/save
 * @description Save a new transaction to the database
 * @access Public
 */
router.post("/save", transactionModule.SaveTransaction);

module.exports = router;

