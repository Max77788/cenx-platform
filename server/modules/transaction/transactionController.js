const httpStatus = require("http-status");
const otherHelper = require("../../helper/others.helper");
const transactionSchema = require("./transactionSchema");

const transactionController = {};

/**
 * Get transaction history for a user wallet
 * @route POST /api/transaction/history
 * @description Get all transactions for a wallet address
 * @access Public
 */
transactionController.GetUserTransactions = async (req, res, next) => {
  try {
    const { walletAddress, limit = 50, skip = 0 } = req.body;

    if (!walletAddress) {
      return otherHelper.sendResponse(
        res,
        httpStatus.BAD_REQUEST,
        false,
        null,
        null,
        "Wallet address is required",
        null
      );
    }

    const transactions = await transactionSchema
      .find({
        $or: [
          { from: walletAddress.toLowerCase() },
          { to: walletAddress.toLowerCase() },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalCount = await transactionSchema.countDocuments({
      $or: [
        { from: walletAddress.toLowerCase() },
        { to: walletAddress.toLowerCase() },
      ],
    });

    return otherHelper.sendResponse(res, httpStatus.OK, {
      transactions,
      totalCount,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Save a new transaction
 * @route POST /api/transaction/save
 * @description Save a new transaction to the database
 * @access Public
 */
transactionController.SaveTransaction = async (req, res, next) => {
  try {
    const {
      transactionHash,
      from,
      to,
      type,
      amount,
      price,
      blockHash,
      blockNumber,
      gasUsed,
      effectiveGasPrice,
    } = req.body;

    if (!transactionHash || !from || !to) {
      return otherHelper.sendResponse(
        res,
        httpStatus.BAD_REQUEST,
        false,
        null,
        null,
        "Transaction hash, from, and to addresses are required",
        null
      );
    }

    // Check if transaction already exists
    const existingTransaction = await transactionSchema.findOne({
      transactionHash: transactionHash.toLowerCase(),
    });

    if (existingTransaction) {
      return otherHelper.sendResponse(res, httpStatus.OK, {
        transaction: existingTransaction,
        message: "Transaction already exists",
      });
    }

    const transaction = new transactionSchema({
      transactionHash: transactionHash.toLowerCase(),
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      type: type || "transfer",
      amount: amount || "0",
      price: price || "0",
      blockHash,
      blockNumber,
      gasUsed,
      effectiveGasPrice,
    });

    await transaction.save();

    return otherHelper.sendResponse(res, httpStatus.CREATED, {
      transaction,
      message: "Transaction saved successfully",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = transactionController;

