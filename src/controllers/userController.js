const User = require("../models/User");

function getUserDetails(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    approvalStatus: user.approvalStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function getProfile(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      user: getUserDetails(req.user),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;

    if (name !== undefined) {
      req.user.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: req.user._id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered",
        });
      }

      req.user.email = normalizedEmail;
    }

    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: getUserDetails(req.user),
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

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getProfile, updateProfile, changePassword };
