require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

async function createAdmin() {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error(
        "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set in .env"
      );
      process.exitCode = 1;
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);

    const normalizedEmail = ADMIN_EMAIL.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      console.log("An account with ADMIN_EMAIL already exists. No admin was created.");
      process.exitCode = 1;
      return;
    }

    await User.create({
      name: ADMIN_NAME,
      email: normalizedEmail,
      password: ADMIN_PASSWORD,
      role: "admin",
      approvalStatus: "approved",
    });

    console.log("Approved admin created successfully.");
  } catch (error) {
    console.error("Failed to create admin:", error.name || "Unknown error");
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch (error) {
      console.error("Failed to close the MongoDB connection:", error);
      process.exitCode = 1;
    }
  }
}

createAdmin();
