import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

// Prevent brute-force on auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { message: "Too many attempts, please try again later" },
});

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

// Strips $ and . operators from req.body/query/params to prevent NoSQL injection
export const sanitize = mongoSanitize();
