import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Pause, Square, BookOpen, Calendar, MessageCircle, CheckCircle } from 'lucide-react';
import StudyTimer from '../components/study/StudyTimer';
import TimetableView from '../components/study/TimetableView';
import NotesView from '../components/study/NotesView';
import CompletedSubjects from '../components/study/CompletedSubjects';
import ChatRoom from '../components/study/ChatRoom';
import StudySession from '../components/study/StudySession';
import { useStudy } from '../context/StudyContext';
import { useNavigate } from 'react-router-dom';

const ReadingSpace = () => {
  const [activeTab, setActiveTab] = useState('continue');
  const [inSession, setInSession] = useState(false);

  const navigate = useNavigate();
  const tabs = [
    { id: 'continue', label: 'Continue Reading', icon: Play },
    { id: 'timetable', label: 'Time Table', icon: Calendar },
    { id: 'notes', label: 'Notes', icon: BookOpen },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
    { id: 'chat', label: 'Chat Room', icon: MessageCircle }
  ];

  const renderTabContent = () => {
    if (inSession) {
      return (
        <StudySession
          onNavigateBack={() => navigate('/reading')}
          onNavigateHome={() => {
            setInSession(false);
            setActiveTab('continue');
          }}
        />
      );
    }

    switch (activeTab) {
      case 'continue':
        return <StudyTimer />;
      case 'timetable':
        return <TimetableView />;
      case 'notes':
        return <NotesView />;
      case 'completed':
        return <CompletedSubjects />;
      case 'chat':
        return <ChatRoom />;
      default:
        return <StudyTimer />;
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Reading Space
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Focus on your learning journey
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="overflow-x-auto">
        <div className="flex space-x-2 pb-2  pt-2 pl-1 min-w-max">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${activeTab === tab.id
                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg border-none focus:ring-0 outline-none'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 focus:ring-0 outline-none'
                }`}
            >
              <tab.icon size={16} />
              <span className="text-sm">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>


      {/* Tab Content */}
      <div className="min-h-[60vh]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ReadingSpace;