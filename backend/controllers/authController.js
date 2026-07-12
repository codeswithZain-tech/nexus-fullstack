import crypto from "crypto";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @route POST /api/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!["investor", "entrepreneur"].includes(role)) {
      return res.status(400).json({ message: "Role must be investor or entrepreneur" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/login
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled || false,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/forgot-password   { email }
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond the same way whether or not the user exists (avoids leaking which emails are registered)
    if (!user) {
      return res.json({ message: "If that email is registered, reset instructions have been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save();

    // MOCK: log the reset link instead of emailing it (swap in Nodemailer/Resend for real sending)
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    console.log(`[MOCK EMAIL] Password reset link for ${email}: ${resetUrl}`);

    res.json({ message: "If that email is registered, reset instructions have been sent." });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/auth/reset-password   { token, newPassword }
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = newPassword; // pre-save hook hashes it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
