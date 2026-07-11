import User from "../models/User.js";

// @route GET /api/users/profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/users/profile
export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "bio",
      "avatarUrl",
      "startupHistory",
      "investmentHistory",
      "preferences",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/investors  (entrepreneurs browse investors)
export const listInvestors = async (req, res, next) => {
  try {
    const investors = await User.find({ role: "investor" }).select(
      "-password"
    );
    res.json(investors);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/entrepreneurs  (investors browse entrepreneurs)
export const listEntrepreneurs = async (req, res, next) => {
  try {
    const entrepreneurs = await User.find({ role: "entrepreneur" }).select(
      "-password"
    );
    res.json(entrepreneurs);
  } catch (error) {
    next(error);
  }
};
