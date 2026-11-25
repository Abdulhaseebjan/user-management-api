const mongoose = require("mongoose");
const User = require("../models/User");

async function updateApprovalStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body || {};

    if (!["approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Approval status must be approved or rejected",
      });
    }

    if (String(req.user._id).toLowerCase() === id.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own approval status",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.approvalStatus = approvalStatus;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User approval status updated successfully",
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

async function getPendingUsers(req, res, next) {
  try {
    const pendingUsers = await User.find({ approvalStatus: "pending" })
      .select("-password")
      .sort({ createdAt: -1 });

    const users = pendingUsers.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
    }));

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return next(error);
  }
}

async function getAllUsers(req, res, next) {
  try {
    const { approvalStatus } = req.query;
    const filter = {};

    if (approvalStatus !== undefined) {
      if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid approval status filter",
        });
      }

      filter.approvalStatus = approvalStatus;
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (String(req.user._id).toLowerCase() === id.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  updateApprovalStatus,
  getPendingUsers,
  getAllUsers,
  getUserById,
  deleteUser,
};
