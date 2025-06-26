import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Clock, MapPin, User, Flame } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [studyStreaks, setStudyStreaks] = useState([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    type: 'other',
    subject: '',
    priority: 'medium'
  });
  const [buttonLoading, setButtonLoading] = useState({
    add: false,
    edit: false,
    delete: {}
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const eventTypes = [
    { value: 'study', label: 'Study Session', color: 'bg-blue-500', textColor: 'text-blue-600' },
    { value: 'exam', label: 'Exam', color: 'bg-red-500', textColor: 'text-red-600' },
    { value: 'assignment', label: 'Assignment', color: 'bg-orange-500', textColor: 'text-orange-600' },
    { value: 'reminder', label: 'Reminder', color: 'bg-green-500', textColor: 'text-green-600' },
    { value: 'other', label: 'Other', color: 'bg-purple-500', textColor: 'text-purple-600' }
  ];

  useEffect(() => {
    fetchEvents();
    fetchStudyStreaks();
  }, [currentDate]);

  useEffect(() => {
    setNewEvent(prev => ({ ...prev, date: format(selectedDate, 'yyyy-MM-dd') }));
  }, [selectedDate]);

  const fetchEvents = async () => {
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      const response = await axios.get(`${API_URL}/api/calendar/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchStudyStreaks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/calendar/streaks`);
      setStudyStreaks(response.data);
    } catch (error) {
      console.error('Failed to fetch study streaks:', error);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }

    try {
      setButtonLoading(prev => ({ ...prev, add: true }));
      const response = await axios.post(`${API_URL}/api/calendar/events`, newEvent);
      setEvents([...events, response.data]);
      setNewEvent({
        title: '',
        description: '',
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: '',
        endTime: '',
        type: 'other',
        subject: '',
        priority: 'medium'
      });
      setIsAddingEvent(false);
      toast.success('Event added successfully!');
    } catch (error) {
      toast.error('Failed to add event');
    } finally {
      setButtonLoading(prev => ({ ...prev, add: false }));
    }
  };

  const handleEditEvent = async () => {
    if (!editingEvent.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }

    try {
      setButtonLoading(prev => ({ ...prev, edit: true }));
      const response = await axios.put(`${API_URL}/api/calendar/events/${editingEvent._id}`, editingEvent);
      setEvents(events.map(event => event._id === editingEvent._id ? response.data : event));
      setEditingEvent(null);
      toast.success('Event updated successfully!');
    } catch (error) {
      toast.error('Failed to update event');
    } finally {
      setButtonLoading(prev => ({ ...prev, edit: false }));
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      setButtonLoading(prev => ({ ...prev, delete: { ...prev.delete, [id]: true } }));
      await axios.delete(`${API_URL}/api/calendar/events/${id}`);
      setEvents(events.filter(event => event._id !== id));
      toast.success('Event deleted');
    } catch (error) {
      toast.error('Failed to delete event');
    } finally {
      setButtonLoading(prev => ({ ...prev, delete: { ...prev.delete, [id]: false } }));
    }
  };

  const getEventTypeConfig = (type) => {
    return eventTypes.find(t => t.value === type) || eventTypes[4];
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDate = (date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const hasStudyStreak = (date) => {
    return studyStreaks.some(streak => isSameDay(new Date(streak.date), date));
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Calendar
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Plan your study schedule
        </p>
      </motion.div>

      {/* Calendar Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft size={20} />
          </motion.button>

          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h2>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            <ChevronRight size={20} />
          </motion.button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth().map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const hasStreak = hasStudyStreak(date);
            const isSelected = isSameDay(date, selectedDate);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isTodayDate = isToday(date);

            return (
              <motion.button
                key={date.toISOString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(date)}
                className={`relative aspect-square p-1 rounded-xl text-sm font-medium transition-all duration-200 ${isSelected
                  ? 'bg-gradient-to-br from-primary-500 to-secondary-500 text-white'
                  : isTodayDate
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600'
                    : isCurrentMonth
                      ? 'text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{format(date, 'd')}</span>

                  {/* Event indicators */}
                  <div className="flex items-center space-x-1 mt-1">
                    {hasStreak && (
                      <Flame size={8} className="text-pink-700" />
                    )}
                    {dayEvents.length > 0 && (
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Selected Date Events */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingEvent(true)}
            disabled={buttonLoading.add}
            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-xl flex items-center space-x-1 text-sm sm:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonLoading.add ? (
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-1" />
            ) : (
              <>
                <Plus size={14} className="shrink-0" />
                <span className="truncate">Add Event</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Add Event Form */}
        <AnimatePresence>
          {isAddingEvent && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
            >
              <h4 className="font-bold text-gray-800 dark:text-white mb-4">Add New Event</h4>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Event title..."
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                />

                <textarea
                  placeholder="Description (optional)..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={2}
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white resize-none"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={newEvent.type}
                      onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                    >
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Subject..."
                      value={newEvent.subject}
                      onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value })}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddEvent}
                    disabled={buttonLoading.add}
                    className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {buttonLoading.add ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" />
                    ) : (
                      'Add Event'
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsAddingEvent(false);
                      setNewEvent({
                        title: '',
                        description: '',
                        date: format(selectedDate, 'yyyy-MM-dd'),
                        startTime: '',
                        endTime: '',
                        type: 'other',
                        subject: '',
                        priority: 'medium'
                      });
                    }}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Events List */}
        <div className="space-y-3">
          <AnimatePresence>
            {selectedDateEvents.map((event, index) => {
              const typeConfig = getEventTypeConfig(event.type);

              return (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"
                >
                  {editingEvent?._id === event._id ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editingEvent.title}
                        onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                      />
                      <div className="flex space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleEditEvent}
                          disabled={buttonLoading.edit}
                          className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-2 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {buttonLoading.edit ? (
                            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto" />
                          ) : (
                            'Save Changes'
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setEditingEvent(null)}
                          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`w-3 h-3 ${typeConfig.color} rounded-full mt-2`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 dark:text-white">
                            {event.title}
                          </h4>
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {(event.startTime || event.endTime) && (
                              <div className="flex items-center space-x-1">
                                <Clock size={14} />
                                <span>
                                  {event.startTime && format(new Date(`2000-01-01T${event.startTime}`), 'h:mm a')}
                                  {event.startTime && event.endTime && ' - '}
                                  {event.endTime && format(new Date(`2000-01-01T${event.endTime}`), 'h:mm a')}
                                </span>
                              </div>
                            )}
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${typeConfig.textColor} bg-opacity-10`}>
                              {typeConfig.label}
                            </span>
                            {event.subject && (
                              <span className="text-xs">
                                {event.subject}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingEvent(event)}
                          className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteEvent(event._id)}
                          disabled={buttonLoading.delete[event._id]}
                          className="p-2 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {buttonLoading.delete[event._id] ? (
                            <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {selectedDateEvents.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                No events scheduled for this day
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Tap "Add Event" to create your first event
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Calendar;