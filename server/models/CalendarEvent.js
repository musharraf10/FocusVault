import mongoose from "mongoose";

const calendarEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    type: {
      type: String,
      enum: ["study", "exam", "assignment", "reminder", "other"],
      default: "other",
    },
    subject: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    reminder: {
      enabled: {
        type: Boolean,
        default: false,
      },
      time: {
        type: Number,
        default: 15,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for date-based queries
calendarEventSchema.index({ userId: 1, date: 1 });

export default mongoose.model("CalendarEvent", calendarEventSchema);
