import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true }, // local path or S3 URL
    fileType: { type: String },
    version: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["draft", "pending_signature", "signed", "archived"],
      default: "draft",
    },
    signature: {
      signedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      signatureImageUrl: String,
      signedAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
