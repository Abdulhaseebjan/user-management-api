const User = require("../models/User");
const generateToken = require("../utils/generateToken");

async function signup(req, res, next) {
  try {
    const { name, email, password, role } = req.body || {};
    const userRole = role === undefined ? "user" : role;

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: userRole,
      approvalStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Waiting for admin approval.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.approvalStatus === "pending") {
      return res.status(403).json({
        success: false,
        message: "Account is waiting for admin approval",
      });
    }

    if (user.approvalStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Account has been rejected",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { signup, login };
