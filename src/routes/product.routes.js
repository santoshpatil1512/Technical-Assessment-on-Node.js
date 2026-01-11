import express from "express";
import {
  createProduct,
  listProducts,
  updateStock
} from "../controllers/product.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/role.middleware.js";

const router = express.Router();

// Admin only
router.post("/", authMiddleware, isAdmin, createProduct);
router.put("/:id/stock", authMiddleware, isAdmin, updateStock);

// All authenticated users
router.get("/", authMiddleware, listProducts);

export default router;
