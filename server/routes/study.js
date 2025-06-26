import express from "express";
import StudySession from "../models/StudySession.js";
import Timetable from "../models/Timetable.js";
import Note from "../models/Note.js";
import User from "../models/User.js";
import UserStudyState from "../models/UserStudyState.js";
import CalendarEvent from "../models/CalendarEvent.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Get dashboard data
router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check Redis cache first
    const cacheKey = `dashboard_${userId}_${today.toDateString()}`;
    const cachedData = await req.redis.get(cacheKey);

    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Get today's study sessions
    const todaySessions = await StudySession.find({
      userId,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // Get user stats
    const user = await User.findById(userId);

    // Get weekly data (last 7 days)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);

    const weeklySessions = await StudySession.find({
      userId,
      createdAt: { $gte: weekStart, $lt: tomorrow },
    });

    // Calculate daily totals for the week
    const weeklyData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const daySessions = weeklySessions.filter(
        (session) => session.createdAt >= dayStart && session.createdAt < dayEnd
      );

      const totalMinutes = daySessions.reduce(
        (sum, session) => sum + (session.actualTime || 0),
        0
      );

      weeklyData.push({
        day: date.toLocaleDateString("en", { weekday: "short" }),
        hours: Math.round((totalMinutes / 60) * 10) / 10,
        date: date.toISOString(),
      });
    }

    const dashboardData = {
      todayReading:
        Math.round(
          (todaySessions.reduce((sum, s) => sum + (s.actualTime || 0), 0) /
            60) *
            10
        ) / 10,
      studySessions: todaySessions.length,
      currentStreak: user?.stats?.currentStreak || 0,
      highestStreak: user?.stats?.highestStreak || 0,
      totalStudyHours: user?.stats?.totalStudyHours || 0,
      totalSessions: user?.stats?.totalSessions || 0,
      subjectsStudied: user?.stats?.subjectsStudied || [],
      weeklyData,
      completedSubjects: todaySessions.filter((s) => s.completed),
    };

    // Cache for 5 minutes
    await req.redis.setEx(cacheKey, 300, JSON.stringify(dashboardData));

    res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

// GET /api/study/rankings?range=weekly&page=1&limit=50
router.get("/rankings", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const aggregation = await StudySession.aggregate([
      { $match: { completed: true } },
      {
        $group: {
          _id: "$userId",
          totalStudyHours: { $sum: "$actualTime" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          name: "$user.name",
          profileImage: "$user.profileImage",
          totalStudyHours: 1,
          currentStreak: "$user.stats.currentStreak", // use from user model
        },
      },
      {
        $sort: {
          totalStudyHours: -1,
          currentStreak: -1, // tiebreaker
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    const total = await StudySession.distinct("userId", {
      completed: true,
    }).then((users) => users.length);

    res.json({
      data: aggregation,
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("[Rankings Error]", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all active and paused sessions for user
router.get("/state", async (req, res) => {
  try {
    const userId = req.userId;
    const activeSessions = await UserStudyState.find({
      userId,
      status: { $in: ["active", "paused"] },
    }).sort({ lastActiveAt: -1 });

    res.json(activeSessions);
  } catch (error) {
    console.error("Get study state error:", error);
    res.status(500).json({ message: "Failed to fetch study state" });
  }
});

// Get specific session by sessionId
router.get("/state/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const session = await UserStudyState.findOne({
      userId,
      sessionId,
      status: { $in: ["active", "paused"] },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    console.error("Get session error:", error);
    res.status(500).json({ message: "Failed to fetch session" });
  }
});

// Start new study session
router.post("/state/start", async (req, res) => {
  try {
    const { subject, targetTime = 3600 } = req.body;
    const userId = req.userId;

    if (!subject) {
      return res.status(400).json({ message: "Subject is required" });
    }

    // Check if there's already an active session for this subject
    const existingSession = await UserStudyState.findOne({
      userId,
      subject,
      status: { $in: ["active", "paused"] },
    });

    if (existingSession) {
      // Resume existing session
      existingSession.status = "active";
      existingSession.lastActiveAt = new Date();
      await existingSession.save();
      return res.json(existingSession);
    }

    // Create new session
    const sessionId = uuidv4();
    const newSession = new UserStudyState({
      userId,
      subject,
      targetTime,
      sessionId,
      status: "active",
      startTime: new Date(),
      lastActiveAt: new Date(),
    });

    await newSession.save();
    res.status(201).json(newSession);
  } catch (error) {
    console.error("Start session error:", error);
    res.status(500).json({ message: "Failed to start session" });
  }
});

// Update session (pause/resume/update time)
router.put("/state/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, elapsedTime, notes } = req.body;
    const userId = req.userId;

    const session = await UserStudyState.findOne({
      userId,
      sessionId,
      status: { $in: ["active", "paused"] },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (status) session.status = status;
    if (elapsedTime !== undefined) session.elapsedTime = elapsedTime;
    if (notes !== undefined) session.notes = notes;
    session.lastActiveAt = new Date();

    await session.save();
    res.json(session);
  } catch (error) {
    console.error("Update session error:", error);
    res.status(500).json({ message: "Failed to update session" });
  }
});

// End session and create StudySession record
router.post("/state/:sessionId/end", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes = "" } = req.body;
    const userId = req.userId;

    const session = await UserStudyState.findOne({
      userId,
      sessionId,
      status: { $in: ["active", "paused"] },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Create StudySession record
    const studySession = new StudySession({
      userId,
      subject: session.subject,
      actualTime: session.elapsedTime,
      targetTime: session.targetTime,
      startTime: session.startTime,
      endTime: new Date(),
      completed: true,
      notes: notes || session.notes,
    });

    await studySession.save();

    // Remove from UserStudyState
    await UserStudyState.deleteOne({ _id: session._id });

    // Update user stats
    await updateUserStats(userId, session.elapsedTime, session.subject);

    res.json({
      message: "Session completed successfully",
      studySession,
    });
  } catch (error) {
    console.error("End session error:", error);
    res.status(500).json({ message: "Failed to end session" });
  }
});

// Delete/cancel session
router.delete("/state/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.userId;

    const result = await UserStudyState.deleteOne({
      userId,
      sessionId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({ message: "Session cancelled successfully" });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ message: "Failed to cancel session" });
  }
});

// Helper function to update user stats
async function updateUserStats(userId, sessionTime, subject) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Update total study time and hours
    user.stats.totalStudyTime = (user.stats.totalStudyTime || 0) + sessionTime;
    user.stats.totalStudyHours =
      Math.round((user.stats.totalStudyTime / 3600) * 100) / 100;
    user.stats.totalSessions = (user.stats.totalSessions || 0) + 1;

    // Update subjects studied
    if (!user.stats.subjectsStudied.includes(subject)) {
      user.stats.subjectsStudied.push(subject);
    }

    // Update daily stats
    let todayStats = user.stats.dailyStats.find(
      (stat) => stat.date.toDateString() === today.toDateString()
    );

    if (!todayStats) {
      todayStats = {
        date: today,
        totalTime: 0,
        sessions: 0,
        subjects: [],
      };
      user.stats.dailyStats.push(todayStats);
    }

    todayStats.totalTime += sessionTime;
    todayStats.sessions += 1;

    // Update subject stats for today
    let subjectStats = todayStats.subjects.find((s) => s.name === subject);
    if (!subjectStats) {
      subjectStats = { name: subject, time: 0, sessions: 0 };
      todayStats.subjects.push(subjectStats);
    }
    subjectStats.time += sessionTime;
    subjectStats.sessions += 1;

    // Update streak
    const lastStudyDate = user.stats.lastStudyDate;
    if (!lastStudyDate || lastStudyDate < today) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastStudyDate && lastStudyDate >= yesterday) {
        // Consecutive day
        user.stats.currentStreak = (user.stats.currentStreak || 0) + 1;
      } else {
        // New streak
        user.stats.currentStreak = 1;
      }

      user.stats.lastStudyDate = today;

      // Update highest streak
      if (user.stats.currentStreak > (user.stats.highestStreak || 0)) {
        user.stats.highestStreak = user.stats.currentStreak;
      }
    }

    // Keep only last 30 days of daily stats
    user.stats.dailyStats = user.stats.dailyStats
      .filter((stat) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return stat.date >= thirtyDaysAgo;
      })
      .sort((a, b) => b.date - a.date);

    await user.save();
  } catch (error) {
    console.error("Update user stats error:", error);
  }
}

// Get enhanced analytics
router.get("/analytics", async (req, res) => {
  try {
    const userId = req.userId;
    const { period = "week", subject, startDate, endDate } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let dateFilter = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    } else {
      switch (period) {
        case "month":
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          dateFilter = { date: { $gte: monthAgo } };
          break;
        case "year":
          const yearAgo = new Date(now);
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          dateFilter = { date: { $gte: yearAgo } };
          break;
        case "week":
        default:
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = { date: { $gte: weekAgo } };
      }
    }

    // Filter daily stats
    let dailyStats = user.stats.dailyStats.filter((stat) => {
      if (dateFilter.date) {
        return (
          stat.date >= dateFilter.date.$gte &&
          (!dateFilter.date.$lte || stat.date <= dateFilter.date.$lte)
        );
      }
      return true;
    });

    // Filter by subject if specified
    if (subject) {
      dailyStats = dailyStats
        .map((day) => ({
          ...day.toObject(),
          subjects: day.subjects.filter((s) => s.name === subject),
          totalTime: day.subjects
            .filter((s) => s.name === subject)
            .reduce((sum, s) => sum + s.time, 0),
          sessions: day.subjects
            .filter((s) => s.name === subject)
            .reduce((sum, s) => sum + s.sessions, 0),
        }))
        .filter((day) => day.subjects.length > 0);
    }

    // Calculate summary stats
    const totalTime = dailyStats.reduce((sum, day) => sum + day.totalTime, 0);
    const totalSessions = dailyStats.reduce(
      (sum, day) => sum + day.sessions,
      0
    );
    const averageSessionTime =
      totalSessions > 0 ? totalTime / totalSessions : 0;

    // Subject breakdown
    const subjectBreakdown = {};
    dailyStats.forEach((day) => {
      day.subjects.forEach((subj) => {
        if (!subjectBreakdown[subj.name]) {
          subjectBreakdown[subj.name] = {
            totalTime: 0,
            sessions: 0,
            averageTime: 0,
          };
        }
        subjectBreakdown[subj.name].totalTime += subj.time;
        subjectBreakdown[subj.name].sessions += subj.sessions;
      });
    });

    // Calculate averages
    Object.keys(subjectBreakdown).forEach((subject) => {
      const data = subjectBreakdown[subject];
      data.averageTime = data.sessions > 0 ? data.totalTime / data.sessions : 0;
    });

    res.json({
      summary: {
        totalTime,
        totalSessions,
        averageSessionTime,
        totalHours: Math.round((totalTime / 3600) * 100) / 100,
        daysActive: dailyStats.length,
        period,
      },
      dailyStats: dailyStats.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      ),
      subjectBreakdown,
      userStats: {
        totalStudyHours: user.stats.totalStudyHours,
        totalSessions: user.stats.totalSessions,
        currentStreak: user.stats.currentStreak,
        highestStreak: user.stats.highestStreak,
        subjectsStudied: user.stats.subjectsStudied,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

router.get("/sessions", async (req, res) => {
  try {
    const { date, subject, page = 1, limit = 20 } = req.query;
    const userId = req.userId;

    const query = { userId };

    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    if (subject) {
      query.subject = subject;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCount = await StudySession.countDocuments(query);

    const sessions = await StudySession.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    res.json({
      sessions,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching study sessions:", error);
    res.status(500).json({ message: "Failed to fetch study sessions" });
  }
});

// GET /api/study/sessions/today
router.get("/sessions/today", async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const sessions = await StudySession.find({
      userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching today's study sessions:", error);
    res.status(500).json({ message: "Failed to fetch today's study sessions" });
  }
});

// GET /api/study/sessions/stats
router.get("/sessions/stats", async (req, res) => {
  try {
    const userId = req.userId;
    const { period = "week", subject, filter } = req.query;

    let startDate = new Date();
    switch (period) {
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "week":
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const query = {
      userId,
      createdAt: { $gte: startDate },
    };

    if (subject) {
      query.subject = subject;
    }

    const sessions = await StudySession.find(query).sort({ createdAt: 1 });

    const totalSessions = sessions.length;
    const totalStudyTime = sessions.reduce(
      (sum, s) => sum + (s.actualTime || 0),
      0
    );
    const completedSessions = sessions.filter((s) => s.completed).length;
    const averageSessionTime =
      totalSessions > 0 ? totalStudyTime / totalSessions : 0;

    const subjectStats = {};
    const dailyStats = {};

    sessions.forEach((session) => {
      const date = session.createdAt.toISOString().split("T")[0];

      // Subject stats
      if (!subjectStats[session.subject]) {
        subjectStats[session.subject] = {
          sessions: 0,
          totalTime: 0,
          completed: 0,
        };
      }
      subjectStats[session.subject].sessions++;
      subjectStats[session.subject].totalTime += session.actualTime || 0;
      if (session.completed) subjectStats[session.subject].completed++;

      // Daily stats
      if (!dailyStats[date]) {
        dailyStats[date] = { date, sessions: 0, totalTime: 0, completed: 0 };
      }
      dailyStats[date].sessions++;
      dailyStats[date].totalTime += session.actualTime || 0;
      if (session.completed) dailyStats[date].completed++;
    });

    res.json({
      summary: {
        totalSessions,
        totalStudyTime,
        completedSessions,
        averageSessionTime,
        completionRate:
          totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      },
      subjectStats,
      dailyStats: Object.values(dailyStats),
      period,
    });
  } catch (error) {
    console.error("Error fetching session stats:", error);
    res.status(500).json({ message: "Failed to fetch session statistics" });
  }
});

// POST /api/study/sessions
router.post("/sessions", async (req, res) => {
  try {
    const {
      subject,
      actualTime,
      targetTime,
      startTime,
      endTime,
      completed,
      notes,
    } = req.body;
    const userId = req.userId;

    if (!subject || actualTime === undefined) {
      return res
        .status(400)
        .json({ message: "Subject and actualTime are required" });
    }

    const session = await StudySession.create({
      userId,
      subject,
      actualTime,
      targetTime: targetTime || null,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : new Date(),
      completed: completed || false,
      notes: notes || "",
    });

    // Update user stats
    await updateUserStats(userId, actualTime, subject);

    res.status(201).json(session);
  } catch (error) {
    console.error("Error creating study session:", error);
    res.status(500).json({ message: "Failed to create study session" });
  }
});

// PUT /api/study/sessions/:id
router.put("/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, actualTime, startTime, endTime, completed, notes } =
      req.body;
    const userId = req.userId;

    const session = await StudySession.findOne({ _id: id, userId });

    if (!session) {
      return res.status(404).json({ message: "Study session not found" });
    }

    session.subject = subject || session.subject;
    session.actualTime =
      actualTime !== undefined ? actualTime : session.actualTime;
    session.startTime = startTime ? new Date(startTime) : session.startTime;
    session.endTime = endTime ? new Date(endTime) : session.endTime;
    session.completed = completed !== undefined ? completed : session.completed;
    session.notes = notes !== undefined ? notes : session.notes;

    await session.save();
    res.json(session);
  } catch (error) {
    console.error("Error updating study session:", error);
    res.status(500).json({ message: "Failed to update study session" });
  }
});

// DELETE /api/study/sessions/:id
router.delete("/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const session = await StudySession.findOne({ _id: id, userId });
    if (!session) {
      return res.status(404).json({ message: "Study session not found" });
    }

    await session.deleteOne();
    res.json({ message: "Study session deleted successfully" });
  } catch (error) {
    console.error("Error deleting study session:", error);
    res.status(500).json({ message: "Failed to delete study session" });
  }
});

router.get("/quote", async (req, res) => {
  try {
    const response = await fetch("https://zenquotes.io/api/random");
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quote" });
  }
});

// Calendar notifications endpoint
router.get("/notifications/calendar", async (req, res) => {
  try {
    const userId = req.userId;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's and tomorrow's events
    const upcomingEvents = await CalendarEvent.find({
      userId,
      date: {
        $gte: today,
        $lte: tomorrow,
      },
    }).sort({ date: 1, startTime: 1 });

    res.json({
      events: upcomingEvents,
      count: upcomingEvents.length,
    });
  } catch (error) {
    console.error("Calendar notifications error:", error);
    res.status(500).json({ message: "Failed to fetch calendar notifications" });
  }
});

// Get timetables
router.get("/timetables", async (req, res) => {
  try {
    const cacheKey = `timetable_active_${req.userId}`;
    const cached = await req.redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const timetables = await Timetable.find({ userId: req.userId }).sort({
      createdAt: -1,
    });

    // Optional: cache only if there's an active timetable
    const activeTimetable = timetables.find((t) => t.isActive);
    if (activeTimetable) {
      await req.redis.setEx(cacheKey, 300, JSON.stringify(timetables)); // Cache for 5 minutes
    }

    res.json(timetables);
  } catch (error) {
    console.error("Get timetables error:", error);
    res.status(500).json({ message: "Failed to fetch timetables" });
  }
});

// Create timetable
router.post("/timetables", async (req, res) => {
  try {
    const { name, description, schedule, isActive } = req.body;

    if (!name || !schedule || typeof schedule !== "object") {
      return res
        .status(400)
        .json({ message: "Name and schedule are required and must be valid." });
    }

    const allowedDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const sanitizedSchedule = {};

    // Sanitize each day's schedule
    for (const day of allowedDays) {
      if (Array.isArray(schedule[day])) {
        sanitizedSchedule[day] = schedule[day]
          .map((slot) => ({
            time: slot.time || "",
            subject: slot.subject?.trim() || "",
            duration: Number(slot.duration) || 60,
          }))
          .filter((slot) => slot.time && slot.subject);
      } else {
        sanitizedSchedule[day] = [];
      }
    }

    // Create new timetable
    const timetable = new Timetable({
      userId: req.userId,
      name: name.trim(),
      description: description?.trim() || "",
      schedule: sanitizedSchedule,
      isActive: !!isActive,
    });

    await timetable.save();
    res.status(201).json(timetable);
  } catch (error) {
    console.error("Create timetable error:", error);
    res.status(500).json({ message: "Failed to create timetable" });
  }
});

router.put("/timetables/:id/activate", async (req, res) => {
  try {
    await Timetable.updateMany({ userId: req.userId }, { isActive: false });
    const updated = await Timetable.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isActive: true },
      { new: true }
    );
    const allTimetables = await Timetable.find({ userId: req.userId }).sort({
      createdAt: -1,
    });
    await req.redis.setEx(
      `timetable_active_${req.userId}`,
      300,
      JSON.stringify(allTimetables)
    );
    if (!updated) {
      return res.status(404).json({ message: "Timetable not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Set active timetable error:", error);
    res.status(500).json({ message: "Failed to set active timetable" });
  }
});

router.delete("/timetables/:id", async (req, res) => {
  try {
    await Timetable.deleteOne({ _id: req.params.id, userId: req.userId });
    res.status(200).json({ message: "Timetable deleted successfully" });
  } catch (error) {
    console.error("Delete timetable error:", error);
    res.status(500).json({ message: "Failed to delete timetable" });
  }
});

router.put("/timetables/:id", async (req, res) => {
  try {
    const { name, description, schedule, isActive } = req.body;
    const timetable = await Timetable.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, description, schedule, isActive },
      { new: true }
    );
    res.json(timetable);
  } catch (error) {
    console.error("Update timetable error:", error);
    res.status(500).json({ message: "Failed to update timetable" });
  }
});

// Get notes
router.get("/notes", async (req, res) => {
  try {
    const { search, subject, page = 1, limit = 10 } = req.query;
    const query = { userId: req.userId };

    if (search) query.$text = { $search: search };
    if (subject) query.subject = subject;

    const totalCount = await Note.countDocuments(query);
    const notes = await Note.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      notes,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

// Create note
router.post("/notes", async (req, res) => {
  try {
    const { title, body, subject, tags, isPinned } = req.body;

    const note = new Note({
      userId: req.userId,
      title,
      body,
      subject,
      tags,
      isPinned,
    });

    await note.save();
    res.status(201).json(note);
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ message: "Failed to create note" });
  }
});

// Update note
router.put("/notes/:id", async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ message: "Failed to update note" });
  }
});

// Delete note
router.delete("/notes/:id", async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ message: "Failed to delete note" });
  }
});

export default router;
