import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Clock, Target, Book, CheckCircle, PauseCircle, Save, ArrowLeft, Home, Volume2, VolumeX } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SessionManager from './StudySession';

const StudyTimer = () => {
  const {
    currentSession,
    isStudying,
    startStudySession,
    pauseSession,
    resumeSession,
    updateSessionTime,
    endSession,
    studyData,
    fetchDashboardAndTimetables,
    getPausedSessions,
    getSessionBySubject,
    fetchCompletedSubjects,
  } = useStudy();

  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [alarmMuted, setAlarmMuted] = useState(false);
  const [loading, setLoading] = useState({
    start: false,
    pause: false,
    resume: false,
    end: false,
    saveNotes: false,
  });
  const audioRef = useRef(null);

  // Initialize SessionManager
  const { elapsedTime, saveSessionTimeImmediate, resetSession } = SessionManager({
    currentSession,
    isStudying,
    updateSessionTime,
    onTimeUpdate: (time) => {
      if (currentSession && isStudying) {
        const targetTime = getSubjectDuration(currentSession.subject) * 60;
        if (time === targetTime && !isAlarmPlaying && !alarmMuted) {
          setIsAlarmPlaying(true);
          playAlarm();
        }
      }
    },
  });

  const getTodayKey = () =>
    new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Initialize audio
  useEffect(() => {
    audioRef.current = {
      audioContext: null,
      source: null,
      isPlaying: false,
      alarmBuffer: null,
    };

    try {
      audioRef.current.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const createAlarmSound = () => {
        const sampleRate = audioRef.current.audioContext.sampleRate;
        const duration = 0.5;
        const frameCount = sampleRate * duration;
        const arrayBuffer = audioRef.current.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = arrayBuffer.getChannelData(0);

        for (let i = 0; i < frameCount; i++) {
          channelData[i] = Math.sin(2 * Math.PI * 800 * i / sampleRate) * 0.3;
        }
        return arrayBuffer;
      };

      audioRef.current.alarmBuffer = createAlarmSound();

      // Resume audio context on user interaction
      const resumeAudioContext = () => {
        if (audioRef.current.audioContext.state === 'suspended') {
          audioRef.current.audioContext.resume().catch(err => {
            console.error('Failed to resume audio context:', err);
          });
        }
      };

      document.addEventListener('click', resumeAudioContext);
      document.addEventListener('keydown', resumeAudioContext);

      return () => {
        document.removeEventListener('click', resumeAudioContext);
        document.removeEventListener('keydown', resumeAudioContext);
        if (audioRef.current.source) {
          audioRef.current.source.stop();
          audioRef.current.source = null;
        }
        if (audioRef.current.audioContext) {
          audioRef.current.audioContext.close().catch(err => {
            console.error('Failed to close audio context:', err);
          });
        }
        audioRef.current.isPlaying = false;
      };
    } catch (err) {
      console.error('Failed to initialize audio context:', err);
      toast.error('Audio initialization failed. Please try refreshing the page.');
    }
  }, []);

  // Update session notes and reset alarm when session changes
  useEffect(() => {
    if (currentSession && isStudying) {
      setSessionNotes(currentSession.notes || '');
    } else {
      setSessionNotes('');
      setShowNotes(false);
      setIsAlarmPlaying(false);
      setAlarmMuted(false);
      stopAlarm();
    }
  }, [currentSession?.sessionId, isStudying]);

  // Play alarm
  const playAlarm = () => {
    if (alarmMuted || !audioRef.current.audioContext || audioRef.current.isPlaying) {
      return;
    }

    audioRef.current.isPlaying = true;

    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Study Session Complete! 🎉', {
            body: `You've completed your ${currentSession?.subject} study session!`,
            icon: '/pwa-192x192.png',
            tag: 'study-complete',
          });
        }
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Study Session Complete! kaas🎉', {
        body: `You've completed your ${currentSession?.subject} study session!`,
        icon: '/pwa-192x192.png',
        tag: 'study-complete',
      });
    }

    const playSingleBeep = () => {
      if (!audioRef.current.isPlaying || alarmMuted) {
        audioRef.current.source = null;
        return;
      }

      try {
        const source = audioRef.current.audioContext.createBufferSource();
        const gainNode = audioRef.current.audioContext.createGain();
        source.buffer = audioRef.current.alarmBuffer;
        source.connect(gainNode);
        gainNode.connect(audioRef.current.audioContext.destination);
        gainNode.gain.setValueAtTime(0.3, audioRef.current.audioContext.currentTime);
        audioRef.current.source = source;
        source.start();

        source.onended = () => {
          audioRef.current.source = null;
          if (audioRef.current.isPlaying && !alarmMuted) {
            playSingleBeep();
          }
        };
      } catch (err) {
        console.error('Failed to play alarm:', err);
        audioRef.current.isPlaying = false;
        setIsAlarmPlaying(false);
      }
    };

    if (audioRef.current.audioContext.state === 'suspended') {
      audioRef.current.audioContext.resume().then(() => {
        playSingleBeep();
      }).catch(err => {
        console.error('Failed to resume audio context:', err);
        audioRef.current.isPlaying = false;
        setIsAlarmPlaying(false);
      });
    } else {
      playSingleBeep();
    }

    toast.success('🎉 Study session target reached!', {
      duration: 5000,
      position: 'top-center',
    });
  };

  // Stop alarm
  const stopAlarm = () => {
    setIsAlarmPlaying(false);
    audioRef.current.isPlaying = false;
    if (audioRef.current.source) {
      try {
        audioRef.current.source.stop();
      } catch (err) {
        console.error('Failed to stop audio source:', err);
      }
      audioRef.current.source = null;
    }
  };

  // Mute alarm
  const muteAlarm = () => {
    setAlarmMuted(true);
    stopAlarm();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSubjectDuration = (subject) => {
    const activeTimetable = studyData.activeTimetable;
    if (!activeTimetable) return 60;
    const todayKey = getTodayKey();
    const todaySchedule = activeTimetable.schedule?.[todayKey] || [];
    const scheduleItem = todaySchedule.find(item => item.subject === subject);
    return scheduleItem ? scheduleItem.duration : 60;
  };

  const getTodaySchedule = () => {
    const activeTimetable = studyData.activeTimetable;
    if (!activeTimetable) return [];
    const todayKey = getTodayKey();
    return activeTimetable.schedule?.[todayKey] || [];
  };

  const handleStartSession = async () => {
    if (selectedSubject && !loading.start) {
      setLoading(prev => ({ ...prev, start: true }));
      try {
        const targetTime = getSubjectDuration(selectedSubject) * 60;
        await startStudySession(selectedSubject, targetTime);
        resetSession();
        setSessionNotes('');
        setIsAlarmPlaying(false);
        setAlarmMuted(false);
        stopAlarm();
      } catch (error) {
        console.error('Failed to start session:', error);
        toast.error('Failed to start session');
      } finally {
        setLoading(prev => ({ ...prev, start: false }));
      }
    }
  };

  const handlePauseSession = async () => {
    if (loading.pause) return;
    setLoading(prev => ({ ...prev, pause: true }));
    try {
      stopAlarm();
      await saveSessionTimeImmediate();
      await pauseSession();
      await fetchDashboardAndTimetables();
      await fetchCompletedSubjects();
    } catch (error) {
      console.error('Failed to pause session:', error);
      toast.error('Failed to pause session');
    } finally {
      setLoading(prev => ({ ...prev, pause: false }));
    }
  };

  const handleResumeSession = async (sessionId = null) => {
    if (loading.resume) return;
    setLoading(prev => ({ ...prev, resume: true }));
    try {
      await resumeSession(sessionId);
      const session = getSessionBySubject(currentSession?.subject || selectedSubject);
      if (session) {
        setSessionNotes(session.notes || '');
      }
      await fetchDashboardAndTimetables();
    } catch (error) {
      console.error('Failed to resume session:', error);
      toast.error('Failed to resume session');
    } finally {
      setLoading(prev => ({ ...prev, resume: false }));
    }
  };

  const handleEndSession = async () => {
    if (loading.end) return;
    setLoading(prev => ({ ...prev, end: true }));
    try {
      stopAlarm();
      await saveSessionTimeImmediate();
      await endSession(currentSession?.sessionId, sessionNotes);
      resetSession();
      setSessionNotes('');
      setShowNotes(false);
      setIsAlarmPlaying(false);
      setAlarmMuted(false);
      await fetchDashboardAndTimetables();
      await fetchCompletedSubjects();
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end session');
    } finally {
      setLoading(prev => ({ ...prev, end: false }));
    }
  };

  const handleSaveNotes = async () => {
    if (loading.saveNotes || !currentSession) return;
    setLoading(prev => ({ ...prev, saveNotes: true }));
    try {
      await saveSessionTimeImmediate();
      await updateSessionTime(currentSession.sessionId, elapsedTime, sessionNotes);
      setShowNotes(false);
      toast.success('Notes saved successfully');
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setLoading(prev => ({ ...prev, saveNotes: false }));
    }
  };

  const todaySchedule = getTodaySchedule();
  const completedSubjects = studyData.completedSubjects || [];
  const pausedSessions = getPausedSessions();

  const getSubjectStatus = (subject) => {
    const completed = completedSubjects.find(s => s.subject === subject && s.completed);
    if (completed) return 'completed';
    const paused = pausedSessions.find(s => s.subject === subject);
    if (paused) return 'paused';
    const active = currentSession?.subject === subject;
    if (active) return 'active';
    return 'pending';
  };

  const getSubjectActualTime = (subject) => {
    const completed = completedSubjects.find(s => s.subject === subject);
    if (completed) return completed.actualTime || 0;
    const paused = pausedSessions.find(s => s.subject === subject);
    if (paused) return paused.elapsedTime || 0;
    if (currentSession?.subject === subject) {
      return elapsedTime;
    }
    return 0;
  };

  // JSX
  if (currentSession && isStudying) {
    const targetTime = currentSession.targetTime || 3600;
    const progress = (elapsedTime / targetTime) * 100;
    const isCompleted = progress >= 100;

    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              await saveSessionTimeImmediate();
              await handlePauseSession();
              navigate('/reading');
            }}
            disabled={loading.pause}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 disabled:opacity-50"
          >
            <ArrowLeft size={20} />
            <span>{loading.pause ? 'Pausing...' : 'Back'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              await saveSessionTimeImmediate();
              navigate('/');
            }}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300"
          >
            <Home size={20} />
            <span>Home</span>
          </motion.button>
        </div>

        {/* Alarm Alert */}
        {isAlarmPlaying && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h3 className="font-bold">🎉 Target Time Reached!</h3>
                  <p className="text-sm opacity-90">You've completed your {currentSession?.subject} study session!</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={muteAlarm}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  {alarmMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopAlarm}
                  className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors font-medium"
                >
                  Continue
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 text-center">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200 dark:text-gray-600"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke={isCompleted ? "#10B981" : "url(#gradient)"}
                strokeWidth="4"
                fill="none"
                className="transition-all duration-300"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  of {formatTime(targetTime)}
                </div>
                {isCompleted && (
                  <div className="text-green-500 text-xs font-medium mt-1">
                    ✓ Completed
                  </div>
                )}
              </div>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            {currentSession.subject}
          </h3>

          <div className="flex justify-center space-x-4 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePauseSession}
              disabled={loading.pause}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 disabled:opacity-50"
            >
              <Pause size={20} />
              <span>{loading.pause ? 'Pausing...' : 'Pause'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotes(!showNotes)}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl flex items-center space-x-2"
            >
              <Book size={20} />
              <span>Notes</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEndSession}
              disabled={loading.end}
              className="bg-red-500 text-white px-6 py-3 rounded-xl flex items-center space-x-2 disabled:opacity-50"
            >
              <Square size={20} />
              <span>{loading.end ? 'Ending...' : 'End'}</span>
            </motion.button>
          </div>

          {showNotes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 text-left"
            >
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Add your study notes here..."
                className="w-full h-24 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveNotes}
                disabled={loading.saveNotes}
                className="mt-2 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
              >
                <Save size={16} />
                <span>{loading.saveNotes ? 'Saving...' : 'Save Notes'}</span>
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {pausedSessions.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
            <PauseCircle className="text-orange-600" size={20} />
            <span>Resume Paused Sessions</span>
          </h3>

          <div className="space-y-3">
            {pausedSessions.map((session) => (
              <motion.div
                key={session.sessionId}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <PauseCircle className="text-white" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{session.subject}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Paused at: {formatTime(session.elapsedTime || 0)}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleResumeSession(session.sessionId)}
                  disabled={loading.resume}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 disabled:opacity-50"
                >
                  <Play size={16} />
                  <span>{loading.resume ? 'Resuming...' : 'Resume'}</span>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
          <Target className="text-primary-600" size={20} />
          <span>Start Study Session</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Subject from Today's Schedule
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="">Choose a subject</option>
              {todaySchedule
                .filter(subject => getSubjectStatus(subject.subject) === 'pending')
                .map((subject, index) => (
                  <option key={index} value={subject.subject}>
                    {subject.subject} ({subject.duration} min)
                  </option>
                ))}
            </select>
          </div>

          {selectedSubject && (
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Duration: <span className="font-medium">{getSubjectDuration(selectedSubject)} minutes</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Duration is automatically set from your timetable
              </p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartSession}
            disabled={!selectedSubject || loading.start}
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Play size={20} />
            <span>{loading.start ? 'Starting...' : 'Start Session'}</span>
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
          <Book className="text-primary-600" size={20} />
          <span>Today's Schedule</span>
        </h3>

        {todaySchedule.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500 dark:text-gray-400">No subjects scheduled for today</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Create a timetable to see your daily schedule here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySchedule
              .filter(subject => getSubjectStatus(subject.subject) === 'pending')
              .map((subject, index) => (
                <motion.div
                  key={`pending-${index}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => setSelectedSubject(subject.subject)}
                  className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer transition-all duration-200 ${selectedSubject === subject.subject
                    ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                      <Clock className="text-white" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{subject.subject}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {subject.time} • {subject.duration} min
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                    Pending
                  </span>
                </motion.div>
              ))}

            {todaySchedule
              .filter(subject => getSubjectStatus(subject.subject) === 'paused')
              .map((subject, index) => (
                <motion.div
                  key={`paused-${index}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <PauseCircle className="text-white" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{subject.subject}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {subject.time} • {subject.duration} min • Spent: {formatTime(getSubjectActualTime(subject.subject))}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                    Paused
                  </span>
                </motion.div>
              ))}

            {todaySchedule
              .filter(subject => getSubjectStatus(subject.subject) === 'completed')
              .map((subject, index) => (
                <motion.div
                  key={`completed-${index}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl opacity-75"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-white" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white line-through">
                        {subject.subject}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {subject.time} • {subject.duration} min • Spent: {formatTime(getSubjectActualTime(subject.subject))}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    ✓
                  </span>
                </motion.div>
              ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
          <Clock className="text-primary-600" size={20} />
          <span>Today's Progress</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {completedSubjects.filter(s => s.completed).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {pausedSessions.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Paused</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatTime(completedSubjects.reduce((total, s) => total + (s.actualTime || 0), 0))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {todaySchedule.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Scheduled</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StudyTimer;