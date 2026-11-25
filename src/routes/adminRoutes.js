const express = require("express");
const {
  getPendingUsers,
  updateApprovalStatus,
  getAllUsers,
  getUserById,
  deleteUser,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const { validateApprovalUpdate } = require("../middleware/validateMiddleware");

const router = express.Router();

router.get("/pending-users", protect, adminOnly, getPendingUsers);
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/users/:id", protect, adminOnly, getUserById);
router.patch(
  "/users/:id/approval",
  protect,
  adminOnly,
  validateApprovalUpdate,
  updateApprovalStatus
);
router.delete("/users/:id", protect, adminOnly, deleteUser);

module.exports = router;
