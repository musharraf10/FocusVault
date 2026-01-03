import { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]);
  const [isInRoom, setIsInRoom] = useState(false);
  const [recentRooms, setRecentRooms] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (socket) {
      // Chat event listeners
      socket.on('chat:joined', (data) => {
        setCurrentRoom(data.roomId);
        setRoomUsers(data.users);
        setIsInRoom(true);
        toast.success(`Joined room: ${data.roomId}`);
      });

      socket.on('chat:user_joined', (data) => {
        setRoomUsers(data.roomUsers);
        setMessages(prev => [...prev, data.message]);
      });

      socket.on('chat:user_left', (data) => {
        setRoomUsers(data.roomUsers);
        setMessages(prev => [...prev, data.message]);
      });

      socket.on('chat:message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      socket.on('chat:room_full', () => {
        toast.error('Room is full (max 5 users)');
      });

      socket.on('chat:error', (data) => {
        toast.error(data.message);
      });

      return () => {
        socket.off('chat:joined');
        socket.off('chat:user_joined');
        socket.off('chat:user_left');
        socket.off('chat:message');
        socket.off('chat:room_full');
        socket.off('chat:error');
      };
    }
    // console.log('Socket available in ChatContext?', socket);
  }, [socket]);

  useEffect(() => {
    if (user) {
      fetchRecentRooms();
    }
  }, [user]);

  const fetchRecentRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/rooms`);
      setRecentRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch recent rooms:', error);
    }
  };

  const joinRoom = async (roomId) => {
    if (!socket || !roomId.trim()) return;

    try {
      // Fetch existing messages
      const response = await axios.get(`${API_URL}/api/chat/messages/${roomId}`);
      setMessages(response.data);

      // Join room via socket
      socket.emit('chat:join', { roomId: roomId.trim() });
    } catch (error) {
      console.error('Failed to join room:', error);
      toast.error('Failed to join room');
    }
  };

  const leaveRoom = () => {
    if (!socket || !currentRoom) return;

    socket.emit('chat:leave', { roomId: currentRoom });
    setCurrentRoom(null);
    setMessages([]);
    setRoomUsers([]);
    setIsInRoom(false);
    toast('Left the room');
  };

  const sendMessage = (message) => {
    if (!socket || !currentRoom || !message.trim()) return;

    socket.emit('chat:send', {
      roomId: currentRoom,
      message: message.trim(),
    });
  };

  const value = {
    currentRoom,
    messages,
    roomUsers,
    isInRoom,
    recentRooms,
    joinRoom,
    leaveRoom,
    sendMessage,
    fetchRecentRooms,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};