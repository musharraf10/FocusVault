// routes/feedback.js
import express from "express";
import Feedback from "../models/Feedback.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

// Validation middleware
const validateFeedback = [
  body("text")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Feedback text must be between 10 and 1000 characters"),
  body("type")
    .isIn(["positive", "moderate", "general"])
    .withMessage("Invalid feedback type"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("suggestion")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Suggestion must be less than 500 characters"),
];

// @route   POST /api/feedback
// @desc    Submit new feedback
// @access  Private (authenticated users only)
router.post("/", validateFeedback, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { text, type, rating, suggestion } = req.body;
    const { _id: userId, name, profileImage, isVerified } = req.user;

    // Create new feedback
    const feedback = new Feedback({
      userId,
      name,
      profileImage: profileImage || "",
      text,
      type,
      rating: rating || null,
      suggestion: suggestion || "",
      isVerifiedUser: isVerified || false,
    });

    await feedback.save();

    // Populate user data for response
    await feedback.populate("userId", "name email profileImage isVerified");

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting feedback",
    });
  }
});

// @route   GET /api/feedback
// @desc    Get all feedback, grouped and sorted
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;

    let query = { isActive: true };
    if (type && ["positive", "moderate", "general"].includes(type)) {
      query.type = type;
    }

    // Get grouped feedback
    const groupedFeedback = await Feedback.getGroupedFeedback();

    // Get total count for pagination
    const totalCount = await Feedback.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    res.json({
      success: true,
      data: {
        feedback: groupedFeedback,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext,
          hasPrev,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching feedback",
    });
  }
});

router.get("/has-new", async (req, res) => {
  try {
    const unseenCount = await Feedback.countDocuments({
      isActive: true,
      isSeen: false,
      userId: { $ne: req.user._id },
    });

    res.json({
      success: true,
      hasNew: unseenCount > 0,
    });
  } catch (error) {
    console.error("Error checking new feedback:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    const totalFeedback = await Feedback.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        stats,
        totalFeedback,
      },
    });
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching feedback statistics",
    });
  }
});

router.put("/mark-seen", async (req, res) => {
  try {
    const result = await Feedback.updateMany(
      {
        isSeen: false,
        userId: { $ne: req.user._id },
      },
      { $set: { isSeen: true } }
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} feedback(s) as seen.`,
    });
  } catch (error) {
    console.error("Error marking feedback as seen:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update feedback seen status.",
    });
  }
});

router.put("/:id/upvote", async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    const userId = req.user._id;
    const hasUpvoted = feedback.hasUserUpvoted(userId);

    if (hasUpvoted) {
      // Remove upvote
      feedback.upvotes = feedback.upvotes.filter(
        (upvote) => upvote.userId.toString() !== userId.toString()
      );
    } else {
      // Add upvote
      feedback.upvotes.push({ userId });
    }

    await feedback.save();

    res.json({
      success: true,
      message: hasUpvoted ? "Upvote removed" : "Upvote added",
      data: {
        _id: feedback._id,
        upvotes: feedback.upvotes,
        hasUserUpvoted: !hasUpvoted,
      },
    });
  } catch (error) {
    console.error("Error toggling upvote:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating upvote",
    });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback (soft delete)
// @access  Private (only feedback owner or admin)
router.delete("/:id", async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    // Check if user owns the feedback or is admin
    if (
      feedback.userId.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this feedback",
      });
    }

    // Soft delete
    feedback.isActive = false;
    await feedback.save();

    res.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting feedback",
    });
  }
});

router.post("/:id/reply", async (req, res) => {
  try {
    const { text } = req.body;
    const feedbackId = req.params.id;
    const userId = req.user._id;

    if (!text || text.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Reply text is required.",
      });
    }

    const feedback = await Feedback.findById(feedbackId);

    if (!feedback || !feedback.isActive) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found or inactive.",
      });
    }

    const newReply = {
      userId,
      name: req.user.name,
      text: text.trim(),
      createdAt: new Date(),
    };

    feedback.responses.push(newReply);
    await feedback.save();

    // Fetch updated feedback with populated responses (optional)
    const updatedFeedback = await Feedback.findById(feedbackId);

    res.status(200).json({
      success: true,
      message: "Reply added successfully.",
      data: updatedFeedback, // ✅ Send the full updated feedback document here
    });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding reply.",
    });
  }
});

export default router;
