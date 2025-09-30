const express = require("express");
const router = express.Router();
const {
  getTransactionBuy,
  getTransactionSell,
  createTransactionBuy,
  createTransactionSell,
  updateTransactionBuy,
  updateTransactionSell,
  deleteTransactionBuy,
  deleteTransactionSell
} = require("../controllers/transactionController");

router.get("/buy", getTransactionBuy);
router.get("/sell", getTransactionSell);
router.post("/buy" , createTransactionBuy);
router.post("/sell" , createTransactionSell);
router.put("/buy/:id", updateTransactionBuy);
router.put("/sell/:id", updateTransactionSell);
router.delete("/buy/:id", deleteTransactionBuy);
router.delete("/sell/:id", deleteTransactionSell);

module.exports = router;