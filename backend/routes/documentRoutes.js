import express from "express";
import {
  uploadDocument,
  getMyDocuments,
  signDocument,
} from "../controllers/documentController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/upload", protect, upload.single("file"), uploadDocument);
router.get("/", protect, getMyDocuments);
router.post("/:id/sign", protect, signDocument);

export default router;
