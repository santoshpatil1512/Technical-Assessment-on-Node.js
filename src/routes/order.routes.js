import express from "express";
import {
  createOrder,
  getOrderById,
  listOrders,
  cancelOrder
} from "../controllers/order.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, listOrders);
router.get("/:orderId", authMiddleware, getOrderById);
router.put("/:orderId/cancel", authMiddleware, cancelOrder);

export default router;
