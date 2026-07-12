import crypto from "crypto";
import User from "../models/User.js";

// In-memory OTP store (use Redis in real production)
const otpStore = new Map(); // userId -> { otp, expiresAt }

// @route POST /api/auth/2fa/send
export const sendOtp = async (req, res, next) => {
  try {
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(req.user._id.toString(), {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
    });

    // MOCK: log to console instead of real email (swap in Nodemailer for real sending)
    console.log(`[MOCK OTP] Sending OTP ${otp} to ${req.user.email}`);

    res.json({ 
      message: "OTP sent (check server logs in this sandbox setup)",
      mockOtp: otp // Added for demo deployment purposes so it can be shown in a popup
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/2fa/verify   { otp }
export const verifyOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const record = otpStore.get(req.user._id.toString());

    if (!record) return res.status(400).json({ message: "No OTP requested" });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(req.user._id.toString());
      return res.status(400).json({ message: "OTP expired" });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    otpStore.delete(req.user._id.toString());
    await User.findByIdAndUpdate(req.user._id, { isVerified: true });

    res.json({ message: "2FA verified successfully" });
  } catch (error) {
    next(error);
  }
};
