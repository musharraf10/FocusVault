import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import redis from "redis";
import passport from "./config/passport.js";
import jwt from "jsonwebtoken";
dotenv.config();

import authRoutes from "./routes/auth.js";
import studyRoutes from "./routes/study.js";
import todoRoutes from "./routes/todo.js";
import calendarRoutes from "./routes/calendar.js";
import userRoutes from "./routes/user.js";
import chatRoutes from "./routes/chat.js";
import feedback from "./routes/feedback.js";

// Import middleware
import { authMiddleware, requireEmailVerification } from "./middleware/auth.js";
import "./middleware/cleanupPausedSessions.js";

// Import services
import NotificationService from "./services/notificationService.js";

// Import models
import Message from "./models/Message.js";
import User from "./models/User.js";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Redis client setup
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.log("Redis Client Error", err);
});

redisClient.on("ready", () => {
  console.log("Connected to Upstash Redis");
});

await redisClient.connect();
await redisClient.set("foo", "bar");

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/studyapp")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Making Redis client and io available to routes
app.use((req, res, next) => {
  req.redis = redisClient;
  req.io = io;
  next();
});

// Initialized notification service
const notificationService = new NotificationService(io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/study", authMiddleware, requireEmailVerification, studyRoutes);
app.use("/api/todo", authMiddleware, requireEmailVerification, todoRoutes);
app.use(
  "/api/calendar",
  authMiddleware,
  requireEmailVerification,
  calendarRoutes
);
app.use("/api/user", authMiddleware, userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/feedback", authMiddleware, requireEmailVerification, feedback);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const activeUsers = new Map(); // userId -> socketId
const chatRooms = new Map(); // roomId -> Set of user objects

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    // console.log("Received token:", token);

    if (!token) {
      // console.error("No token provided");
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"
    );
    // console.log("Decoded JWT:", decoded);

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.error("User not found");
      return next(new Error("User not found"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    // console.log("Authenticated socket user:", user.email);
    next();
  } catch (err) {
    console.error("Socket auth failed:", err.message);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  // console.log("User connected:", socket.userId);

  // Join user to their personal room for notifications
  socket.join(`user:${socket.userId}`);
  activeUsers.set(socket.userId, socket.id);

  // Study session events
  socket.on("study:start", async (data) => {
    try {
      // Broadcast to user's other devices
      socket.to(`user:${socket.userId}`).emit("study:started", {
        userId: socket.userId,
        subject: data.subject,
        timestamp: new Date(),
      });

      // Send notification to study partners if in a room
      if (data.room) {
        socket.to(data.room).emit("user:study_started", {
          userId: socket.userId,
          username: socket.user.name,
          subject: data.subject,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error("Study start error:", error);
    }
  });

  socket.on("study:pause", async (data) => {
    socket.to(`user:${socket.userId}`).emit("study:paused", {
      userId: socket.userId,
      subject: data.subject,
      elapsedTime: data.elapsedTime,
      timestamp: new Date(),
    });
  });

  socket.on("study:resume", async (data) => {
    socket.to(`user:${socket.userId}`).emit("study:resumed", {
      userId: socket.userId,
      subject: data.subject,
      timestamp: new Date(),
    });
  });

  socket.on("study:complete", async (data) => {
    socket.to(`user:${socket.userId}`).emit("study:completed", {
      userId: socket.userId,
      subject: data.subject,
      actualTime: data.actualTime,
      targetTime: data.targetTime,
      timestamp: new Date(),
    });

    // Notify study room if applicable
    if (data.room) {
      socket.to(data.room).emit("user:study_completed", {
        userId: socket.userId,
        username: socket.user.name,
        subject: data.subject,
        actualTime: data.actualTime,
        timestamp: new Date(),
      });
    }
  });

  // Chat room events
  socket.on("chat:join", async ({ roomId }) => {
    try {
      socket.join(roomId);

      if (!chatRooms.has(roomId)) {
        chatRooms.set(roomId, new Set());
      }

      const room = chatRooms.get(roomId);
      if (room.size >= 5) {
        socket.emit("chat:room_full");
        return;
      }

      const userInfo = {
        id: socket.userId,
        socketId: socket.id,
        name: socket.user.name,
        avatar: socket.user.profileImage || socket.user.name.charAt(0),
        status: "online",
      };

      room.add(userInfo);

      // Send system message
      const joinMessage = new Message({
        userId: socket.userId,
        username: socket.user.name,
        userAvatar: socket.user.profileImage || "",
        message: `${socket.user.name} joined the room`,
        room: roomId,
        messageType: "join",
      });

      await joinMessage.save();

      // Broadcast to room
      io.to(roomId).emit("chat:user_joined", {
        user: userInfo,
        message: joinMessage,
        roomUsers: Array.from(room),
      });

      socket.emit("chat:joined", {
        roomId,
        users: Array.from(room),
      });
    } catch (error) {
      console.error("Chat join error:", error);
      socket.emit("chat:error", { message: "Failed to join room" });
    }
  });

  socket.on("chat:send", async ({ roomId, message }) => {
    try {
      if (!message.trim()) return;

      const newMessage = new Message({
        userId: socket.userId,
        username: socket.user.name,
        userAvatar: socket.user.profileImage || "",
        message: message.trim(),
        room: roomId,
        messageType: "text",
      });

      await newMessage.save();

      // Broadcast to room
      io.to(roomId).emit("chat:message", {
        _id: newMessage._id,
        userId: socket.userId,
        username: socket.user.name,
        userAvatar: socket.user.profileImage || "",
        message: newMessage.message,
        room: roomId,
        messageType: "text",
        createdAt: newMessage.createdAt,
      });
    } catch (error) {
      console.error("Chat send error:", error);
      socket.emit("chat:error", { message: "Failed to send message" });
    }
  });

  socket.on("chat:leave", async ({ roomId }) => {
    try {
      socket.leave(roomId);

      const room = chatRooms.get(roomId);
      if (room) {
        // Remove user from room
        const userArray = Array.from(room);
        const updatedUsers = userArray.filter(
          (user) => user.id !== socket.userId
        );
        chatRooms.set(roomId, new Set(updatedUsers));

        // Send system message
        const leaveMessage = new Message({
          userId: socket.userId,
          username: socket.user.name,
          userAvatar: socket.user.profileImage || "",
          message: `${socket.user.name} left the room`,
          room: roomId,
          messageType: "leave",
        });

        await leaveMessage.save();

        // Broadcast to room
        socket.to(roomId).emit("chat:user_left", {
          userId: socket.userId,
          message: leaveMessage,
          roomUsers: updatedUsers,
        });
      }
    } catch (error) {
      console.error("Chat leave error:", error);
    }
  });

  // Notes events
  socket.on("note:create", (data) => {
    socket.to(`user:${socket.userId}`).emit("note:created", data);
  });

  socket.on("note:update", (data) => {
    socket.to(`user:${socket.userId}`).emit("note:updated", data);
  });

  socket.on("note:delete", (data) => {
    socket.to(`user:${socket.userId}`).emit("note:deleted", data);
  });

  // Timetable events
  socket.on("timetable:update", (data) => {
    socket.to(`user:${socket.userId}`).emit("timetable:updated", data);
  });

  socket.on("disconnect", async () => {
    // console.log("User disconnected:", socket.userId);

    activeUsers.delete(socket.userId);

    // Remove from all chat rooms
    chatRooms.forEach(async (users, roomId) => {
      const userArray = Array.from(users);
      const updatedUsers = userArray.filter(
        (user) => user.socketId !== socket.id
      );

      if (updatedUsers.length !== userArray.length) {
        chatRooms.set(roomId, new Set(updatedUsers));

        // Send leave message if user was in room
        const user = userArray.find((u) => u.socketId === socket.id);
        if (user) {
          try {
            const leaveMessage = new Message({
              userId: socket.userId,
              username: socket.user.name,
              userAvatar: socket.user.profileImage || "",
              message: `${socket.user.name} left the room`,
              room: roomId,
              messageType: "leave",
            });

            await leaveMessage.save();

            socket.to(roomId).emit("chat:user_left", {
              userId: socket.userId,
              message: leaveMessage,
              roomUsers: updatedUsers,
            });
          } catch (error) {
            console.error("Error sending leave message:", error);
          }
        }
      }
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { redisClient, io, notificationService };
