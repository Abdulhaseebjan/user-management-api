const express = require("express");
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateProfileUpdate,
  validatePasswordChange,
} = require("../middleware/validateMiddleware");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.patch(
  "/profile/password",
  protect,
  validatePasswordChange,
  changePassword
);
router.patch("/profile", protect, validateProfileUpdate, updateProfile);

module.exports = router;
