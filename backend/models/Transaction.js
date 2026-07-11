import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["deposit", "withdraw", "transfer"], required: true },
    amount: { type: Number, required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // for transfers
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    stripePaymentIntentId: { type: String },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
