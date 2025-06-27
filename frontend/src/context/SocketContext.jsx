import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());

  useEffect(() => {
    // console.log('Auth user:', user);
    // console.log('Email verified:', user?.emailVerified);
    if (user && user.emailVerified) {
      const token = localStorage.getItem('token');
      if (!token) return;
      // console.log('Socket auth token:', token);

      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        // console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        // console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      // Study session events
      newSocket.on('study:started', (data) => {
        toast.success(`Study session started: ${data.subject}`, {
          icon: '📚',
        });
      });

      newSocket.on('study:paused', (data) => {
        toast(`Study session paused: ${data.subject}`, {
          icon: '⏸️',
        });
      });

      newSocket.on('study:resumed', (data) => {
        toast.success(`Study session resumed: ${data.subject}`, {
          icon: '▶️',
        });
      });

      newSocket.on('study:completed', (data) => {
        toast.success(`Study session completed: ${data.subject}`, {
          icon: '✅',
        });
      });

      // Notification events
      newSocket.on('notification', (notification) => {
        toast(notification.message, {
          icon: notification.type === 'study_reminder' ? '📚' : '🔔',
          duration: 5000,
        });
      });

      // Notes events
      newSocket.on('note:created', (data) => {
        toast.success('Note created on another device', {
          icon: '📝',
        });
      });

      newSocket.on('note:updated', (data) => {
        toast('Note updated on another device', {
          icon: '✏️',
        });
      });

      newSocket.on('note:deleted', (data) => {
        toast('Note deleted on another device', {
          icon: '🗑️',
        });
      });

      // Timetable events
      newSocket.on('timetable:updated', (data) => {
        toast('Timetable updated on another device', {
          icon: '📅',
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [user?.emailVerified]);

  // Study session methods
  const emitStudyStart = (data) => {
    if (socket) {
      socket.emit('study:start', data);
    }
  };

  const emitStudyPause = (data) => {
    if (socket) {
      socket.emit('study:pause', data);
    }
  };

  const emitStudyResume = (data) => {
    if (socket) {
      socket.emit('study:resume', data);
    }
  };

  const emitStudyComplete = (data) => {
    if (socket) {
      socket.emit('study:complete', data);
    }
  };

  // Notes methods
  const emitNoteCreate = (data) => {
    if (socket) {
      socket.emit('note:create', data);
    }
  };

  const emitNoteUpdate = (data) => {
    if (socket) {
      socket.emit('note:update', data);
    }
  };

  const emitNoteDelete = (data) => {
    if (socket) {
      socket.emit('note:delete', data);
    }
  };

  // Timetable methods
  const emitTimetableUpdate = (data) => {
    if (socket) {
      socket.emit('timetable:update', data);
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    emitStudyStart,
    emitStudyPause,
    emitStudyResume,
    emitStudyComplete,
    emitNoteCreate,
    emitNoteUpdate,
    emitNoteDelete,
    emitTimetableUpdate,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};