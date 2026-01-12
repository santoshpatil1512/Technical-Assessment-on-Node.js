import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { simulatePayment } from "../services/payment.service.js";
import { ORDER_STATUS } from "../constants/orderStatus.js";
import cache from "../config/cache.js";

const generateOrderId = () => {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};


export const createOrder = asyncHandler(async (req, res) => {
    const { items } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
        throw new ApiError(400, "Order items required");
    }

    let totalAmount = 0;

    // STEP 1: ATOMIC STOCK REDUCTION
    for (const item of items) {
        const product = await Product.findOneAndUpdate(
            {
                _id: item.product,
                stock: { $gte: item.quantity }
            },
            {
                $inc: { stock: -item.quantity }
            },
            { new: true }
        );

        if (!product) {
            throw new ApiError(400, "Insufficient stock");
        }

        totalAmount += product.price * item.quantity;
    }

    // STEP 2: CREATE ORDER
    const order = await Order.create({
        orderId: generateOrderId(),
        user: userId,
        items,
        totalAmount,
        status: ORDER_STATUS.CREATED
    });
    cache.del(`order_${order.orderId}`);

    // STEP 3: PAYMENT SIMULATION
    const paymentSuccess = simulatePayment();

    if (!paymentSuccess) {
        // ROLLBACK STOCK
        for (const item of items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }

        order.status = ORDER_STATUS.CANCELLED;
        await order.save();

        return res.status(400).json({
            message: "Payment failed. Order cancelled."
        });
    }

    // PAYMENT SUCCESS
    order.status = ORDER_STATUS.CONFIRMED;
    await order.save();

    res.status(201).json(order);
});

export const getOrderById = asyncHandler(async (req, res) => {
    const cacheKey = `order_${req.params.orderId}`;
    const cachedOrder = cache.get(cacheKey);

    if (cachedOrder) {
        return res.json(cachedOrder);
    }

    const order = await Order.findOne({ orderId: req.params.orderId })
        .populate("items.product");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (
        req.user.role !== "ADMIN" &&
        order.user.toString() !== req.user.id
    ) {
        throw new ApiError(403, "Access denied");
    }

    cache.set(cacheKey, order);
    res.json(order);
});


export const listOrders = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status;

    const query = {};

    if (status) {
        query.status = status;
    }

    if (req.user.role !== "ADMIN") {
        query.user = req.user.id;
    }

    const orders = await Order.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.json(orders);
});

// export const cancelOrder = asyncHandler(async (req, res) => {
//     const order = await Order.findOne({ orderId: req.params.orderId });

//     if (!order) {
//         throw new ApiError(404, "Order not found");
//     }

//     if (
//         req.user.role !== "ADMIN" &&
//         order.user.toString() !== req.user.id
//     ) {
//         throw new ApiError(403, "Access denied");
//     }

//     // if (order.status !== ORDER_STATUS.CREATED) {
//     //     throw new ApiError(400, "Order cannot be cancelled");
//     // }

//     if (
//         order.status === ORDER_STATUS.CONFIRMED &&
//         req.user.role !== "ADMIN"
//     ) {
//         throw new ApiError(403, "Only admin can cancel confirmed orders");
//     }

//     if (order.status === ORDER_STATUS.CANCELLED) {
//         throw new ApiError(400, "Order already cancelled");
//     }

//     // RESTORE STOCK
//     for (const item of order.items) {
//         await Product.findByIdAndUpdate(item.product, {
//             $inc: { stock: item.quantity }
//         });
//     }

//     order.status = ORDER_STATUS.CANCELLED;
//     await order.save();

//     cache.del(`order_${order.orderId}`);

//     res.json({ message: "Order cancelled successfully" });
// });

export const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ orderId: req.params.orderId }).populate("items.product");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // CUSTOMER: can cancel only own orders
    if (req.user.role === "CUSTOMER") {
        if (order.user.toString() !== req.user.id) {
            throw new ApiError(403, "Access denied");
        }
    }

    // ADMIN: can cancel only if products belong to him
    if (req.user.role === "ADMIN") {
        const unauthorizedProduct = order.items.find(
            item => item.product.createdBy.toString() !== req.user.id
        );

        if (unauthorizedProduct) {
            throw new ApiError(
                403,
                "You are not allowed to cancel orders for products you do not own"
            );
        }
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
        throw new ApiError(400, "Order already cancelled");
    }

    // RESTORE STOCK
    for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product._id, {
            $inc: { stock: item.quantity }
        });
    }

    order.status = ORDER_STATUS.CANCELLED;
    await order.save();

    res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
    });
});
