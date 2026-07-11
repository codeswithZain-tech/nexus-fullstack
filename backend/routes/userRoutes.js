import express from "express";
import {
  getProfile,
  updateProfile,
  getUserById,
  listInvestors,
  listEntrepreneurs,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Entrepreneur dashboard: browse investors
router.get("/investors", protect, authorize("entrepreneur"), listInvestors);

// Investor dashboard: browse entrepreneurs
router.get(
  "/entrepreneurs",
  protect,
  authorize("investor"),
  listEntrepreneurs
);

router.get("/:id", protect, getUserById);

export default router;
