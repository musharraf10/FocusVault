# FocusVault Interview Preparation Guide

This document is interview-focused and based on the actual codebase.

## 1) Project Overview
- **Problem solved**: Students often use disconnected tools for study timing, notes, todos, calendar, and accountability. FocusVault unifies these into one app.  
- **Real-world use case**: A college student plans weekly subjects, runs timed sessions, tracks streaks, manages assignments, and chats with a study group.  
- **Target users**: Students, exam aspirants, self-learners, and accountability-focused study groups.  
- **Main purpose**: Improve study consistency and visibility by combining planning + execution + reflection workflows.
- **Value proposition**: One login, one dashboard, one source of truth for study behavior and productivity signals.
- **Core business logic**:
  - Session lifecycle (start/pause/resume/complete)
  - Aggregated progress dashboards
  - Auth-gated productivity data
  - Real-time collaborative chat for motivation

## 2) Tech Stack Analysis
- **Frontend**: React 18, Vite, Tailwind, React Router, Axios, Socket.io client, Recharts.
- **Backend**: Node.js + Express, Mongoose, JWT, Passport (Google OAuth), Socket.io.
- **Database**: MongoDB (document model) + Redis (cache + runtime support).
- **Authentication**: Email/password + Google OAuth + JWT bearer token.
- **APIs**: REST endpoints for auth/study/todo/calendar/user/feedback; websocket events for live features.
- **State management**: React Context (Auth, Study, Theme, Socket, Chat/Feedback contexts).
- **Deployment-related**: Netlify config in frontend; env-driven backend config.
- **Why this stack**: Fast JS end-to-end delivery and simple iteration across UI + API + DB.
- **Tradeoffs**:
  - Context is lightweight but can become noisy at scale (vs Redux/Zustand).
  - Mongo flexibility speeds development but can increase schema drift risk.
  - JWT in localStorage is easy but has XSS exposure tradeoff.

## 3) Architecture Explanation
1. User opens PWA frontend.
2. `AuthProvider` loads token from localStorage, sets Axios auth header.
3. App route-guards based on auth + email verification + tutorial status.
4. Frontend calls protected API routes with bearer token.
5. `authMiddleware` verifies JWT, hydrates `req.user`.
6. Business routes (study/todo/calendar) operate per `req.userId`.
7. Mongo stores durable entities; Redis caches expensive dashboard aggregate.
8. Socket.io authenticates JWT during handshake for live chat/study events.

### Request-response lifecycle
- Client sends request with `Authorization: Bearer <token>`.
- Middleware validates token and user.
- Route handler executes DB query/update.
- Optional caching layer returns cached aggregate or writes fresh value.
- JSON response returned to client.

### Folder structure (high-level)
- `frontend/src/components`: reusable UI blocks and feature components.
- `frontend/src/pages`: route-level pages.
- `frontend/src/context`: global contexts and providers.
- `server/routes`: REST modules by domain.
- `server/models`: Mongoose schemas.
- `server/middleware`: auth, cleanup, rate controls.
- `server/services`: email/notification services.

## 4) Feature Breakdown (Major)
### A) Authentication
- **Does**: Register/login, email verification, reset password, Google OAuth.
- **Internals**: bcrypt pre-save hash + JWT issue + verification token workflow.
- **Files**: `server/routes/auth.js`, `server/models/User.js`, `server/middleware/auth.js`, `frontend/src/context/AuthContext.jsx`.
- **Implementation reason**: Balanced UX and security for student-facing app.
- **Interview Q sample**: “Why JWT and not server session?”

### B) Study Tracking + Dashboard
- **Does**: Start/pause/resume sessions, compute daily/weekly metrics.
- **Internals**: Persist active state in `UserStudyState`, completed sessions in `StudySession`, compute chart aggregates.
- **Files**: `server/routes/study.js`, related models, `frontend/src/components/study/*`, `frontend/src/components/home/*`.
- **API examples**: `/api/study/state/start`, `/api/study/dashboard`.
- **Reason**: Supports both real-time session continuity and historical analytics.

### C) Todo + Calendar
- **Does**: Plan tasks/events with categories, priorities, reminders.
- **Internals**: User-scoped CRUD with filtered retrieval.
- **Files**: `server/routes/todo.js`, `server/routes/calendar.js`, models, corresponding pages.

### D) Real-time Chat Rooms
- **Does**: Join room, broadcast messages, room membership cap.
- **Internals**: JWT-authenticated socket handshake, `chatRooms` in-memory map, message persistence.
- **Files**: `server/index.js`, `server/models/Message.js`, `frontend/src/components/study/ChatRoom.jsx`.

## 5) Database Design
- Key collections: `User`, `StudySession`, `UserStudyState`, `Note`, `Todo`, `CalendarEvent`, `Message`, `Feedback`, `Timetable`.
- Relationships: mostly `userId` references each user-owned entity.
- Indexing present:
  - Calendar by `{ userId, date }`
  - Feedback by `{ type, createdAt }`, `{ userId }`, `{ isActive }`
  - Reset password expiry TTL-like index field on user reset expiration
- Why chosen: Document schema fits rapidly evolving productivity features.

## 6) Authentication & Security
- JWT bearer auth middleware on protected routes.
- Email verification gate enforced by `requireEmailVerification`.
- Password hashing with bcrypt salt rounds.
- Security middleware: Helmet, CORS, Express rate limiter, body size limits.
- Improvements to discuss honestly:
  - Move JWT storage from localStorage to httpOnly secure cookies.
  - Add refresh token rotation.
  - Add CSRF strategy if cookie auth is adopted.
  - Strengthen route-level validation with `express-validator` everywhere.

## 7) Performance & Optimization
- Redis caching for dashboard aggregate (5-minute TTL).
- Pagination on rankings endpoint via `page/limit`.
- Compression middleware for network payload reduction.
- Socket-based push avoids polling for chat/study presence.
- Bottlenecks to mention:
  - In-memory `chatRooms` map is single-instance (not horizontally scalable).
  - Repeated weekly computations per request when cache misses.
  - Missing widespread DB projection/select optimization on some reads.

## 8) Interview Answer Pack
### HR-level (simple)
“FocusVault is a student productivity app where users can plan tasks, run study timers, track streaks, and collaborate in live study chat. I built it as a PWA so students can use it like a native app.”

### Technical (mid-depth)
“It’s a MERN-style architecture: React/Vite frontend, Express API, MongoDB via Mongoose, Redis cache, JWT auth, and Socket.io for real-time collaboration. The core logic is session lifecycle tracking + analytics aggregation.”

### Deep technical (senior)
“I separated transient state (`UserStudyState`) from durable history (`StudySession`) to support interruption recovery and analytical reporting. I protected mutating routes through JWT middleware plus email verification middleware, and reduced hot-path dashboard cost with Redis TTL caching. For chat, I used socket handshake JWT verification and persistence to `Message` for history, with room-level constraints.”

### “Tell me about your project”
Use structure: **problem → architecture → hardest part → impact → next improvements**.

### “Challenges faced”
- Designing resilient pause/resume flow across tabs/devices.
- Keeping analytics fresh without expensive recalculation on every request.
- Balancing quick auth UX with verification/security guardrails.

### “Why this stack?”
- Single-language JS stack improved velocity.
- Mongo schema flexibility matched evolving product needs.
- Socket.io simplified real-time social features.

### “What would you improve?”
- Distributed room presence via Redis adapter.
- Token refresh + cookie-based auth.
- Better observability (structured logs, metrics, tracing).

### “What did YOU build?”
Emphasize personal ownership by modules: auth workflow, study session state engine, dashboard aggregation, and websocket chat integration.

## 9) Possible Interview Questions (sample)
1. **Why split active and completed study models?**
   - **Answer**: Active sessions need frequent mutation and recovery; completed sessions optimize historical analytics.
   - **Why**: Different lifecycle and query patterns.
   - **Common mistake**: Putting everything in one bloated document.
2. **How do you prevent unauthorized access?**
   - JWT verification + route guards + email verification middleware.
   - Mistake: Client-side checks only.
3. **How would you scale chat?**
   - Use Socket.io Redis adapter + distributed presence store.
   - Mistake: Assuming in-memory maps scale across pods.
4. **How do you reduce dashboard latency?**
   - Cache aggregate responses with per-user/day key.
   - Mistake: Caching without invalidation/TTL strategy.

## 10) Deep Code Insights
- **Smart**: Redis-backed dashboard cache, email verification gating, socket JWT auth, clear domain route split.
- **Risky/Bad practice**:
  - Hardcoded Redis test write (`set("foo","bar")`) in boot path.
  - Redis TLS forced in local path can fail for local dev.
  - JWT fallback secret in some places is unsafe default.
- **Refactor opportunities**:
  - Centralized validation and consistent error envelope.
  - Service layer for study analytics instead of large route handlers.
  - Typed contracts (e.g., TypeScript/zod) to reduce runtime ambiguity.

## 11) Project Story
- Built to solve fragmented student workflows.
- Inspired by real study friction: planning/execution drift.
- Learned full-stack product thinking, auth hardening, and real-time UX.
- Unique angle: combines timer analytics + social accountability + PWA usability.

## 12) Resume Value
- Built and deployed a full-stack PWA for student productivity with JWT auth, real-time chat, and analytics dashboard.
- Designed study-session state engine supporting pause/resume recovery and weekly performance insights.
- Improved dashboard response times using Redis TTL caching and optimized aggregation paths.
- Implemented secure auth flows including email verification, password reset, and Google OAuth.

## 13) Mock Interview Mode (start)
First question for you:
**“Explain how your study-session lifecycle works end-to-end, including failure handling if a user closes the app mid-session.”**

Reply with your answer and I’ll evaluate it and upgrade it to a senior-level response.
