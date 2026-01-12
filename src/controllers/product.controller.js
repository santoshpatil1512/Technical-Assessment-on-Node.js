import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import cache from "../config/cache.js";

// CREATE PRODUCT (ADMIN)
export const createProduct = asyncHandler(async (req, res) => {
    const { name, price, stock } = req.body;

    const product = await Product.create({ name, price, stock, createdBy: req.user.id });
    cache.del("products");


    res.status(201).json(product);
});

// LIST PRODUCTS (ALL USERS)
export const listProducts1 = asyncHandler(async (req, res) => {
    const cachedProducts = cache.get("products");

    if (cachedProducts) {
        return res.json(cachedProducts);
    }

    const products = await Product.find();
    cache.set("products", products);

    // res.json(products);
    res.json(products.map(p => ({ _id: p._id, name: p.name, price: p.price, stock: p.stock })));

});
export const listProducts = asyncHandler(async (req, res) => {
  const cacheKey =
    req.user.role === "ADMIN"
      ? `products_admin_${req.user.id}`
      : "products_all";

  const cachedProducts = cache.get(cacheKey);
  if (cachedProducts) {
    return res.json(cachedProducts);
  }

  const query =
    req.user.role === "ADMIN"
      ? { createdBy: req.user.id }
      : {};

  const products = await Product.find(query);
  cache.set(cacheKey, products);

  res.json(products);
});

// UPDATE STOCK (ADMIN)
export const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;

  if (stock < 0) {
    throw new ApiError(400, "Stock cannot be negative");
  }

    // First find the product to get current stock
  const existingProduct = await Product.findOne({
    _id: req.params.id,
    createdBy: req.user.id
  });

    if (!existingProduct) {
    throw new ApiError(404, "Product not found or access denied");
  }

    // Calculate new stock by adding to existing stock
  const newStock = existingProduct.stock + stock;

  const product = await Product.findOneAndUpdate(
    {
      _id: req.params.id,
      createdBy: req.user.id
    },
    { stock: newStock },
    { new: true }
  );

  cache.del(`products_admin_${req.user.id}`);

  res.json(product);
});
