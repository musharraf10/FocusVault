# Focus Vault - Your Personal Study Companion

A modern, production-ready Progressive Web App (PWA) built with the MERN stack to help students and learners stay organized, motivated, and productive in their educational journey.

## ✨ Features

### 📚 Study Management

- **Smart Study Timer**: Track study sessions with intelligent timing and progress analytics
- **Timetable Management**: Create and manage up to 3 weekly timetables with custom schedules
- **Session Tracking**: Monitor actual vs target study time with detailed statistics
- **Progress Analytics**: Visual charts showing weekly progress and subject distribution

### 📝 Note Taking

- **Rich Note Editor**: Create, edit, and organize study notes with tags and categories
- **Search & Filter**: Quickly find notes with full-text search functionality
- **Pin Important Notes**: Keep important notes at the top for easy access
- **Responsive Design**: Optimized for both desktop and mobile note-taking

### ✅ Task Management

- **Smart Todo Lists**: Create tasks with priorities, due dates, and categories
- **Progress Tracking**: Visual progress indicators and completion statistics
- **Overdue Alerts**: Clear indicators for overdue tasks
- **Category Organization**: Organize tasks by study, personal, work, and health categories

### 📅 Calendar Integration

- **Event Management**: Schedule study sessions, exams, assignments, and reminders
- **Study Streaks**: Track daily study habits with visual streak indicators
- **Multiple Event Types**: Support for different event types with color coding
- **Mobile-Optimized**: Touch-friendly calendar interface for mobile devices

### 👥 Social Features

- **Study Chat Rooms**: Connect with up to 5 study partners in real-time chat rooms
- **Motivation System**: Share progress and motivate each other
- **Room Management**: Create or join study rooms with unique room IDs

### 🔧 User Experience

- **Progressive Web App**: Install on any device, works offline
- **Dark/Light Theme**: Automatic theme switching with user preferences
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Touch Optimizations**: Gesture-friendly interface for mobile devices
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support

## 🛠 Tech Stack

### Frontend

- **React 18** - Modern UI framework with hooks and context
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful, customizable icons
- **Recharts** - Responsive chart library
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Redis** - Caching and session storage
- **Socket.io** - Real-time communication
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware

### DevOps & Performance

- **Rate Limiting** - API protection with Redis-backed rate limiting
- **Compression** - Gzip compression for faster loading
- **Caching** - Redis caching for frequently accessed data
- **Error Handling** - Comprehensive error handling and logging
- **Security** - CORS, Helmet, input validation, and sanitization

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 4.4+
- Redis 6+ (optional, falls back to memory storage)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/focus-vault.git
   cd focus-vault
   ```

2. **Install dependencies**

   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**

   Create `.env` file in the server directory:

   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/focusvault

   # Redis (optional)
   REDIS_URL=redis://localhost:6379

   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here

   # Client URL
   CLIENT_URL=http://localhost:5173

   # Server Port
   PORT=5000
   ```

4. **Start the development servers**

   Terminal 1 (Backend):

   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 (Frontend):

   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

## 📱 PWA Installation

### Mobile (iOS/Android)

1. Open the app in your mobile browser
2. Look for "Add to Home Screen" or "Install App" prompt
3. Follow the installation prompts
4. Launch from your home screen like a native app

### Desktop (Chrome/Edge)

1. Open the app in your browser
2. Click the install icon in the address bar
3. Click "Install" in the popup
4. Access from your desktop or start menu

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse with Redis-backed rate limiting
- **Authentication**: Secure JWT-based authentication
- **Input Validation**: Comprehensive input sanitization and validation
- **CORS Protection**: Configured for specific origins
- **Helmet Security**: Security headers and XSS protection
- **Password Hashing**: bcrypt with salt rounds
- **Error Handling**: Secure error messages without sensitive data exposure

## 📊 Performance Optimizations

- **Redis Caching**: Frequently accessed data cached for faster responses
- **API Debouncing**: Search queries debounced to prevent excessive API calls
- **Code Splitting**: Automatic code splitting for faster initial loads
- **Image Optimization**: Cloudinary integration for optimized images
- **Compression**: Gzip compression for all responses
- **Bundle Optimization**: Optimized Vite build with tree shaking

## 🧪 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/resend-verification` - Resend email verification

### Study Endpoints

- `GET /api/study/dashboard` - Get dashboard data
- `GET /api/study/sessions` - Get study sessions
- `POST /api/study/sessions` - Create study session
- `GET /api/study/timetables` - Get user timetables
- `POST /api/study/timetables` - Create timetable
- `GET /api/study/notes` - Get user notes
- `POST /api/study/notes` - Create note

### Todo Endpoints

- `GET /api/todo` - Get user todos
- `POST /api/todo` - Create todo
- `PUT /api/todo/:id` - Update todo
- `DELETE /api/todo/:id` - Delete todo

### Calendar Endpoints

- `GET /api/calendar/events` - Get calendar events
- `POST /api/calendar/events` - Create event
- `PUT /api/calendar/events/:id` - Update event
- `DELETE /api/calendar/events/:id` - Delete event

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- UI inspiration from modern productivity apps
- Charts powered by [Recharts](https://recharts.org/)
- Animations by [Framer Motion](https://www.framer.com/motion/)

## 📞 Support

For support, email skmusharaf01@gmail.com or create an issue on GitHub.

---

**Focus Vault** - Built with ❤️ for learners everywhere
