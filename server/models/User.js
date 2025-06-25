import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },

    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
      index: { expires: "15m" },
    },

    dateOfBirth: {
      type: Date,
    },
    number: {
      type: String,
      unique: true,
      sparse: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      default: "",
    },

    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      notifications: {
        type: Boolean,
        default: true,
      },
      defaultStudyTime: {
        type: Number,
        default: 60,
      },
      preferredStudyTime: {
        type: String,
        default: "evening",
      },
      preferredStudyHours: {
        start: {
          type: String,
          default: "19:00",
        },
        end: {
          type: String,
          default: "21:00",
        },
      },
      studyDays: {
        type: [String],
        default: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ],
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      studyReminders: {
        type: Boolean,
        default: true,
      },
    },

    stats: {
      totalStudyTime: {
        type: Number,
        default: 0,
      },
      totalStudyHours: {
        type: Number,
        default: 0,
      },
      totalSessions: {
        type: Number,
        default: 0,
      },
      subjectsStudied: {
        type: [String],
        default: [],
      },
      currentStreak: {
        type: Number,
        default: 0,
      },
      highestStreak: {
        type: Number,
        default: 0,
      },
      lastStudyDate: {
        type: Date,
      },
      dailyStats: [
        {
          date: {
            type: Date,
            required: true,
          },
          totalTime: {
            type: Number,
            default: 0,
          },
          sessions: {
            type: Number,
            default: 0,
          },
          subjects: [
            {
              name: String,
              time: Number,
              sessions: Number,
            },
          ],
        },
      ],
    },

    lastNotificationSent: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

export default mongoose.model("User", userSchema);
