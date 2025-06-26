import mongoose from "mongoose";

const userStudyStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    elapsedTime: {
      type: Number,
      default: 0, // in seconds
    },
    targetTime: {
      type: Number,
      default: 3600, // in seconds (1 hour default)
    },
    status: {
      type: String,
      enum: ["active", "paused", "completed"],
      default: "active",
    },
    sessionId: {
      type: String,
      required: true,
      // unique: true,
    },
    notes: {
      type: String,
      default: "",
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
userStudyStateSchema.index({ userId: 1, status: 1 });
userStudyStateSchema.index({ userId: 1, subject: 1 });
// userStudyStateSchema.index({ sessionId: 1 }, { unique: true });

export default mongoose.model("UserStudyState", userStudyStateSchema);
