import express from "express";
import {
  deposit,
  withdraw,
  transfer,
  getTransactionHistory,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/deposit", protect, deposit);
router.post("/withdraw", protect, withdraw);
router.post("/transfer", protect, transfer);
router.get("/history", protect, getTransactionHistory);

export default router;
