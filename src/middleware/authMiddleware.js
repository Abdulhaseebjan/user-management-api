const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

async function protect(req, res, next) {
  const authorization = req.headers.authorization;
  const tokenMatch = authorization && authorization.match(/^Bearer\s+(\S+)$/i);

  if (!tokenMatch) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(tokenMatch[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }

  if (
    !decodedToken.id ||
    !mongoose.isValidObjectId(decodedToken.id)
  ) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }

  try {
    const user = await User.findById(decodedToken.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (user.approvalStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { protect };
