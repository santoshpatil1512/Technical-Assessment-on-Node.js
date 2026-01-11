import rateLimit from "express-rate-limit";

const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: {
    message: "Too many requests, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default rateLimiter;
