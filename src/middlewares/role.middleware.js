import ApiError from "../utils/ApiError.js";

const isAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    throw new ApiError(403, "Admin access only");
  }
  next();
};

export default isAdmin;
