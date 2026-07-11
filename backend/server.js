import http from "http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import { authLimiter, apiLimiter, sanitize } from "./middleware/security.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { initVideoSignaling } from "./sockets/videoSignaling.js";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { stripeWebhook } from "./controllers/paymentController.js";

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

// Stripe webhook needs raw body — register BEFORE express.json()
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitize); // NoSQL injection protection
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Nexus backend is running" });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/auth/2fa", otpRoutes);
app.use("/api/users", userRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/messages", messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

// Attach WebRTC signaling (Socket.IO) to the same HTTP server
initVideoSignaling(httpServer, process.env.CLIENT_URL);

httpServer.listen(PORT, () => {
  console.log(`Nexus backend (HTTP + Socket.IO) running on port ${PORT}`);
});
