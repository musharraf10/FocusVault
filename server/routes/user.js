import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// user profile
router.put("/profile", async (req, res) => {
  try {
    const { name, dateOfBirth, mobile, profileImage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        number: mobile,
        profileImage,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

//user preferences
router.put("/preferences", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { preferences: req.body },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.preferences);
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

router.patch("/tutorial-complete", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { tutorialCompleted: true },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "Tutorial completed successfully" });
  } catch (error) {
    console.error("Complete tutorial error:", error);
    res.status(500).json({ message: "Failed to complete tutorial" });
  }
});

// Change password
router.put("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(req.userId, { password: hashedPassword });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
});

export default router;
