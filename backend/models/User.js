import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["investor", "entrepreneur"],
      required: true,
    },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },

    // Entrepreneur-specific
    startupHistory: [
      {
        name: String,
        description: String,
        stage: String, // idea, mvp, seed, growth
        fundingNeeded: Number,
      },
    ],

    // Investor-specific
    investmentHistory: [
      {
        startupName: String,
        amount: Number,
        year: Number,
        sector: String,
      },
    ],
    preferences: {
      sectors: [String],
      minTicketSize: Number,
      maxTicketSize: Number,
    },

    isVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
